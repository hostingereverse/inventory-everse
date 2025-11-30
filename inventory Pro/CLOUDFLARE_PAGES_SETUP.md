# Cloudflare Pages Setup Guide

## ⚠️ Important Notes

**Cloudflare Pages has different configuration requirements than Workers:**

1. ❌ **DO NOT** use `[triggers]` section in `wrangler.toml` for Pages
2. ❌ **DO NOT** set environment variables in `wrangler.toml` for Pages
3. ✅ Environment variables must be set in the **Cloudflare Dashboard**
4. ✅ Cron triggers must be configured in the **Cloudflare Dashboard**

## 📋 Setup Steps

### 1. Environment Variables

Go to **Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Environment Variables**

Add these variables for **Production**, **Preview**, and **Development**:

```
GOOGLE_SHEET_SALES_NOV_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vTtQR1993HKYMuY4YNXHwcJ21KAAQYU1Xk8Xk0BkF6U18IAvGk-_Wl5XFEC_cNhJnHvgFPGSNmxg9vm/pub?gid=0&single=true&output=csv

GOOGLE_SHEET_SALES_OCT_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vTtQR1993HKYMuY4YNXHwcJ21KAAQYU1Xk8Xk0BkF6U18IAvGk-_Wl5XFEC_cNhJnHvgFPGSNmxg9vm/pub?gid=1834564973&single=true&output=csv

GOOGLE_SHEET_SALES_SEP_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vTtQR1993HKYMuY4YNXHwcJ21KAAQYU1Xk8Xk0BkF6U18IAvGk-_Wl5XFEC_cNhJnHvgFPGSNmxg9vm/pub?gid=1396812475&single=true&output=csv

GOOGLE_SHEET_INVENTORY_BANGALORE_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vTqDFekc9mG22gGCvrt1xgBXNLqOMBJim35x3lKQ6bkVS-tsV4pZ8ZegxVnkYwgyxtUbtuhdubxFdLm/pub?gid=450436603&single=true&output=csv
```

### 2. Cron Triggers (Every 3 Hours)

Go to **Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Functions → Cron Triggers**

Click **"Add Cron Trigger"**:

- **Cron Expression**: `0 */3 * * *` (every 3 hours)
- **Target**: `/api/sync-sheets`
- **Description**: "Sync Google Sheets every 3 hours"

### 3. D1 Database Binding

The D1 database binding is already configured in `wrangler.toml`. Make sure the database exists:

```bash
# If not already created:
npx wrangler d1 create inventory-everse-db

# Then update database_id in wrangler.toml
```

### 4. Run Migrations

```bash
npm run db:migrate:remote
```

### 5. Deploy

Push to GitHub and Cloudflare Pages will auto-deploy, or manually deploy:

```bash
npm run build
npx wrangler pages deploy dist --project-name=inventory-everse
```

## 🔍 Verification

1. **Check Deployment**: Go to Pages dashboard and verify deployment succeeded
2. **Test Sync**: Visit `https://your-site.pages.dev/api/sync-sheets` (should return JSON)
3. **Check Logs**: Workers & Pages → Logs → View recent requests
4. **Verify Cron**: Check if cron trigger appears in Settings → Functions → Cron Triggers

## ❌ Common Errors Fixed

- ✅ Removed `[triggers]` section from `wrangler.toml`
- ✅ Removed `node_compat` from `wrangler.toml` (Pages handles this via `compatibility_flags`)
- ✅ Removed environment variables from `wrangler.toml` (must be in Dashboard)
- ✅ Added instructions for Dashboard configuration

## 📝 Notes

- Pages Functions automatically get Node.js compatibility via `compatibility_flags = ["nodejs_compat"]`
- Cron triggers are configured per-function in the Dashboard, not in wrangler.toml
- Environment variables are per-environment (Production/Preview/Development) in the Dashboard
- All bindings (D1, R2, AI, Vectorize) work the same way in Pages as in Workers

