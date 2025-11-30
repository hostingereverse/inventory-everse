# Final Deployment Checklist

## ✅ Pre-Deployment

- [x] All files generated
- [x] Dependencies configured
- [x] Database migrations ready
- [x] Cloudflare Access setup guide created

## 🚀 Deployment Steps

### 1. Install Dependencies (Auto-installs)
```bash
npm install
```

### 2. Create Cloudflare Resources

#### D1 Database (Already created)
```bash
# Database ID already in wrangler.toml
# Run migrations:
npm run db:migrate:remote
```

#### R2 Bucket (Optional - for backups)
```bash
npx wrangler r2 bucket create inventory-backups
```

#### Vectorize Index (Optional - for AI analytics)
```bash
npx wrangler vectorize create inventory-vector-index --dimensions=768
```

### 3. Set Environment Variables

**⚠️ CRITICAL**: Environment variables MUST be set in Cloudflare Pages Dashboard, NOT in wrangler.toml.

Go to **Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Environment Variables**

Add these for **Production**, **Preview**, and **Development**:

```
GOOGLE_SHEET_SALES_NOV_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vTtQR1993HKYMuY4YNXHwcJ21KAAQYU1Xk8Xk0BkF6U18IAvGk-_Wl5XFEC_cNhJnHvgFPGSNmxg9vm/pub?gid=0&single=true&output=csv

GOOGLE_SHEET_SALES_OCT_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vTtQR1993HKYMuY4YNXHwcJ21KAAQYU1Xk8Xk0BkF6U18IAvGk-_Wl5XFEC_cNhJnHvgFPGSNmxg9vm/pub?gid=1834564973&single=true&output=csv

GOOGLE_SHEET_SALES_SEP_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vTtQR1993HKYMuY4YNXHwcJ21KAAQYU1Xk8Xk0BkF6U18IAvGk-_Wl5XFEC_cNhJnHvgFPGSNmxg9vm/pub?gid=1396812475&single=true&output=csv

GOOGLE_SHEET_INVENTORY_BANGALORE_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vTqDFekc9mG22gGCvrt1xgBXNLqOMBJim35x3lKQ6bkVS-tsV4pZ8ZegxVnkYwgyxtUbtuhdubxFdLm/pub?gid=450436603&single=true&output=csv
```

### 4. Configure Cron Trigger (Every 3 Hours)

**⚠️ CRITICAL**: Cron triggers for Pages must be configured in the Dashboard, NOT in wrangler.toml.

Go to **Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Functions → Cron Triggers**

Click **"Add Cron Trigger"**:
- **Cron Expression**: `0 */3 * * *` (every 3 hours)
- **Target**: `/api/sync-sheets`
- **Description**: "Sync Google Sheets every 3 hours"

### 5. Enable Cloudflare Access

See `CLOUDFLARE_ACCESS_SETUP.md` for detailed instructions.

### 6. Deploy

#### Option A: GitHub Auto-Deploy
1. Push to GitHub
2. Cloudflare Pages → Connect Repository
3. Build command: `npm run build`
4. Output directory: `dist`

#### Option B: Wrangler CLI
```bash
npm run build
npx wrangler pages deploy dist --project-name=inventory-everse
```

### 7. Verify

- [ ] Dashboard loads
- [ ] Upload page works
- [ ] AI Analytics responds
- [ ] Cloudflare Access login appears
- [ ] Cron job runs (check logs)

## 🔄 Cron Schedule

- **Google Sheets Sync**: Every 3 hours (`0 */3 * * *`)
- Check logs: Cloudflare Dashboard → Workers & Pages → Logs

## 🆓 Free Tier Limits

All features use free tier:
- **Pages**: Unlimited requests
- **D1**: 5GB storage, 5M reads/day, 100K writes/day
- **R2**: 10GB storage, 1M reads/month
- **Workers AI**: 10K requests/day
- **Vectorize**: 5M index operations/month
- **Access**: 50 users

## 📝 Next Steps

1. Configure Google Sheets URLs
2. Set up Cloudflare Access
3. Upload initial data
4. Test AI analytics
5. Monitor usage in dashboard

