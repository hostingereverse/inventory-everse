// Analytics Data Loader - Fetches data from all tabs in sales sheet

async function loadAllSalesSheetTabs() {
  try {
    const salesSheetId = CONFIG.SPREADSHEETS.SALES;
    
    // Try to get all sheet names from the spreadsheet
    let allSheetNames = ['Orders']; // Default to Orders tab
    
    try {
      if (gapiInitialized && CONFIG.API_KEY && CONFIG.API_KEY !== 'YOUR_SHEETS_API_KEY') {
        const response = await gapi.client.sheets.spreadsheets.get({
          spreadsheetId: salesSheetId
        });
        allSheetNames = response.result.sheets.map(sheet => sheet.properties.title);
      }
    } catch (error) {
      console.warn('Could not fetch sheet names, using default:', error);
    }
    
    // Load data from each tab
    const allTabsData = {};
    
    for (const sheetName of allSheetNames) {
      try {
        const range = `${sheetName}!A:Z`; // Load first 26 columns (A-Z)
        const result = await loadSheet(range, 'SALES');
        
        if (result && result.values && result.values.length > 0) {
          // Store raw data for analytics
          allTabsData[sheetName] = {
            headers: result.values[0] || [],
            rows: result.values.slice(1) || [],
            rowCount: result.values.length - 1
          };
        }
      } catch (error) {
        console.warn(`Failed to load tab ${sheetName}:`, error);
      }
    }
    
    return allTabsData;
  } catch (error) {
    console.error('Load all sales tabs error:', error);
    return {};
  }
}

// Parse tab data into structured format
function parseTabData(tabName, tabData) {
  if (!tabData || !tabData.headers || !tabData.rows) {
    return [];
  }
  
  const headers = tabData.headers;
  return tabData.rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header) {
        const key = header.toLowerCase().replace(/\s+/g, '');
        obj[key] = row[index] || '';
      }
    });
    return obj;
  });
}

// Aggregate analytics from all tabs
function aggregateAnalyticsFromAllTabs(allTabsData) {
  const analytics = {
    totalOrders: 0,
    totalSales: 0,
    totalReturns: 0,
    totalCancellations: 0,
    byLocation: {},
    byProduct: {},
    byDate: {},
    bySalesPerson: {}
  };
  
  // Process Orders tab
  if (allTabsData.Orders) {
    const orders = parseTabData('Orders', allTabsData.Orders);
    analytics.totalOrders = orders.length;
    
    orders.forEach(order => {
      const location = (order.deliverylocation || order.deliveryLocation || 'Unknown').trim();
      const product = (order.product || '').trim();
      const salesPerson = (order.salesperson || '').trim();
      const date = order.date || '';
      const amount = parseFloat(order.sp || 0);
      
      analytics.totalSales += amount;
      
      analytics.byLocation[location] = (analytics.byLocation[location] || 0) + 1;
      analytics.byProduct[product] = (analytics.byProduct[product] || 0) + 1;
      analytics.bySalesPerson[salesPerson] = (analytics.bySalesPerson[salesPerson] || 0) + 1;
      
      if (date) {
        const dateKey = date.split(' ')[0] || date.split('-')[0]; // Get date part
        analytics.byDate[dateKey] = (analytics.byDate[dateKey] || 0) + 1;
      }
    });
  }
  
  // Process Returns tab if exists
  if (allTabsData.Returns || allTabsData['Return']) {
    const tabName = allTabsData.Returns ? 'Returns' : 'Return';
    const returns = parseTabData(tabName, allTabsData[tabName]);
    analytics.totalReturns = returns.length;
  }
  
  // Process Cancellations tab if exists
  if (allTabsData.Cancellations || allTabsData['Cancelled Orders'] || allTabsData.Canceled) {
    const tabName = allTabsData.Cancellations ? 'Cancellations' : 
                   (allTabsData['Cancelled Orders'] ? 'Cancelled Orders' : 'Canceled');
    const cancellations = parseTabData(tabName, allTabsData[tabName]);
    analytics.totalCancellations = cancellations.length;
  }
  
  // Process Sales tab if exists (separate from Orders)
  if (allTabsData.Sales && !allTabsData.Orders) {
    const sales = parseTabData('Sales', allTabsData.Sales);
    analytics.totalOrders += sales.length;
    
    sales.forEach(sale => {
      const amount = parseFloat(sale.amount || sale.sp || sale.total || 0);
      analytics.totalSales += amount;
    });
  }
  
  return analytics;
}

// Export for use in analytics page
window.AnalyticsLoader = {
  loadAllSalesSheetTabs,
  parseTabData,
  aggregateAnalyticsFromAllTabs
};

