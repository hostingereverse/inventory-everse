# Everse Inventory Management

Professional multi-warehouse inventory management application for everse.co.in. Syncs sales from Google Sheets, manages stock entries, and provides comprehensive gap analytics.

## Features

- **Multi-Warehouse Management**: Track inventory across Bangalore, Kolkata, Chennai, and Mumbai
- **Order Management**: View, filter, and fulfill orders with automatic stock deduction
- **Stock Movements**: Log and track all stock in/out movements with history
- **Product Management**: Full CRUD operations for products with reorder level tracking
- **Gap Analysis**: Identify unfulfilled orders and stock gaps by product and location
- **Analytics Dashboard**: KPIs, charts, low/no stock reports, and turnover analysis
- **Google Sheets Integration**: Real-time sync with Google Sheets API with multiple fallback options

## Tech Stack

- HTML5
- Vanilla JavaScript (ES6+)
- Google Sheets API v4 (gapi)
- Chart.js for analytics
- Bootstrap 5 for UI
- PapaParse for CSV fallback

## Setup Instructions

### 1. Google Sheets Setup

Create a Google Sheet with the following tabs:

#### Orders Tab (Columns: A-J)
- OrderID, Date, DeliveryLocation, Product, Status, SP, CP, GST, SalesPerson, Remarks

#### Inventory Tab (Columns: A-I)
- ProductID, Name, Description, UnitCost, ReorderLevel, Stock_Bangalore, Stock_Kolkata, Stock_Chennai, Stock_Mumbai

#### StockMovements Tab (Columns: A-G)
- Date, Warehouse, ProductID, Type, Qty, Notes, User

#### Gaps Tab (Columns: A-E)
- Product, Location, PendingQty, TotalGaps, DateCreated

### 2. Google API Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create OAuth 2.0 credentials (Client ID)
5. Create API Key
6. Update `config.js` with your credentials:
   - `API_KEY`: Your Google Sheets API Key
   - `CLIENT_ID`: Your OAuth Client ID
   - `SPREADSHEETS.SALES`: Sheet ID that hosts the **Orders** tab (sales data)
   - `SPREADSHEETS.INVENTORY`: Sheet ID that hosts the **Inventory**, **StockMovements**, and **Gaps** tabs (inventory data)

### 3. Optional: Google Apps Script Proxy

For additional fallback, deploy a Google Apps Script:

```javascript
function doGet(e) {
  const sheetName = e.parameter.range.split('!')[0];
  const ss = SpreadsheetApp.openById('YOUR_SHEET_ID');
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify({values: data}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Deploy as web app and update `GAS_PROXY_URL` in `config.js`.

### 4. Local Development

Simply open `index.html` in a web browser. The app will use sample data if API is not configured.

For proper functionality, serve the files through a local web server:

```bash
# Python 3
python -m http.server 8000

# Node.js (if you have http-server installed)
npx http-server -p 8000
```

Then access: `http://localhost:8000`

## Deployment

### GitHub Deployment

1. Initialize git repository:
```bash
git init
git add .
git commit -m "Initial commit: Everse Inventory Management"
```

2. Create repository on GitHub and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/everse-inventory.git
git branch -M main
git push -u origin main
```

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Build settings:
   - Build command: (none - static site)
   - Publish directory: `/` (root)
3. Add environment variables in Netlify dashboard (optional, can be in config.js)
4. Custom domain: Add `everse.co.in` and configure DNS CNAME record

## File Structure

```
.
├── index.html          # Dashboard
├── orders.html         # Order management
├── stock.html          # Stock movements
├── products.html       # Product CRUD
├── gaps.html           # Gap analysis
├── analytics.html      # Analytics & reports
├── config.js           # Configuration
├── css/
│   └── styles.css      # Custom styles
├── js/
│   ├── api.js          # Google Sheets API & fallbacks
│   └── app.js          # Shared utilities
└── README.md           # This file
```

## Usage

### Dashboard (index.html)
- View KPIs: Total inventory value, low stock count, no stock items, pending orders
- Charts: Sales by location, stock per warehouse
- Recent orders table

### Orders (orders.html)
- Search/filter orders by ID, date, status, location, sales person
- Mark orders as fulfilled (automatically deducts stock)
- Add new orders
- Export to CSV

### Stock Management (stock.html)
- Record stock movements (In/Out)
- View movement history with pagination
- Filter by date, warehouse, type

### Products (products.html)
- Add/edit/delete products
- View stock levels per warehouse
- Search and pagination
- Export to CSV

### Gaps (gaps.html)
- View unfulfilled orders aggregated by product and location
- Sync gaps from orders
- Resolve gaps when stock arrives

### Analytics (analytics.html)
- Low stock items (< reorder level)
- No stock items (= 0)
- Items out of stock > 30 days
- Turnover ratio charts
- Export reports to CSV

## Fallback Mechanisms

The app uses multiple fallback mechanisms for data loading:

1. **Google Sheets API** (Primary) - Full read/write access
2. **CSV Export** (Fallback 1) - Public CSV export from Google Sheets
3. **GAS Proxy** (Fallback 2) - Google Apps Script web app
4. **Sample Data** (Fallback 3) - Local sample data for testing

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (responsive design)

## License

Proprietary - Everse Inventory Management System

## Support

For issues or questions, contact the development team.

