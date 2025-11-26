// Google OAuth Authentication with People API
// High-security authentication system with Google Account verification

let gapiAuth = {
  initialized: false,
  currentUser: null,
  authorizedUsers: [] // Will be loaded from Google Sheets
};

// Initialize Google OAuth with People API
async function initGoogleAuth() {
  return new Promise((resolve, reject) => {
    if (!window.gapi) {
      reject(new Error('Google API not loaded'));
      return;
    }

    gapi.load('client:auth2:people', async () => {
      try {
        await gapi.client.init({
          apiKey: CONFIG.API_KEY,
          clientId: CONFIG.CLIENT_ID,
          discoveryDocs: [
            'https://sheets.googleapis.com/$discovery/rest?version=v4',
            'https://people.googleapis.com/$discovery/rest?version=v1'
          ],
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
        });

        gapiAuth.initialized = true;

        // Load authorized users from Google Sheets
        await loadAuthorizedUsers();

        // Check if already signed in
        try {
          const authInstance = gapi.auth2.getAuthInstance();
          const isSignedIn = authInstance.isSignedIn.get();

          if (isSignedIn) {
            const user = await getGoogleUser();
            if (await isUserAuthorized(user.email)) {
              // Get role and permissions
              const authorizedUser = gapiAuth.authorizedUsers.find(u => 
                u.email?.toLowerCase() === user.email?.toLowerCase()
              );
              
              gapiAuth.currentUser = {
                ...user,
                role: authorizedUser?.role || 'user',
                permissions: authorizedUser?.permissions?.split(',').map(p => p.trim()) || []
              };
              
              // Store session
              sessionStorage.setItem('google_user', JSON.stringify(gapiAuth.currentUser));
              sessionStorage.setItem('google_auth_time', Date.now().toString());
              
              resolve(true);
            } else {
              await authInstance.signOut();
              reject(new Error('User not authorized'));
            }
          } else {
            resolve(false);
          }
        } catch (authError) {
          // Not signed in or auth error
          resolve(false);
        }
      } catch (error) {
        console.error('Google Auth init error:', error);
        reject(error);
      }
    });
  });
}

// Load authorized users from Google Sheets (Users tab)
async function loadAuthorizedUsers() {
  try {
    const response = await loadSheet(CONFIG.SHEETS.USERS.range, CONFIG.SHEETS.USERS.sheetKey);
    const rows = response.values || [];
    
    if (rows.length > 1) {
      const headers = rows[0];
      gapiAuth.authorizedUsers = rows.slice(1).map(row => {
        const user = {};
        headers.forEach((header, index) => {
          user[header.toLowerCase().replace(/\s+/g, '')] = row[index] || '';
        });
        return user;
      }).filter(u => u.email && u.active !== 'FALSE');
    } else {
      // Default authorized users if sheet is empty
      gapiAuth.authorizedUsers = CONFIG.AUTHORIZED_USERS || [];
    }
  } catch (error) {
    console.warn('Could not load authorized users, using defaults:', error);
    gapiAuth.authorizedUsers = CONFIG.AUTHORIZED_USERS || [];
  }
}

// Get current Google user info
async function getGoogleUser() {
  if (!gapiAuth.initialized) {
    throw new Error('Google Auth not initialized');
  }

  const authInstance = gapi.auth2.getAuthInstance();
  const googleUser = authInstance.currentUser.get();
  const profile = googleUser.getBasicProfile();
  const email = profile.getEmail();

  // Get additional info from People API
  try {
    const response = await gapi.client.people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos'
    });

    const person = response.result;
    return {
      email: email,
      name: profile.getName(),
      imageUrl: profile.getImageUrl(),
      googleId: profile.getId(),
      fullName: person.names?.[0]?.displayName || profile.getName(),
      photoUrl: person.photos?.[0]?.url || profile.getImageUrl()
    };
  } catch (error) {
    console.warn('People API error, using basic profile:', error);
    return {
      email: email,
      name: profile.getName(),
      imageUrl: profile.getImageUrl(),
      googleId: profile.getId()
    };
  }
}

// Check if user is authorized
async function isUserAuthorized(email) {
  await loadAuthorizedUsers(); // Refresh list
  
  return gapiAuth.authorizedUsers.some(user => 
    user.email?.toLowerCase() === email?.toLowerCase()
  );
}

// Sign in with Google
async function signInWithGoogle() {
  if (!gapiAuth.initialized) {
    await initGoogleAuth();
  }

  try {
    const authInstance = gapi.auth2.getAuthInstance();
    const googleUser = await authInstance.signIn();

    const user = await getGoogleUser();

    // Verify authorization
    if (!(await isUserAuthorized(user.email))) {
      await authInstance.signOut();
      throw new Error(`Access denied. ${user.email} is not authorized.`);
    }

    // Get user role and permissions
    const authorizedUser = gapiAuth.authorizedUsers.find(u => 
      u.email?.toLowerCase() === user.email?.toLowerCase()
    );

    gapiAuth.currentUser = {
      ...user,
      role: authorizedUser?.role || 'user',
      permissions: authorizedUser?.permissions?.split(',').map(p => p.trim()) || []
    };

    // Log login
    await logAuditEvent({
      action: 'LOGIN',
      user: user.email,
      details: `User logged in: ${user.name}`
    });

    // Store session
    sessionStorage.setItem('google_user', JSON.stringify(gapiAuth.currentUser));
    sessionStorage.setItem('google_auth_time', Date.now().toString());

    return gapiAuth.currentUser;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

// Sign out
async function signOut() {
  try {
    if (gapiAuth.currentUser) {
      await logAuditEvent({
        action: 'LOGOUT',
        user: gapiAuth.currentUser.email,
        details: `User logged out`
      });
    }

    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signOut();

    gapiAuth.currentUser = null;
    sessionStorage.removeItem('google_user');
    sessionStorage.removeItem('google_auth_time');

    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  }
}

// Check if user is authenticated
function isAuthenticated() {
  if (gapiAuth.currentUser) return true;

  const stored = sessionStorage.getItem('google_user');
  if (stored) {
    gapiAuth.currentUser = JSON.parse(stored);
    return true;
  }

  return false;
}

// Get current user
function getCurrentUser() {
  if (gapiAuth.currentUser) return gapiAuth.currentUser;

  const stored = sessionStorage.getItem('google_user');
  if (stored) {
    gapiAuth.currentUser = JSON.parse(stored);
    return gapiAuth.currentUser;
  }

  return null;
}

// Check user permission
function hasPermission(permission) {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.includes(permission) || false;
}

// Check user role
function hasRole(role) {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === role;
}

// Export functions
window.GoogleAuth = {
  init: initGoogleAuth,
  signIn: signInWithGoogle,
  signOut: signOut,
  isAuthenticated: isAuthenticated,
  getCurrentUser: getCurrentUser,
  hasPermission: hasPermission,
  hasRole: hasRole,
  loadAuthorizedUsers: loadAuthorizedUsers,
  isUserAuthorized: isUserAuthorized
};

