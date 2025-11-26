// Google Sheets API Helper Functions with Fallbacks
let gapiLoaded = false;
let gapiInitialized = false;

// Initialize Google API (now uses Google OAuth from google-auth.js)
async function initGAPI() {
  // Use new Google Auth system if enabled
  if (CONFIG.SECURITY && CONFIG.SECURITY.USE_GOOGLE_AUTH && window.GoogleAuth) {
    try {
      if (!GoogleAuth.isAuthenticated()) {
        // Not authenticated - redirect to login
        sessionStorage.setItem('redirect_after_login', window.location.pathname);
        window.location.href = 'login-google.html';
        return false;
      }
      
      // Already authenticated via Google OAuth
      gapiLoaded = true;
      gapiInitialized = true;
      return true;
    } catch (error) {
      console.error('Google Auth check error:', error);
      return false;
    }
  }
  
  // Legacy initialization (if Google Auth not enabled)
  if (gapiLoaded && gapiInitialized) return true;
  
  return new Promise((resolve, reject) => {
    if (!window.gapi) {
      reject(new Error('gapi not loaded'));
      return;
    }
    
    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          apiKey: CONFIG.API_KEY,
          clientId: CONFIG.CLIENT_ID,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          scope: 'https://www.googleapis.com/auth/spreadsheets'
        });
        
        gapiLoaded = true;
        gapiInitialized = true;
        
        // Check if user is signed in
        const authInstance = gapi.auth2.getAuthInstance();
        if (!authInstance.isSignedIn.get()) {
          await authInstance.signIn();
        }
        
        resolve(true);
      } catch (error) {
        console.error('GAPI init error:', error);
        gapiInitialized = false;
        resolve(false);
      }
    });
  });
}

function getSpreadsheetId(sheetKey = 'SALES') {
  if (CONFIG.SPREADSHEETS && CONFIG.SPREADSHEETS[sheetKey]) {
    return CONFIG.SPREADSHEETS[sheetKey];
  }
  return CONFIG.SHEET_ID;
}

// Load sheet data with fallbacks
async function loadSheet(range, sheetKey = 'SALES') {
  const spreadsheetId = getSpreadsheetId(sheetKey);
  
  try {
    // Try Google Sheets API first
    if (gapiInitialized && CONFIG.API_KEY && CONFIG.API_KEY !== 'YOUR_SHEETS_API_KEY') {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: range
      });
      return { success: true, values: response.result.values || [] };
    }
  } catch (error) {
    console.warn('Sheets API failed, trying fallback:', error);
  }
  
  // Fallback 1: CSV export
  try {
    const sheetName = range.split('!')[0];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    const csvText = await fetch(csvUrl).then(r => r.text());
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const values = [parsed.meta.fields].concat(parsed.data.map(row => parsed.meta.fields.map(f => row[f] || '')));
    return { success: true, values: values };
  } catch (error) {
    console.warn('CSV fallback failed:', error);
  }
  
  // Fallback 2: GAS Proxy
  try {
    if (CONFIG.GAS_PROXY_URL && CONFIG.GAS_PROXY_URL !== 'https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec') {
      const response = await fetch(`${CONFIG.GAS_PROXY_URL}?range=${encodeURIComponent(range)}`).then(r => r.json());
      return { success: true, values: response.values || [] };
    }
  } catch (error) {
    console.warn('GAS proxy failed:', error);
  }
  
  // Fallback 3: Sample data
  return { success: false, values: getSampleDataForRange(range), fallback: true };
}

// Get sample data based on range
function getSampleDataForRange(range) {
  if (range.startsWith('Orders!')) {
    return [CONFIG.SHEETS.ORDERS.cols, ...CONFIG.SAMPLE_DATA.orders];
  } else if (range.startsWith('Inventory!')) {
    const rows = [CONFIG.SHEETS.INVENTORY.cols];
    CONFIG.SAMPLE_DATA.inventory.forEach(item => {
      rows.push([
        item.productID,
        item.name,
        item.description,
        item.unitCost,
        item.reorderLevel,
        item.stock.Bangalore,
        item.stock.Kolkata,
        item.stock.Chennai,
        item.stock.Mumbai
      ]);
    });
    return rows;
  } else if (range.startsWith('Gaps!')) {
    const rows = [CONFIG.SHEETS.GAPS.cols];
    CONFIG.SAMPLE_DATA.gaps.forEach(item => {
      rows.push([
        item.product,
        item.location,
        item.pendingQty,
        item.totalGaps,
        item.dateCreated
      ]);
    });
    return rows;
  } else if (range.startsWith('StockMovements!')) {
    return [CONFIG.SHEETS.STOCK_MOVEMENTS.cols];
  }
  return [];
}

