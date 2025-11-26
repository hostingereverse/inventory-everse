# Everse Inventory Management System

Professional inventory management web application with Google OAuth authentication, multi-warehouse support, real-time updates, and comprehensive analytics.

## 🚀 Features

- **🔐 High Security**: Google OAuth authentication with People API
- **👥 User Management**: Admin panel for user management and audit logs
- **📊 Multi-Warehouse**: Track inventory across multiple locations
- **📦 Order Management**: Complete order lifecycle management
- **📈 Analytics**: Comprehensive reporting and analytics
- **🔄 Real-time Updates**: Automatic data synchronization
- **📧 Email Reports**: Daily automated email reports (PDF-ready)
- **🔍 Audit Trail**: Complete logging of all system actions
- **📱 Responsive**: Mobile-friendly interface

## 📋 Tech Stack

- HTML5, Vanilla JavaScript (ES6+)
- Bootstrap 5
- Chart.js
- Google Sheets API v4
- Google OAuth 2.0
- Google People API

## 🔧 Setup

1. **Enable Google APIs**:
   - Enable People API
   - Enable Sheets API
   - Enable Gmail API (for email reports)

2. **Configure OAuth**:
   - Add authorized redirect URIs
   - Set OAuth scopes

3. **Create Google Sheets Tabs**:
   - Users, SerialNumbers, Tracking, Couriers, AuditLog

4. **Update Configuration**:
   - Edit `config.js` with your API keys and sheet IDs

## 📚 Documentation

- `IMPLEMENTATION_GUIDE.md` - Complete setup guide
- `SECURITY_IMPLEMENTATION.md` - Security configuration
- `DEPLOY_TO_GITHUB.md` - Deployment instructions

## 🔐 Default Users

See `config.js` for default authorized users. Add users via Admin Panel.

## 📝 License

Private - Everse Inventory Management

---

**Repository**: https://github.com/Adminforeverse/Inventory-eVerse
