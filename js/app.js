// Shared Application Utilities
let appData = {
  orders: [],
  inventory: [],
  movements: [],
  gaps: [],
  loading: false
};

// Authentication check - only loads if auth.js is included
if (typeof Auth !== 'undefined') {
  // Auth is loaded, it will handle authentication automatically
  // This allows existing code to work without modifications
}

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

// Initialize app on page load (with Google Auth, DataLoader, and optimizations)
async function initApp(forceRefresh = false) {
  try {
    // Check Google Auth if enabled
    if (CONFIG.SECURITY && CONFIG.SECURITY.USE_GOOGLE_AUTH && typeof GoogleAuth !== 'undefined') {
      // Initialize Google Auth if not already done
      try {
        await GoogleAuth.init();
        
        if (!GoogleAuth.isAuthenticated()) {
          sessionStorage.setItem('redirect_after_login', window.location.pathname);
          window.location.href = 'login-google.html';
          return null;
        }
      } catch (error) {
        console.warn('Google Auth initialization failed:', error);
        // Continue with legacy auth if Google Auth fails
      }
    }
    
    appData.loading = true;
    showToast('Loading data...', 'info');
    
    // Try to initialize GAPI
    if (window.gapi && CONFIG.API_KEY && CONFIG.API_KEY !== 'YOUR_SHEETS_API_KEY') {
      await initGAPI();
    }
    
    // Use DataLoader if available (for caching and optimization)
    let data;
    if (typeof DataLoader !== 'undefined' && DataLoader.loadAllData) {
      data = await DataLoader.loadAllData(forceRefresh);
    } else {
      // Fallback to old method
      data = await loadAllData();
    }
    
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
  const gaps = appData.gaps || [];
  
  // Total inventory value (all warehouses combined)
  const totalValue = CONFIG.WAREHOUSES.reduce((sum, wh) => {
    return sum + inventory.reduce((warehouseSum, p) => {
      return warehouseSum + (p.stock[wh] || 0) * (p.unitCost || 0);
    }, 0);
  }, 0);
  
  // Total number of items (sum of all stock across all warehouses)
  const totalNumber = CONFIG.WAREHOUSES.reduce((sum, wh) => {
    return sum + inventory.reduce((warehouseSum, p) => {
      return warehouseSum + (p.stock[wh] || 0);
    }, 0);
  }, 0);
  
  // Total gaps (sum of pending quantities)
  const totalGaps = gaps.reduce((sum, gap) => {
    return sum + (parseInt(gap.pendingQty) || 0);
  }, 0);
  
  // Pending orders (PROCESSING or SHIPPED)
  const pendingOrders = orders.filter(o => {
    const status = (o.status || '').toUpperCase();
    return status === 'PROCESSING' || status === 'SHIPPED';
  }).length;
  
  return {
    totalValue,
    totalNumber,
    totalGaps,
    pendingOrders
  };
}

// Render navbar
function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  
  // Get current user if auth is enabled (Google Auth or legacy Auth)
  let userInfo = '';
  let currentUser = null;
  
  // Try Google Auth first (new system)
  if (typeof GoogleAuth !== 'undefined' && GoogleAuth.getCurrentUser) {
    currentUser = GoogleAuth.getCurrentUser();
  }
  // Fallback to legacy Auth
  else if (typeof Auth !== 'undefined' && Auth.getCurrentUser) {
    currentUser = Auth.getCurrentUser();
  }
  
  if (currentUser) {
    const isAdmin = currentUser.role === 'admin';
    userInfo = `
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
          ${currentUser.name || currentUser.fullName || currentUser.email} ${currentUser.role ? `(${currentUser.role})` : ''}
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="auth-user-profile.html">Profile</a></li>
          ${isAdmin ? '<li><a class="dropdown-item" href="admin.html">Admin Panel</a></li>' : ''}
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" onclick="logout(); return false;">Logout</a></li>
        </ul>
      </li>
    `;
  }
  
  // Logout function
  window.logout = async function() {
    try {
      if (typeof GoogleAuth !== 'undefined' && GoogleAuth.signOut) {
        await GoogleAuth.signOut();
      } else if (typeof Auth !== 'undefined' && Auth.logout) {
        Auth.logout();
      }
      window.location.href = 'login-google.html';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = 'login-google.html';
    }
  };
  
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
              <a class="nav-link" href="tracking.html">Tracking</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" onclick="exportCSV(); return false;">Export</a>
            </li>
            ${userInfo}
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