// Save/append to sheet (with audit logging)
async function saveSheet(range, values, sheetKey = 'SALES') {
  const spreadsheetId = getSpreadsheetId(sheetKey);
  
  try {
    if (gapiInitialized && CONFIG.API_KEY && CONFIG.API_KEY !== 'YOUR_SHEETS_API_KEY') {
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: { values: Array.isArray(values[0]) ? values : [values] }
      });
      
      // Log audit event
      if (typeof logAuditEvent === 'function') {
        const entity = range.split('!')[0];
        await logAuditEvent({
          action: 'CREATE',
          entity: entity,
          entityID: values[0] || '',
          newValue: values,
          details: `Added new record to ${entity}`
        });
      }
      
      return { success: true };
    }
  } catch (error) {
    console.error('Save failed:', error);
  }
  
  // Fallback: Store in localStorage
  const key = `sheet_${sheetKey}_${range.replace('!', '_')}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push(...(Array.isArray(values[0]) ? values : [values]));
  localStorage.setItem(key, JSON.stringify(existing));
  showToast('Saved to local storage (API not configured)', 'warning');
  return { success: true, local: true };
}

// Update sheet range
async function updateSheet(range, values, sheetKey = 'INVENTORY') {
  const spreadsheetId = getSpreadsheetId(sheetKey);
  
  try {
    if (gapiInitialized && CONFIG.API_KEY && CONFIG.API_KEY !== 'YOUR_SHEETS_API_KEY') {
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: { values: values }
      });
      return { success: true };
    }
  } catch (error) {
    console.error('Update failed:', error);
    showToast('Update failed - using local storage', 'warning');
  }
  return { success: false };
}

// Load all data
async function loadAllData() {
  try {
    const [ordersRes, inventoryRes, movementsRes, gapsRes] = await Promise.all([
      loadSheet(CONFIG.SHEETS.ORDERS.range, CONFIG.SHEETS.ORDERS.sheetKey),
      loadSheet(CONFIG.SHEETS.INVENTORY.range, CONFIG.SHEETS.INVENTORY.sheetKey),
      loadSheet(CONFIG.SHEETS.STOCK_MOVEMENTS.range, CONFIG.SHEETS.STOCK_MOVEMENTS.sheetKey),
      loadSheet(CONFIG.SHEETS.GAPS.range, CONFIG.SHEETS.GAPS.sheetKey)
    ]);
    
    const data = {
      orders: parseOrders(ordersRes.values || []),
      inventory: parseInventory(inventoryRes.values || []),
      movements: parseMovements(movementsRes.values || []),
      gaps: parseGaps(gapsRes.values || [])
    };
    
    // Auto-add products from sales data (if AutoProduct is available)
    if (typeof AutoProduct !== 'undefined' && AutoProduct.syncProductsFromOrders) {
      // Run async without blocking
      AutoProduct.syncProductsFromOrders().catch(err => {
        console.warn('Auto-product sync failed:', err);
      });
    }
    
    return data;
  } catch (error) {
    console.error('Load all failed:', error);
    return getSampleData();
  }
}

// Parse data arrays into objects
function parseOrders(rows) {
  if (!rows || rows.length < 2) return [];
  const cols = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    cols.forEach((col, i) => {
      obj[col.toLowerCase().replace(/\s+/g, '')] = row[i] || '';
    });
    return obj;
  });
}

function parseInventory(rows) {
  if (!rows || rows.length < 2) return [];
  const cols = rows[0];
  return rows.slice(1).map(row => {
    if (!row[0]) return null;
    return {
      productID: row[0],
      name: row[1] || '',
      description: row[2] || '',
      unitCost: parseFloat(row[3]) || 0,
      reorderLevel: parseInt(row[4]) || 0,
      stock: {
        Bangalore: parseInt(row[5]) || 0,
        Kolkata: parseInt(row[6]) || 0,
        Chennai: parseInt(row[7]) || 0,
        Mumbai: parseInt(row[8]) || 0
      }
    };
  }).filter(Boolean);
}

function parseMovements(rows) {
  if (!rows || rows.length < 2) return [];
  const cols = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    cols.forEach((col, i) => {
      const key = col.toLowerCase().replace(/\s+/g, '');
      obj[key] = row[i] || '';
      // Also map SerialNumbers explicitly
      if (col === 'SerialNumbers') {
        obj.serialNumbers = row[i] || '';
      }
    });
    return obj;
  }).filter(m => m.date);
}

function parseGaps(rows) {
  if (!rows || rows.length < 2) return [];
  const cols = rows[0];
  return rows.slice(1).map(row => {
    return {
      product: row[0] || '',
      location: row[1] || '',
      pendingQty: parseInt(row[2]) || 0,
      totalGaps: parseInt(row[3]) || 0,
      dateCreated: row[4] || ''
    };
  }).filter(g => g.product);
}

function getSampleData() {
  return {
    orders: parseOrders([CONFIG.SHEETS.ORDERS.cols, ...CONFIG.SAMPLE_DATA.orders]),
    inventory: CONFIG.SAMPLE_DATA.inventory,
    movements: [],
    gaps: CONFIG.SAMPLE_DATA.gaps
  };
}

// Update stock for a product/warehouse
async function updateStock(productID, warehouse, delta) {
  try {
    const inventoryRes = await loadSheet(CONFIG.SHEETS.INVENTORY.range, CONFIG.SHEETS.INVENTORY.sheetKey);
    const rows = inventoryRes.values || [];
    const header = rows[0];
    const rowIdx = rows.findIndex(r => r[0] === productID);
    
    if (rowIdx === -1) {
      throw new Error(`Product ${productID} not found`);
    }
    
    const colIdx = CONFIG.WAREHOUSE_INDEX[warehouse];
    if (colIdx === undefined) {
      throw new Error(`Invalid warehouse: ${warehouse}`);
    }
    
    const currentStock = parseInt(rows[rowIdx][colIdx]) || 0;
    rows[rowIdx][colIdx] = Math.max(0, currentStock + delta);
    
    await updateSheet(CONFIG.SHEETS.INVENTORY.range, rows, CONFIG.SHEETS.INVENTORY.sheetKey);
    return { success: true };
  } catch (error) {
    console.error('Update stock failed:', error);
    return { success: false, error: error.message };
  }
}

// Log stock movement (with serial numbers support and audit logging)
async function logMovement(movement) {
  try {
    movement.date = movement.date || new Date().toISOString().split('T')[0];
    const user = (typeof GoogleAuth !== 'undefined' && GoogleAuth.getCurrentUser) 
      ? GoogleAuth.getCurrentUser()?.email 
      : (typeof Auth !== 'undefined' && Auth.getCurrentUser) 
        ? Auth.getCurrentUser()?.email 
        : 'System';
    
    movement.user = movement.user || user || 'System';
    
    const values = [
      movement.date,
      movement.warehouse,
      movement.productID,
      movement.type,
      movement.qty,
      movement.serialNumbers || '', // Serial numbers column
      movement.notes || '',
      movement.user
    ];
    
    await saveSheet(CONFIG.SHEETS.STOCK_MOVEMENTS.range, values, CONFIG.SHEETS.STOCK_MOVEMENTS.sheetKey);
    
    // Update inventory
    const delta = movement.type === 'In' ? movement.qty : -movement.qty;
    await updateStock(movement.productID, movement.warehouse, delta);
    
    // Log audit event
    if (typeof logAuditEvent === 'function') {
      await logAuditEvent({
        action: 'STOCK_MOVEMENT',
        entity: 'StockMovement',
        entityID: movement.productID,
        newValue: movement,
        details: `${movement.type} ${movement.qty} units of ${movement.productID} at ${movement.warehouse}`
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Log movement failed:', error);
    return { success: false, error: error.message };
  }
}

// Handle gap detection for orders
async function handleGap(order, inventory) {
  if (order.status !== 'PROCESSING') return;
  
  const product = inventory.find(p => p.name === order.product || p.productID === order.product);
  if (!product) return;
  
  const location = order.deliverylocation || order.deliveryLocation || '';
  const warehouse = CONFIG.WAREHOUSES.find(w => 
    location.toUpperCase().includes(w.toUpperCase().substring(0, 3))
  ) || location;
  
  const stock = product.stock[warehouse] || 0;
  const qty = parseInt(order.sp) > 0 ? 1 : 1; // Assuming qty is 1 if not specified
  
  if (stock < qty) {
    const gap = {
      product: order.product,
      location: warehouse,
      pendingQty: qty - stock,
      totalGaps: qty - stock,
      dateCreated: new Date().toISOString().split('T')[0]
    };
    
    await saveSheet(CONFIG.SHEETS.GAPS.range, [
      gap.product,
      gap.location,
      gap.pendingQty,
      gap.totalGaps,
      gap.dateCreated
    ], CONFIG.SHEETS.GAPS.sheetKey);
  }
}

// Export to CSV
function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

