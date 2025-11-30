# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Create D1 Database
```bash
npx wrangler d1 create inventory-everse-db
```
Copy the `database_id` and update `wrangler.toml` line 9:
```toml
database_id = "YOUR_ID_HERE"
```

### 3. Run Migrations
```bash
npm run db:migrate
```

### 4. Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:4321`

### 5. Deploy to Cloudflare Pages

#### Option A: GitHub Auto-Deploy (Recommended)
1. Push to: `https://github.com/hostingereverse/inventory-everse`
2. Cloudflare Pages → Create Project → Connect Repo
3. Build settings:
   - Command: `npm run build`
   - Output: `dist`
4. Add environment variables in dashboard
5. Run remote migrations: `npm run db:migrate:remote`

#### Option B: Wrangler CLI
```bash
npm run build
npx wrangler pages deploy dist --project-name=inventory-everse
```

## ✅ Next Steps

1. **Upload Data**: Go to Inventory page → Upload CSV/Excel
2. **Set Google Sheets**: Add environment variables for auto-sync
3. **Configure Cron**: Already set to sync daily at 3 AM UTC

## 📝 Notes

- All pages are server-rendered for fast loading
- Database operations happen server-side
- Dark mode preference saved in browser
- Export functionality available on all data views

