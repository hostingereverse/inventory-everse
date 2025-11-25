// Authentication Configuration - User Management
// DO NOT commit this file to git if using real passwords
// For production, use environment variables or server-side authentication

const AUTH_CONFIG = {
  // User credentials (password is hashed using simple SHA-256)
  // To generate hash: Use browser console: await crypto.subtle.digest('SHA-256', new TextEncoder().encode('password'))
  // Or use online SHA-256 generator
  USERS: [
    {
      email: 'jaffar4tech@gmail.com',
      passwordHash: '', // Will be set via setPasswordHash function
      role: 'admin', // admin, manager, sales
      name: 'Jaffar',
      permissions: ['all'] // All permissions
    },
    {
      email: 'sales.everse@gmail.com',
      passwordHash: '',
      role: 'manager',
      name: 'Sales Manager',
      permissions: ['view', 'edit', 'fulfill_orders']
    },
    {
      email: 'everse.niraj@gmail.com',
      passwordHash: '',
      role: 'manager',
      name: 'Niraj',
      permissions: ['view', 'edit', 'fulfill_orders']
    },
    {
      email: 'sales@everse.in',
      passwordHash: '',
      role: 'sales',
      name: 'Sales Team',
      permissions: ['view', 'fulfill_orders'] // Limited permissions
    }
  ],
  
  // Session timeout (minutes) - auto logout after inactivity
  SESSION_TIMEOUT: 60,
  
  // Password requirements (for initial setup)
  PASSWORD_MIN_LENGTH: 8,
  
  // Enable/disable authentication
  ENABLED: true
};

// Initialize default passwords (you should change these!)
// Default password for all users: "Everse@2025"
// Change passwords using the password setup function in auth.js

