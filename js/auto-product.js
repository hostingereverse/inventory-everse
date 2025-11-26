// Auto-Product Detection and Management
// Automatically adds products from sales data when new products are found

async function checkAndAddNewProducts(orders, inventory) {
  if (!orders || !Array.isArray(orders)) return;
  if (!inventory || !Array.isArray(inventory)) return;
  
  const newProducts = [];
  const existingProductNames = new Set(inventory.map(p => (p.name || '').toLowerCase().trim()));
  const existingProductIDs = new Set(inventory.map(p => (p.productID || '').toLowerCase().trim()));
  
  // Extract unique products from orders
  const orderProducts = new Map();
  
  orders.forEach(order => {
    const productName = (order.product || '').trim();
    if (!productName) return;
    
    const key = productName.toLowerCase();
    if (!orderProducts.has(key)) {
      orderProducts.set(key, {
        name: productName,
        seenInOrders: []
      });
    }
    orderProducts.get(key).seenInOrders.push(order);
  });
  
  // Check for new products
  for (const [key, productInfo] of orderProducts) {
    if (!existingProductNames.has(key)) {
      // Check if it's a product ID
      const isProductID = /^[A-Z0-9\-_]+$/.test(productInfo.name);
      
      // Generate product ID if needed
      let productID = productInfo.name;
      if (!isProductID || existingProductIDs.has(productInfo.name.toLowerCase())) {
        // Generate unique product ID
        productID = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      }
      
      // Find average price from orders (if available)
      const prices = productInfo.seenInOrders
        .map(o => parseFloat(o.sp || 0))
        .filter(p => p > 0);
      const avgPrice = prices.length > 0 
        ? prices.reduce((a, b) => a + b, 0) / prices.length 
        : 0;
      
      newProducts.push({
        productID: productID,
        name: productInfo.name,
        description: `Auto-added from sales data on ${new Date().toISOString().split('T')[0]}`,
        unitCost: Math.round(avgPrice * 0.7) || 0, // Estimate cost as 70% of sale price
        reorderLevel: 10, // Default reorder level
        stock: {
          Bangalore: 0,
          Kolkata: 0,
          Chennai: 0,
          Mumbai: 0
        }
      });
    }
  }
  
  // Add new products to inventory
  if (newProducts.length > 0) {
    try {
      for (const product of newProducts) {
        await addProductToInventory(product);
      }
      
      console.log(`Auto-added ${newProducts.length} new product(s) from sales data`);
      return { success: true, added: newProducts.length, products: newProducts };
    } catch (error) {
      console.error('Error auto-adding products:', error);
      return { success: false, error: error.message };
    }
  }
  
  return { success: true, added: 0, products: [] };
}

// Add product to inventory sheet
async function addProductToInventory(product) {
  try {
    const values = [
      product.productID,
      product.name,
      product.description || '',
      product.unitCost || 0,
      product.reorderLevel || 10,
      product.stock.Bangalore || 0,
      product.stock.Kolkata || 0,
      product.stock.Chennai || 0,
      product.stock.Mumbai || 0
    ];
    
    await saveSheet(CONFIG.SHEETS.INVENTORY.range, values, CONFIG.SHEETS.INVENTORY.sheetKey);
    
    // Update local inventory cache
    if (appData && appData.inventory) {
      appData.inventory.push(product);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Add product to inventory error:', error);
    return { success: false, error: error.message };
  }
}

// Sync products from orders (call this after loading orders)
async function syncProductsFromOrders() {
  try {
    const data = await loadAllData();
    const result = await checkAndAddNewProducts(data.orders, data.inventory);
    
    if (result.success && result.added > 0) {
      // Reload inventory to include new products
      const inventoryRes = await loadSheet(CONFIG.SHEETS.INVENTORY.range, CONFIG.SHEETS.INVENTORY.sheetKey);
      appData.inventory = parseInventory(inventoryRes.values || []);
      
      return result;
    }
    
    return result;
  } catch (error) {
    console.error('Sync products error:', error);
    return { success: false, error: error.message };
  }
}

// Export functions
window.AutoProduct = {
  checkAndAddNewProducts,
  addProductToInventory,
  syncProductsFromOrders
};

