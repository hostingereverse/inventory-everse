// Authentication System for Everse Inventory Management
// Secure login with role-based access control

// Password hashing utility
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Initialize default passwords if not set
async function initializePasswords() {
  if (!AUTH_CONFIG.ENABLED) return;
  
  const defaultPassword = 'Everse@2025'; // CHANGE THIS!
  const defaultHash = await hashPassword(defaultPassword);
  
  const storedUsers = localStorage.getItem('auth_users');
  if (!storedUsers) {
    // First time setup - initialize with default password
    const usersWithHashes = await Promise.all(
      AUTH_CONFIG.USERS.map(async (user) => {
        if (!user.passwordHash) {
          user.passwordHash = defaultHash;
        }
        return user;
      })
    );
    localStorage.setItem('auth_users', JSON.stringify(usersWithHashes));
    localStorage.setItem('auth_initialized', 'true');
    console.warn('⚠️ Default password set for all users: "Everse@2025" - Please change immediately!');
  }
}

// Get stored users
function getStoredUsers() {
  const stored = localStorage.getItem('auth_users');
  if (stored) {
    return JSON.parse(stored);
  }
  return AUTH_CONFIG.USERS;
}

// Save users
function saveUsers(users) {
  localStorage.setItem('auth_users', JSON.stringify(users));
}

// Authentication functions
const Auth = {
  // Check if user is authenticated
  isAuthenticated() {
    if (!AUTH_CONFIG.ENABLED) return true;
    
    const session = sessionStorage.getItem('auth_session');
    if (!session) return false;
    
    try {
      const sessionData = JSON.parse(session);
      const now = new Date().getTime();
      
      // Check if session expired
      if (now > sessionData.expires) {
        this.logout();
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  },
  
  // Get current user
  getCurrentUser() {
    if (!AUTH_CONFIG.ENABLED) return null;
    
    const session = sessionStorage.getItem('auth_session');
    if (!session) return null;
    
    try {
      const sessionData = JSON.parse(session);
      return sessionData.user;
    } catch {
      return null;
    }
  },
  
  // Check if user has permission
  hasPermission(permission) {
    if (!AUTH_CONFIG.ENABLED) return true;
    
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin' || user.permissions.includes('all')) {
      return true;
    }
    
    return user.permissions.includes(permission);
  },
  
  // Login function
  async login(email, password) {
    if (!AUTH_CONFIG.ENABLED) {
      return { success: true, user: { email: 'guest', role: 'guest' } };
    }
    
    try {
      const users = getStoredUsers();
      const passwordHash = await hashPassword(password);
      
      const user = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.passwordHash === passwordHash
      );
      
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Create session
      const sessionData = {
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions
        },
        loginTime: new Date().getTime(),
        expires: new Date().getTime() + (AUTH_CONFIG.SESSION_TIMEOUT * 60 * 1000)
      };
      
      sessionStorage.setItem('auth_session', JSON.stringify(sessionData));
      
      // Update last login
      const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (userIndex !== -1) {
        users[userIndex].lastLogin = new Date().toISOString();
        saveUsers(users);
      }
      
      return { success: true, user: sessionData.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  },
  
  // Logout function
  logout() {
    sessionStorage.removeItem('auth_session');
    window.location.href = 'login.html';
  },
  
  // Change password
  async changePassword(email, currentPassword, newPassword) {
    if (!AUTH_CONFIG.ENABLED) return { success: false, error: 'Auth disabled' };
    
    if (newPassword.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
      return { success: false, error: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters` };
    }
    
    try {
      const users = getStoredUsers();
      const currentHash = await hashPassword(currentPassword);
      
      const userIndex = users.findIndex(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.passwordHash === currentHash
      );
      
      if (userIndex === -1) {
        return { success: false, error: 'Current password is incorrect' };
      }
      
      const newHash = await hashPassword(newPassword);
      users[userIndex].passwordHash = newHash;
      users[userIndex].passwordChanged = new Date().toISOString();
      
      saveUsers(users);
      
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  },
  
  // Require authentication (redirect to login if not authenticated)
  requireAuth() {
    if (!AUTH_CONFIG.ENABLED) return;
    
    if (!this.isAuthenticated()) {
      // Save the page they were trying to access
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage !== 'login.html' && currentPage !== '') {
        sessionStorage.setItem('auth_redirect', currentPage);
      }
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },
  
  // Initialize authentication
  async init() {
    if (!AUTH_CONFIG.ENABLED) return;
    
    await initializePasswords();
    
    // Check if on login page
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'login.html') {
      // If already logged in, redirect to dashboard
      if (this.isAuthenticated()) {
        const redirect = sessionStorage.getItem('auth_redirect') || 'index.html';
        sessionStorage.removeItem('auth_redirect');
        window.location.href = redirect;
      }
      return;
    }
    
    // Require authentication for all other pages
    this.requireAuth();
    
    // Update last activity
    this.updateActivity();
    
    // Set up activity monitoring for auto-logout
    document.addEventListener('click', () => this.updateActivity());
    document.addEventListener('keypress', () => this.updateActivity());
    document.addEventListener('mousemove', () => this.updateActivity());
  },
  
  // Update last activity time
  updateActivity() {
    if (!AUTH_CONFIG.ENABLED) return;
    
    const session = sessionStorage.getItem('auth_session');
    if (!session) return;
    
    try {
      const sessionData = JSON.parse(session);
      // Extend session on activity
      sessionData.expires = new Date().getTime() + (AUTH_CONFIG.SESSION_TIMEOUT * 60 * 1000);
      sessionStorage.setItem('auth_session', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Update activity error:', error);
    }
  },
  
  // Check session expiry periodically
  checkSession() {
    if (!AUTH_CONFIG.ENABLED) return;
    
    setInterval(() => {
      if (!this.isAuthenticated()) {
        this.logout();
      }
    }, 60000); // Check every minute
  }
};

// Export for use in other scripts
window.Auth = Auth;

// Auto-initialize on page load - ensure AUTH_CONFIG is loaded first
function initAuth() {
  if (typeof AUTH_CONFIG === 'undefined') {
    // Wait for AUTH_CONFIG to load
    setTimeout(initAuth, 100);
    return;
  }
  
  Auth.init();
  Auth.checkSession();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  // DOM already loaded
  initAuth();
}

