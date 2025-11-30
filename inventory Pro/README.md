# Everse Inventory Pro – Internal Tool (Free Tier Only)

**Fully private internal inventory + sales + supplier management tool** with zero external paid services. Built entirely on Cloudflare's free tier.

## 🚀 Tech Stack

- **Framework**: Astro 5 + Tailwind CSS + Alpine.js
- **Backend**: Cloudflare Pages Functions (TypeScript)
- **Database**: Cloudflare D1 (SQLite) - 5GB free
- **Auth**: Cloudflare Access (Zero Trust) - 50 users free
- **AI Analytics**: Workers AI (Llama 3.1 8B) - 10K requests/day free
- **File Storage**: Cloudflare R2 - 10GB free
- **Scraping**: Cheerio (Node.js compat)

## ✨ Key Features

### 🔐 Security
- **Cloudflare Access Protection**: Only allowed emails can access (no passwords!)
- Google or Email domain login only
- Automatic authentication headers

### 📤 Data Ingestion
- **Daily auto-sync** from Google Sheets (sales, ads, customers) - **every 3 hours**
- **Manual upload**: CSV, Excel (.xlsx), and smart TXT files
- **Smart TXT parser**: Automatically extracts Order ID, Price, Email, Delivery days, Payment method, Supplier data from messy text
- **AI fallback**: Uses Workers AI if regex parsing fails

### 🤖 AI Analytics
- Natural language queries: "Show low stock", "Forecast sales", "Find price differences"
- AI converts questions to SQL automatically
- Chart.js visualizations
- Floating AI button on all pages

### 🌐 Web Scraping
- Scrape product name & latest price from `everse.in`
- Auto-match scraped prices with inventory
- Update inventory automatically

### 📊 Templates
- Generate and download perfect CSV/Excel templates
- Accounts (Suppliers) template
- Sales template

## 🛠️ Quick Start

### 1. Install Dependencies (Auto-installs)
```bash
npm install
```
Dependencies install automatically via `postinstall` script.

### 2. Create Cloudflare Resources

#### D1 Database (Already configured)
```bash
# Database ID already in wrangler.toml
# Run migrations:
npm run db:migrate:remote
```

### 3. Set Environment Variables

In Cloudflare Pages Dashboard → Settings → Environment Variables:

```
GOOGLE_SHEET_SALES_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv&gid=0
GOOGLE_SHEET_ACCOUNTS_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv&gid=0
GOOGLE_SHEET_ADS_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv&gid=0
```

### 4. Enable Cloudflare Access

See `CLOUDFLARE_ACCESS_SETUP.md` for detailed instructions.

### 5. Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name=inventory-everse
```

Or connect GitHub repo in Cloudflare Pages for auto-deploy.

## 📋 Smart TXT Parser Examples

The parser understands irregular formats automatically:

```
Order ID: ORD-2025-001 | Price: 1299 | Email: john@company.com | Delivered in 4 days
ORD-2025-002 paid 899 via UPI john.doe@gmail.com
Update on ORD-2025-001: price changed to 1199, delivered
Supplier: ABC Electronics | Purchase Rate: 850 | Qty: 50 | Paid cash 30/11/2025
```

All patterns are detected via regex, with AI fallback for edge cases.

## 🔄 Cron Schedule

- **Google Sheets Sync**: Every 3 hours (`0 */3 * * *`)
- Check logs: Cloudflare Dashboard → Workers & Pages → Logs

## 🆓 Free Tier Limits

All features use free tier:
- **Pages**: Unlimited requests
- **D1**: 5GB storage, 5M reads/day, 100K writes/day
- **R2**: 10GB storage, 1M reads/month
- **Workers AI**: 10K requests/day
- **Access**: 50 users

## 📁 Project Structure

```
├── src/
│   ├── components/     # Astro components
│   ├── lib/            # Utilities & DB helpers
│   ├── middleware.ts   # Cloudflare Access protection
│   └── pages/          # Routes
├── functions/
│   └── api/            # Cloudflare Pages Functions
│       ├── upload.ts        # CSV/Excel/TXT upload
│       ├── scrape-everse.ts # Web scraping
│       ├── sync-sheets.ts   # Google Sheets sync (cron)
│       ├── ai-query.ts      # AI analytics
│       ├── template.ts      # Template generator
│       └── match-updates.ts # Auto-match updates
├── migrations/         # D1 database migrations
└── wrangler.toml       # Cloudflare configuration
```

## 🎯 Pages

- `/` - Dashboard with KPIs
- `/upload` - Drag & drop file uploads
- `/analytics` - AI-powered analytics
- `/suppliers` - Supplier management
- `/inventory` - Inventory list
- `/sales` - Sales data
- `/low-stock` - Low stock alerts

## 📝 Notes

- All authentication handled by Cloudflare Access
- No passwords needed - email domain restriction
- All data stored in Cloudflare D1 (SQLite)
- Auto-installs dependencies on `npm install`
- Dark mode with localStorage persistence
- Mobile-first responsive design

## 🚢 Deployment

See `DEPLOYMENT_FINAL.md` for complete deployment checklist.

## 📄 License

Private - Everse Inventory Management
