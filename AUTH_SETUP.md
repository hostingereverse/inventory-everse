# Authentication System Setup Guide

## Overview

A secure login system has been added to the Everse Inventory Management application. The authentication system is completely separate from existing code for easy Git management.

## Files Created

1. **`auth-config.js`** - User configuration and credentials
2. **`auth.js`** - Authentication logic and session management
3. **`login.html`** - Login page
4. **`auth-user-profile.html`** - User profile and password change page

## Features

- ✅ Secure password hashing (SHA-256)
- ✅ Session management with auto-logout after inactivity
- ✅ Role-based access control (admin, manager, sales)
- ✅ Password change functionality
- ✅ Automatic redirect to login for protected pages
- ✅ Minimal changes to existing code

## User Configuration

### Registered Users

The following 4 users are configured:

1. **jaffar4tech@gmail.com**
   - Role: Admin
   - Permissions: All

2. **sales.everse@gmail.com**
   - Role: Manager
   - Permissions: View, Edit, Fulfill Orders

3. **everse.niraj@gmail.com**
   - Role: Manager
   - Permissions: View, Edit, Fulfill Orders

4. **sales@everse.in**
   - Role: Sales
   - Permissions: View, Fulfill Orders (Limited)

### Default Password

**⚠️ IMPORTANT:** All users start with the default password: `Everse@2025`

**Change this immediately after first login!**

## Initial Setup

### Step 1: Set Initial Passwords

1. Open `auth-config.js`
2. The default password `Everse@2025` will be automatically set for all users on first load
3. Users should change their passwords immediately after first login

### Step 2: First Login

1. Navigate to your site
2. You'll be redirected to `login.html`
3. Use any of the 4 registered emails with password: `Everse@2025`
4. Click "Login"

### Step 3: Change Passwords

1. After login, click on your name in the navbar (top right)
2. Select "Profile"
3. Change your password using the "Change Password" form
4. Each user should change their password individually

## How It Works

### Authentication Flow

1. User visits any page
2. `auth.js` checks if user is authenticated
3. If not authenticated → redirect to `login.html`
4. After login → redirect back to intended page
5. Session stored in `sessionStorage` (cleared on browser close)

### Session Management

- **Session Duration:** 60 minutes of inactivity
- **Storage:** Browser `sessionStorage` (cleared when browser closes)
- **Auto-logout:** After 60 minutes of inactivity
- **Activity Tracking:** Mouse movements, clicks, and keystrokes reset the timer

### Password Security

- Passwords are hashed using SHA-256
- Original passwords are never stored
- Password changes require current password verification
- Minimum password length: 8 characters

## Role Hierarchy

### Admin (`jaffar4tech@gmail.com`)
- ✅ All permissions
- ✅ Full access to all features
- ✅ Can manage everything

### Manager (`sales.everse@gmail.com`, `everse.niraj@gmail.com`)
- ✅ View all data
- ✅ Edit products and inventory
- ✅ Fulfill orders
- ❌ Cannot modify user accounts (if feature added)

### Sales (`sales@everse.in`)
- ✅ View data
- ✅ Fulfill orders
- ❌ Cannot edit products/inventory
- ❌ Limited access

## Configuration Options

### Disable Authentication (For Testing)

In `auth-config.js`, set:
```javascript
ENABLED: false
```

This will disable authentication checks (not recommended for production).

### Change Session Timeout

In `auth-config.js`, modify:
```javascript
SESSION_TIMEOUT: 60  // minutes
```

### Change Default Password

1. Generate a new SHA-256 hash for your desired password
2. Update `initializePasswords()` function in `auth.js`
3. Or let users change passwords via the profile page

## Security Considerations

### Current Implementation (Client-Side)

⚠️ **Important Notes:**

1. **Client-Side Storage:** User data and passwords are stored in browser localStorage
2. **Not Server-Side:** This is a client-side authentication system
3. **Production Limitation:** For production, consider server-side authentication

### Recommendations for Production

1. **Server-Side Auth:** Move authentication to a backend server
2. **HTTPS Only:** Always use HTTPS in production
3. **JWT Tokens:** Use JSON Web Tokens for session management
4. **API Security:** Secure API keys and credentials server-side
5. **Rate Limiting:** Implement login attempt limits

### For Now (Client-Side Solution)

- Passwords are hashed (SHA-256)
- Sessions expire after inactivity
- Protected pages require authentication
- Suitable for internal use or low-security scenarios

## Adding/Removing Users

### Add New User

1. Open `auth-config.js`
2. Add user object to `USERS` array:
```javascript
{
  email: 'newuser@everse.in',
  passwordHash: '', // Will be set automatically with default password
  role: 'sales', // or 'manager', 'admin'
  name: 'New User',
  permissions: ['view', 'fulfill_orders']
}
```

3. Save file
4. Clear browser localStorage: `localStorage.clear()` (in browser console)
5. Reload page - new user will get default password

### Remove User

1. Open `auth-config.js`
2. Remove user object from `USERS` array
3. Save file
4. Clear browser localStorage or the user will remain logged in until session expires

## Troubleshooting

### Cannot Login

1. **Check Email:** Ensure email matches exactly (case-insensitive)
2. **Check Password:** Default is `Everse@2025`
3. **Clear Storage:** Open browser console and run:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

### Session Expires Too Quickly

1. Check `SESSION_TIMEOUT` in `auth-config.js`
2. Increase the value (in minutes)
3. Ensure activity monitoring is working

### Forgot Password

Currently, there's no password reset feature. To reset:

1. Open browser console
2. Run:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
3. Reload page
4. User will get default password again

### Authentication Not Working

1. Check if `auth-config.js` and `auth.js` are loaded:
   - Open browser console (F12)
   - Check for any errors
   - Verify scripts are loaded in Network tab

2. Check `AUTH_CONFIG.ENABLED` is `true` in `auth-config.js`

3. Verify HTML files include auth scripts:
   ```html
   <script src="auth-config.js"></script>
   <script src="auth.js"></script>
   ```

## Files Modified (Minimal Changes)

Only the following files were modified to add authentication:

1. **All HTML files** (index.html, orders.html, etc.)
   - Added 2 script tags for auth system
   - No other changes

2. **js/app.js**
   - Added user info to navbar
   - Minimal changes, backward compatible

## Testing

### Test Login

1. Open `login.html`
2. Try each email with default password: `Everse@2025`
3. Verify login works
4. Verify redirect to dashboard

### Test Session

1. Login successfully
2. Wait 60 minutes (or reduce `SESSION_TIMEOUT` for testing)
3. Try to access a page
4. Should redirect to login

### Test Password Change

1. Login
2. Go to Profile page
3. Change password
4. Logout
5. Login with new password
6. Verify old password doesn't work

### Test Roles

1. Login as different users
2. Verify navbar shows correct role
3. Test permissions based on role (if implemented)

## Default Credentials Summary

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| jaffar4tech@gmail.com | Everse@2025 | Admin | All |
| sales.everse@gmail.com | Everse@2025 | Manager | View, Edit, Fulfill |
| everse.niraj@gmail.com | Everse@2025 | Manager | View, Edit, Fulfill |
| sales@everse.in | Everse@2025 | Sales | View, Fulfill |

**⚠️ Change all passwords immediately after first deployment!**

## Support

For issues or questions:
- Check browser console for errors
- Verify all auth files are present
- Ensure scripts are loaded in correct order
- Check `AUTH_SETUP.md` for troubleshooting

---

**Last Updated:** 2025-01-25  
**Version:** 1.0

