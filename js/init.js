// Global Initialization Script
// Initializes all systems: Google Auth, DataLoader, Email Service, etc.

const AppInit = {
  initialized: false,
  
  // Initialize all systems
  async init() {
    if (this.initialized) return;
    
    try {
      // 1. Initialize Google Auth (if enabled)
      if (CONFIG.SECURITY && CONFIG.SECURITY.USE_GOOGLE_AUTH && typeof GoogleAuth !== 'undefined') {
        try {
          await GoogleAuth.init();
          
          // Check authentication
          if (!GoogleAuth.isAuthenticated()) {
            // Not authenticated - redirect to login
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage !== 'login-google.html' && currentPage !== 'login.html') {
              sessionStorage.setItem('redirect_after_login', window.location.pathname);
              window.location.href = 'login-google.html';
              return false;
            }
            return false;
          }
          
          // Check session timeout
          this.checkSessionTimeout();
        } catch (error) {
          console.error('Google Auth init error:', error);
          // Fall back to legacy auth or allow access
        }
      }
      
      // 2. Initialize DataLoader (if available)
      if (typeof DataLoader !== 'undefined') {
        // Clear any stale caches on init
        DataLoader.clearCache();
        
        // Auto-start polling on dashboard/index page
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
          // Start real-time polling for dashboard
          DataLoader.startPolling((updatedData) => {
            // Update appData if it exists globally
            if (typeof appData !== 'undefined') {
              appData = { ...appData, ...updatedData };
              // Trigger UI update if renderDashboard exists
              if (typeof renderDashboard === 'function') {
                renderDashboard();
              }
            }
          }, 30 * 1000); // 30 seconds
          console.log('Real-time polling started on dashboard');
        }
      }
      
      // 3. Initialize Email Service (if available)
      if (typeof EmailService !== 'undefined' && EmailService.config.enabled) {
        // Explicitly start email service scheduling
        try {
          EmailService.scheduleDailyReports();
          console.log('Email service initialized and scheduled');
        } catch (error) {
          console.warn('Email service initialization failed:', error);
        }
      }
      
      // 4. Initialize Audit Trail (if available)
      if (typeof AuditTrail !== 'undefined') {
        // Audit trail ready
        console.log('Audit trail ready');
      }
      
      // 5. Initialize Data Persistence (if available)
      if (typeof DataPersistence !== 'undefined') {
        // Data persistence ready
        console.log('Data persistence ready');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('App initialization error:', error);
      return false;
    }
  },
  
  // Check session timeout
  checkSessionTimeout() {
    if (!CONFIG.SECURITY || !CONFIG.SECURITY.USE_GOOGLE_AUTH) return;
    
    const authTime = sessionStorage.getItem('google_auth_time');
    if (!authTime) return;
    
    const timeoutMs = (CONFIG.SECURITY.SESSION_TIMEOUT || 60) * 60 * 1000;
    const elapsed = Date.now() - parseInt(authTime);
    
    if (elapsed > timeoutMs) {
      // Session expired
      GoogleAuth.signOut().then(() => {
        sessionStorage.setItem('session_expired', 'true');
        window.location.href = 'login-google.html';
      });
    }
    
    // Check periodically (every minute)
    setInterval(() => {
      const time = sessionStorage.getItem('google_auth_time');
      if (!time) return;
      
      const elapsed = Date.now() - parseInt(time);
      if (elapsed > timeoutMs) {
        GoogleAuth.signOut().then(() => {
          sessionStorage.setItem('session_expired', 'true');
          window.location.href = 'login-google.html';
        });
      }
    }, 60 * 1000);
  }
};

// Export
window.AppInit = AppInit;

// Auto-initialize when config is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for CONFIG to load
  if (typeof CONFIG === 'undefined') {
    setTimeout(() => AppInit.init(), 100);
  } else {
    await AppInit.init();
  }
});

