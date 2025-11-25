// Shared Application Utilities
let appData = {
  orders: [],
  inventory: [],
  movements: [],
  gaps: [],
  loading: false
};

// Show toast notification
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
  return container;
}

// Format date from DD-MM to YYYY-MM-DD
function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // If already YYYY-MM-DD, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  // Parse DD-MM format
  const parts = dateStr.split('-');
  if (parts.length === 2) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }
  
  return new Date().toISOString().split('T')[0];
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

// Show loading spinner
function showLoading(element) {
  if (!element) return;
  element.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
}

// Initialize app on page load
async function initApp() {
  try {
    appData.loading = true;
    showToast('Loading data...', 'info');
    
    // Try to initialize GAPI
    if (window.gapi && CONFIG.API_KEY && CONFIG.API_KEY !== 'YOUR_SHEETS_API_KEY') {
      await initGAPI();
    }
    
    // Load all data
    const data = await loadAllData();
    appData = { ...appData, ...data, loading: false };
    
    showToast('Data loaded successfully', 'success');
    return appData;
  } catch (error) {
    console.error('Init error:', error);
    showToast('Using sample data - API not configured', 'warning');
    appData = { ...appData, ...getSampleData(), loading: false };
    return appData;
  }
}

// Get stock for product and warehouse
function getStock(productName, warehouse) {
  const product = appData.inventory.find(p => 
    p.name === productName || p.productID === productName
  );
  if (!product) return 0;
  return product.stock[warehouse] || 0;
}

// Calculate KPIs
function calculateKPIs() {
  const inventory = appData.inventory || [];
  const orders = appData.orders || [];
  
  // Total inventory value per warehouse
  const totalValue = {};
  CONFIG.WAREHOUSES.forEach(wh => {
    totalValue[wh] = inventory.reduce((sum, p) => {
      return sum + (p.stock[wh] || 0) * (p.unitCost || 0);
    }, 0);
  });
  
  // Low stock items (< reorder level)
  const lowStock = inventory.filter(p => {
    return CONFIG.WAREHOUSES.some(wh => {
      const stock = p.stock[wh] || 0;
      return stock > 0 && stock < (p.reorderLevel || 0);
    });
  }).length;
  
  // No stock items (= 0)
  const noStock = inventory.filter(p => {
    return CONFIG.WAREHOUSES.every(wh => (p.stock[wh] || 0) === 0);
  }).length;
  
  // Unfulfilled orders
  const unfulfilled = orders.filter(o => 
    (o.status || '').toUpperCase() === 'PROCESSING'
  ).length;
  
  return {
    totalValue,
    lowStock,
    noStock,
    unfulfilled
  };
}

// Render navbar
function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  
  navbar.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <a class="navbar-brand" href="index.html">Everse Inventory</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link" href="index.html">Dashboard</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="orders.html">Orders</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="stock.html">Stock</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="products.html">Products</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="gaps.html">Gaps</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="analytics.html">Analytics</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" onclick="exportCSV(); return false;">Export</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `;
}

// Global export function
function exportCSV() {
  exportToCSV(appData.orders, `orders_${new Date().toISOString().split('T')[0]}.csv`);
  showToast('Orders exported to CSV', 'success');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
  });
} else {
  renderNavbar();
}

