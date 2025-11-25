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

#### Step 1: Create Netlify Account

1. Go to [https://www.netlify.com/](https://www.netlify.com/)
2. Click "Sign up" → Choose "Sign up with GitHub"
3. Authorize Netlify to access your GitHub account

#### Step 2: Deploy from GitHub

1. **Add New Site:**
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Authorize Netlify if prompted

2. **Select Repository:**
   - Choose the `Adminforeverse/inventory` repository
   - Click "Connect"

3. **Configure Build Settings:**
   - **Branch to deploy:** `main` (or `master`)
   - **Build command:** Leave empty (this is a static site)
   - **Publish directory:** `/` (root directory)
   - Click "Deploy site"

4. **Wait for Deployment:**
   - Netlify will automatically deploy your site
   - You'll get a URL like: `https://random-name-123456.netlify.app`
   - This is your temporary Netlify URL

#### Step 3: Add Custom Domain (everse.co.in)

1. **In Netlify Dashboard:**
   - Go to your site → "Domain settings"
   - Click "Add custom domain"
   - Enter: `everse.co.in`
   - Click "Verify"

2. **Netlify will show DNS configuration:**
   - You'll see instructions for DNS setup
   - Note the Netlify domain (e.g., `random-name-123456.netlify.app`)

#### Step 4: Configure DNS for everse.co.in

You need to configure DNS with your domain registrar (where you bought everse.co.in):

**Option A: Using A Records (Root Domain - everse.co.in)**

1. Log in to your domain registrar (Namecheap, GoDaddy, etc.)
2. Go to DNS Management for `everse.co.in`
3. Add/Edit DNS records:

   **For Root Domain (everse.co.in):**
   ```
   Type: A
   Name: @ (or leave blank)
   Value: 75.2.60.5
   TTL: 3600 (or Auto)
   ```

   **For WWW Subdomain (www.everse.co.in):**
   ```
   Type: CNAME
   Name: www
   Value: random-name-123456.netlify.app (your Netlify site URL)
   TTL: 3600 (or Auto)
   ```

**Option B: Using CNAME (If your registrar supports CNAME for root domain)**

Some registrars allow CNAME flattening. If yours does:

```
Type: CNAME
Name: @
Value: random-name-123456.netlify.app
TTL: 3600
```

**Important DNS Records to Add:**

1. **Root Domain (everse.co.in):**
   - Type: `A`
   - Name: `@`
   - Value: `75.2.60.5` (Netlify's IP)
   - TTL: `3600`

2. **WWW Subdomain (www.everse.co.in):**
   - Type: `CNAME`
   - Name: `www`
   - Value: `[your-netlify-site].netlify.app`
   - TTL: `3600`

#### Step 5: SSL Certificate (Automatic)

- Netlify automatically provisions SSL certificates via Let's Encrypt
- Wait 5-10 minutes after DNS propagation
- Netlify will enable HTTPS automatically
- Your site will be accessible at: `https://everse.co.in`

#### Step 6: Verify DNS Propagation

Check if DNS has propagated:

1. **Using Terminal/Command Prompt:**
   ```bash
   nslookup everse.co.in
   ping everse.co.in
   ```

2. **Online Tools:**
   - Visit [https://dnschecker.org/](https://dnschecker.org/)
   - Enter `everse.co.in`
   - Check if it resolves globally

3. **Wait Time:**
   - DNS changes can take 24-48 hours to fully propagate
   - Usually works within 1-2 hours

#### Step 7: Test Your Site

1. Visit `https://everse.co.in` in your browser
2. Verify all pages load correctly:
   - `https://everse.co.in/index.html`
   - `https://everse.co.in/orders.html`
   - `https://everse.co.in/products.html`
   - etc.

#### Step 8: Environment Variables (Optional)

If you want to keep API keys secure, add them as environment variables in Netlify:

1. Go to: Site settings → Environment variables
2. Add variables (if you modify code to read from `process.env`):
   - `GOOGLE_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - etc.

**Note:** Currently, API keys are in `config.js`. For production, consider moving sensitive data to environment variables.

#### Troubleshooting

**Domain not working:**
- Check DNS propagation at [dnschecker.org](https://dnschecker.org/)
- Verify DNS records are correct
- Wait 24-48 hours for full propagation
- Check Netlify domain settings → "Check DNS configuration"

**SSL Certificate issues:**
- Ensure DNS is fully propagated
- Wait a few hours after DNS setup
- Contact Netlify support if issues persist

**Build errors:**
- Check Netlify deploy logs
- Verify all files are committed to GitHub
- Ensure no syntax errors in JavaScript files

#### Netlify Domain Settings Reference

- **Default Netlify domain:** `[site-name].netlify.app`
- **Custom domain:** `everse.co.in`
- **SSL:** Automatic (Let's Encrypt)
- **HTTPS:** Enabled automatically

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

