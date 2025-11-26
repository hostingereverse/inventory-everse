# Missing Integrations & Updates Needed

## 🔴 Critical Missing Items

### 1. **Google Auth Not Integrated into All Pages**
- ❌ Pages still use old `auth.js` system
- ❌ Google Auth scripts not included
- ❌ No authentication check on page load
- **Files Affected**: index.html, orders.html, stock.html, products.html, gaps.html, analytics.html

### 2. **Data Loader Not Used**
- ❌ `initApp()` still uses old `loadAllData()`
- ❌ Should use `DataLoader.loadAllData()` for caching
- ❌ No real-time polling started

### 3. **Email Service Not Initialized**
- ❌ Email service not started on any page
- ❌ Daily reports won't send automatically

### 4. **Audit Trail Not Integrated**
- ❌ Not all operations log audit events
- ❌ Some functions missing audit logging

### 5. **Data Persistence Not Integrated**
- ❌ Serial tracker still uses localStorage
- ❌ Tracking system still uses localStorage
- ❌ Not using Google Sheets persistence

### 6. **CORS Issues Not Fully Resolved**
- ⚠️ Still relies on external proxies
- ⚠️ No backend proxy implemented

### 7. **Session Timeout Not Integrated**
- ❌ Google Auth session timeout not checking
- ❌ No automatic logout on timeout

---

## 🟡 Integration Fixes Needed

### Pages That Need Updates:

1. **index.html** - Add Google Auth, DataLoader, EmailService
2. **orders.html** - Add Google Auth, DataLoader, Audit logging
3. **stock.html** - Add Google Auth, DataPersistence for serials
4. **products.html** - Add Google Auth, DataLoader
5. **gaps.html** - Add Google Auth, DataLoader
6. **analytics.html** - Add Google Auth, DataLoader
7. **tracking.html** - Add Google Auth, DataPersistence

---

## 🔧 Required Updates

### 1. Update initApp() to:
- Initialize Google Auth
- Use DataLoader for optimized loading
- Start real-time polling
- Initialize email service

### 2. Update All Pages to:
- Include Google Auth scripts
- Check authentication on load
- Use DataLoader
- Log audit events

### 3. Update Serial Tracker to:
- Use DataPersistence instead of localStorage

### 4. Update Tracking to:
- Use DataPersistence instead of localStorage

---

## 📋 Integration Checklist

- [ ] Google Auth integrated into all pages
- [ ] DataLoader replaces old loadAllData
- [ ] Real-time polling started
- [ ] Email service initialized
- [ ] Audit logging on all operations
- [ ] Data persistence for serials
- [ ] Data persistence for tracking
- [ ] Session timeout working
- [ ] All pages protected

---

**Status**: Integration Required
**Priority**: High

