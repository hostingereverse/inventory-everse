// Shared Application Utilities for CSV-based system

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

// Get stock for product and warehouse (from CSV data)
function getStock(productName, warehouse) {
  if (typeof CSVManager === 'undefined') return 0;
  
  const inventory = CSVManager.getInventory();
  const product = inventory.find(p => {
    const name = p.Name || p.name || '';
    const id = p.ProductID || p.productID || '';
    return name === productName || id === productName;
  });
  
  if (!product) return 0;
  
  const key = `Stock_${warehouse}`;
  return parseInt(product[key] || product[warehouse.toLowerCase()] || 0);
}

// Calculate KPIs (using CSV Analytics if available, else fallback)
function calculateKPIs() {
  if (typeof CSVAnalytics !== 'undefined') {
    return CSVAnalytics.calculateKPIs();
  }
  
  // Fallback calculation
  const inventory = appData.inventory || [];
  const orders = appData.orders || [];
  const gaps = appData.gaps || [];
  
  let totalValue = 0;
  let totalNumber = 0;
  
  inventory.forEach(product => {
    const cost = parseFloat(product.UnitCost || product.unitCost || 0);
    CONFIG.WAREHOUSES.forEach(wh => {
      const key = `Stock_${wh}`;
      const stock = parseInt(product[key] || 0);
      totalValue += cost * stock;
      totalNumber += stock;
    });
  });
  
  const totalGaps = gaps.reduce((sum, gap) => {
    return sum + (parseInt(gap.PendingQty || gap.pendingQty || 0));
  }, 0);
  
  const pendingOrders = orders.filter(o => {
    const status = (o.Status || o.status || '').toUpperCase();
    return status === 'PROCESSING' || status === 'PENDING';
  }).length;
  
  return {
    totalValue,
    totalNumber,
    totalGaps,
    pendingOrders
  };
}

// Render navbar (simplified - no auth)
function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  
  const menuItems = `
    <li class="nav-item"><a class="nav-link" href="index.html">Dashboard</a></li>
    <li class="nav-item"><a class="nav-link" href="stock.html">Inventory</a></li>
    <li class="nav-item"><a class="nav-link" href="inventory-movement.html">Inventory Movement</a></li>
    <li class="nav-item"><a class="nav-link" href="orders.html">Sales Data</a></li>
    <li class="nav-item"><a class="nav-link" href="gaps.html">Order-Inventory Gap</a></li>
    <li class="nav-item"><a class="nav-link" href="analytics.html">Analytics</a></li>
    <li class="nav-item"><a class="nav-link" href="admin.html">Admin</a></li>
  `;
  
  navbar.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <a class="navbar-brand" href="index.html">Everse Inventory</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            ${menuItems}
          </ul>
        </div>
      </div>
    </nav>
  `;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
  });
} else {
  renderNavbar();
}
