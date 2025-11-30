// Configuration for Everse Inventory Management
// CSV-based system - No Google Sheets dependency

const CONFIG = {
  // Data storage - Using CSV files and localStorage
  STORAGE_TYPE: 'csv', // 'csv' for CSV-based system
  
  // Warehouse configuration
  WAREHOUSES: ['Bangalore', 'Kolkata', 'Chennai', 'Mumbai'],
  WAREHOUSE_INDEX: { 'Bangalore': 5, 'Kolkata': 6, 'Chennai': 7, 'Mumbai': 8 },
  
  // Product Categories
  CATEGORIES: {
    DRONES: ['AIR', 'NEO', 'DRONE', 'DRONES'],
    ACTION_CAMERAS: ['CAMERA', 'ACTION', 'CAM', 'GOPRO'],
    ACCESSORIES: ['ACCESSORY', 'ACCESSORIES', 'CHARGER', 'BATTERY', 'CABLE', 'CASE', 'MOUNT', 'PROPELLER']
  },
  
  // Helper function to get category from product name
  getProductCategory(productName) {
    if (!productName) return 'UNCATEGORIZED';
    const name = productName.toUpperCase();
    
    if (CONFIG.CATEGORIES.DRONES.some(keyword => name.includes(keyword))) {
      return 'Drones';
    }
    if (CONFIG.CATEGORIES.ACTION_CAMERAS.some(keyword => name.includes(keyword))) {
      return 'Action Cameras';
    }
    if (CONFIG.CATEGORIES.ACCESSORIES.some(keyword => name.includes(keyword))) {
      return 'Accessories';
    }
    return 'Other';
  },

  // CSV column mappings (flexible - handles different column name formats)
  CSV_COLUMNS: {
    inventory: ['ProductID', 'Name', 'Description', 'UnitCost', 'ReorderLevel', 'Stock_Bangalore', 'Stock_Kolkata', 'Stock_Chennai', 'Stock_Mumbai'],
    sales: ['Order ID', 'Order Type', 'Customer Name', 'Customer Mobile', 'Product', 'Total Price', 'Payment Status', 'Address'],
    stock_movements: ['Date', 'Warehouse', 'ProductID', 'Type', 'Qty', 'SerialNumbers', 'Notes', 'User'],
    gaps: ['Product', 'Location', 'PendingQty', 'TotalGaps', 'DateCreated'],
    serial_numbers: ['SerialNumber', 'ProductID', 'ProductName', 'Warehouse', 'Status', 'DateAdded', 'ReferenceNumber'],
    tracking: ['OrderID', 'TrackingNumber', 'Courier', 'Status', 'CurrentLocation', 'LastUpdated', 'DeliveryDate', 'Timeline'],
    // Additional data types
    suppliers: ['SupplierID', 'Supplier Name', 'Contact Person', 'Email', 'Phone', 'Address', 'City', 'State', 'PinCode', 'GST Number', 'Status'],
    purchase_orders: ['PO Number', 'Supplier ID', 'Order Date', 'Expected Delivery', 'Product', 'Quantity', 'Unit Price', 'Total Amount', 'Status', 'Remarks'],
    returns: ['Return ID', 'Order ID', 'Product', 'Quantity', 'Return Date', 'Reason', 'Status', 'Refund Amount', 'Customer Name', 'Contact'],
    customers: ['Customer ID', 'Customer Name', 'Email', 'Mobile', 'Address', 'City', 'State', 'PinCode', 'Registration Date', 'Total Orders', 'Total Spent'],
    price_history: ['ProductID', 'Product Name', 'Old Price', 'New Price', 'Change Date', 'Changed By', 'Reason', 'Effective From']
  },

  // Security settings
  SECURITY: {
    USE_GOOGLE_AUTH: false,
    SESSION_TIMEOUT: 60,
    REQUIRE_HTTPS: true,
    AUTH_DISABLED: true
  }
};
