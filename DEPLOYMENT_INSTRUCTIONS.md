# Deployment Instructions

## Step 1: Create Cloudflare D1 Database

```bash
npx wrangler d1 create inventory-everse-db
```

Copy the `database_id` and update `wrangler.toml`:

```toml
database_id = "YOUR_DATABASE_ID_HERE"
```

## Step 2: Run Migrations

```bash
# For local development
npm run db:migrate

# For production (after deployment)
npm run db:migrate:remote
```

## Step 3: Deploy to Cloudflare Pages

### Option A: Via GitHub (Recommended)

1. Push code to GitHub repo: `https://github.com/hostingereverse/inventory-everse`
2. Go to Cloudflare Dashboard → Workers & Pages
3. Create new Pages project
4. Connect GitHub repository
5. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Deploy command**: (leave empty)
6. Add environment variables:
   - `GOOGLE_SHEET_SALES_URL`
   - `GOOGLE_SHEET_ACCOUNTS_URL`
   - `GOOGLE_SHEET_ADS_URL`
7. Deploy!

### Option B: Via Wrangler CLI

```bash
npm run build
npx wrangler pages deploy dist --project-name=inventory-everse
```

## Step 4: Configure Cron Trigger

The cron trigger is already configured in `wrangler.toml`:
- Runs daily at 3 AM UTC
- Syncs Google Sheets data automatically

## Step 5: Verify

1. Visit your Cloudflare Pages URL
2. Check dashboard loads correctly
3. Test CSV upload on inventory page
4. Verify database connections

## Environment Variables

Set these in Cloudflare Pages Dashboard → Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_SHEET_SALES_URL` | Public CSV URL for sales | `https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=0` |
| `GOOGLE_SHEET_ACCOUNTS_URL` | Public CSV URL for accounts | Same format |
| `GOOGLE_SHEET_ADS_URL` | Public CSV URL for ad spends | Same format |

## Troubleshooting

- **Build fails**: Check Node.js version (requires 18+)
- **Database errors**: Run migrations first
- **Function errors**: Check environment variables are set
- **Cron not running**: Verify cron trigger in `wrangler.toml`

