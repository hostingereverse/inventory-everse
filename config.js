// Configuration for Everse Inventory Management
const CONFIG = {
  API_KEY: 'AIzaSyB8vGf1eR5vK7jP9mN2xQwLcT3zHs9fJkE',
  CLIENT_ID: '1038642519075-0j5p8r2h9k3m7v6n1t2q4e8u0y6a9s5d.apps.googleusercontent.com',
  GAS_PROXY_URL: 'https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec',
  
  SPREADSHEETS: {
    SALES: '1WgKoJv27tNJdVxjzhLNteDgnnz9zA3QDh942XPO8hbM',      // Orders / sales data
    INVENTORY: '1Uw1HPluxTXpqT9BdrdhShjZ2uP8YTv8Vxd_0NKCRWW0'                      // Inventory, gaps, stock movements
  },
  
  SHEETS: {
    ORDERS: {
      sheetKey: 'SALES',
      range: 'Orders!A:J',
      cols: ['OrderID', 'Date', 'DeliveryLocation', 'Product', 'Status', 'SP', 'CP', 'GST', 'SalesPerson', 'Remarks']
    },
    INVENTORY: {
      sheetKey: 'INVENTORY',
      range: 'Inventory!A:I',
      cols: ['ProductID', 'Name', 'Description', 'UnitCost', 'ReorderLevel', 'Stock_Bangalore', 'Stock_Kolkata', 'Stock_Chennai', 'Stock_Mumbai']
    },
    STOCK_MOVEMENTS: {
      sheetKey: 'INVENTORY',
      range: 'StockMovements!A:G',
      cols: ['Date', 'Warehouse', 'ProductID', 'Type', 'Qty', 'Notes', 'User']
    },
    GAPS: {
      sheetKey: 'INVENTORY',
      range: 'Gaps!A:E',
      cols: ['Product', 'Location', 'PendingQty', 'TotalGaps', 'DateCreated']
    }
  },
  
  WAREHOUSES: ['Bangalore', 'Kolkata', 'Chennai', 'Mumbai'],
  WAREHOUSE_INDEX: { 'Bangalore': 5, 'Kolkata': 6, 'Chennai': 7, 'Mumbai': 8 },
  
  // Sample data for fallback
  SAMPLE_DATA: {
    inventory: [
      { productID: 'P001', name: 'AIR 3S COMBO', description: 'Drone kit', unitCost: 1495, reorderLevel: 10, stock: { Bangalore: 20, Kolkata: 5, Chennai: 0, Mumbai: 15 } },
      { productID: 'P002', name: 'NEO STANDARD', description: 'Standard model', unitCost: 299, reorderLevel: 20, stock: { Bangalore: 10, Kolkata: 30, Chennai: 5, Mumbai: 0 } }
    ],
    orders: [
      ['E1013', '11-03', 'BANGLORE', 'AIR 3S COMBO', 'PROCESSING', 149500, '', '', '', ''],
      ['40660', '11-03', 'KOLKATA', 'NEO STANDARD', 'PROCESSING', 29999, '', '', '', '']
    ],
    gaps: [
      { product: 'Mini Drone', location: 'Chennai', pendingQty: 5, totalGaps: 5, dateCreated: '2025-11-25' },
      { product: 'NEO', location: 'Mumbai', pendingQty: 6, totalGaps: 6, dateCreated: '2025-11-25' }
    ]
  }
};

