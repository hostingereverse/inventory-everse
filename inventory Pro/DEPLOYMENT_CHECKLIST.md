# 🚀 Deployment Checklist for Inventory eVerse Pro

## Pre-Deployment Checks

### ✅ Code Quality
- [ ] All TypeScript compilation errors resolved
- [ ] All linter errors fixed
- [ ] Build completes successfully (`npm run build`)
- [ ] No console errors in browser
- [ ] All imports and dependencies resolved

### ✅ Database & Migrations
- [ ] D1 database created in Cloudflare Dashboard
- [ ] Database ID noted: `a9adc311-d75a-4fb7-aab4-40cf0cfc949c`
- [ ] All migrations run locally (`npm run db:migrate`)
- [ ] All migrations run on remote (`npm run db:migrate:remote`)
- [ ] Database schema matches `migrations/0001_full_schema.sql`
- [ ] Test data inserted (optional)

### ✅ Cloudflare Services Setup

#### D1 Database
- [ ] D1 database created
- [ ] Database ID configured in `wrangler.toml`
- [ ] Bindings configured in Cloudflare Pages Dashboard

#### R2 Storage (for backups)
- [ ] R2 bucket created: `BACKUPS`
- [ ] Binding configured in Cloudflare Pages Dashboard

#### Workers AI
- [ ] Workers AI enabled in Cloudflare Dashboard
- [ ] Binding `AI` configured in Cloudflare Pages Dashboard

#### Vectorize (optional)
- [ ] Vectorize index created: `inventory-vector-index`
- [ ] Binding configured in Cloudflare Pages Dashboard

#### Analytics Engine (optional)
- [ ] Analytics Engine binding configured

### ✅ Environment Variables

Set in **Cloudflare Pages Dashboard → Settings → Environment Variables**:

#### Required
- [ ] `GOOGLE_SHEET_SALES_NOV_URL` - November sales sheet (Published as CSV)
- [ ] `GOOGLE_SHEET_SALES_OCT_URL` - October sales sheet (Published as CSV)
- [ ] `GOOGLE_SHEET_SALES_SEP_URL` - September sales sheet (Published as CSV)
- [ ] `GOOGLE_SHEET_INVENTORY_BANGALORE_URL` - Bangalore inventory sheet (Published as CSV)
- [ ] `GOOGLE_SHEET_SALES_URL` - Legacy sales sheet (optional)
- [ ] `GOOGLE_SHEET_ACCOUNTS_URL` - Accounts/Suppliers sheet (optional)
- [ ] `GOOGLE_SHEET_ADS_URL` - Ad spends sheet (optional)

#### Optional
- [ ] Any custom API keys
- [ ] Feature flags

### ✅ Cloudflare Pages Configuration

#### Build Settings
- [ ] **Build command**: `npm run build`
- [ ] **Build output directory**: `dist`
- [ ] **Root directory**: `/` (or project root)
- [ ] **Node.js version**: `20.x` or later
- [ ] **NPM version**: Latest

#### Functions
- [ ] Functions directory: `functions`
- [ ] Functions detected automatically

#### Bindings
- [ ] **D1 Database**: `DB` binding with database ID
- [ ] **R2 Bucket**: `BACKUPS` binding
- [ ] **Workers AI**: `AI` binding
- [ ] **Vectorize**: `VECTORIZE` binding (if used)
- [ ] **Analytics Engine**: `ANALYTICS` binding (if used)

### ✅ Cron Triggers

Set in **Cloudflare Pages Dashboard → Settings → Functions → Cron Triggers**:

- [ ] **Schedule**: `0 */3 * * *` (Every 3 hours)
- [ ] **Target**: `/api/sync-sheets`
- [ ] **Description**: "Sync Google Sheets data every 3 hours"

### ✅ Cloudflare Access (Zero Trust)

- [ ] Cloudflare Access application created
- [ ] Application URL configured: `https://inventory-everse.pages.dev/*`
- [ ] Access policies configured:
  - [ ] Email domain allowlist (e.g., `@yourcompany.com`)
  - [ ] Or specific email addresses
  - [ ] Or Google OAuth
- [ ] Test access from allowed email
- [ ] Test access from blocked email (should be denied)

### ✅ Google Sheets Configuration

For each Google Sheet:
- [ ] Sheet is published as CSV
- [ ] **File → Share → Publish to web → CSV format**
- [ ] URL copied and added to environment variables
- [ ] Sheet headers match expected format (see `COLUMN_MAPPING.md`)
- [ ] Test URLs are accessible (no authentication required)

### ✅ File Structure Verification

Ensure these files exist:
- [ ] `package.json` - Dependencies defined
- [ ] `wrangler.toml` - Cloudflare configuration
- [ ] `astro.config.mjs` - Astro configuration
- [ ] `tsconfig.json` - TypeScript configuration
- [ ] `tailwind.config.mjs` - Tailwind configuration
- [ ] `src/pages/*.astro` - All pages
- [ ] `src/lib/*.ts` - Library files
- [ ] `src/components/*.astro` - Components
- [ ] `functions/api/*.ts` - API endpoints
- [ ] `migrations/*.sql` - Database migrations

## Deployment Steps

### 1. Git Repository Setup
- [ ] Repository created (GitHub/GitLab/Bitbucket)
- [ ] `.gitignore` configured correctly
- [ ] Initial commit made
- [ ] Remote repository added

### 2. Cloudflare Pages Connection
- [ ] Go to Cloudflare Dashboard → Pages
- [ ] Click "Create a project"
- [ ] Connect to Git repository
- [ ] Select repository and branch (usually `main` or `master`)

### 3. Build Configuration
- [ ] Framework preset: **Astro**
- [ ] Build command: `npm run build`
- [ ] Build output directory: `dist`
- [ ] Root directory: `/` (or leave empty)

### 4. Environment Variables
- [ ] Add all required environment variables (see above)
- [ ] Test in production environment
- [ ] Verify no secrets are hardcoded

### 5. Bindings Configuration
- [ ] Configure D1 binding: `DB`
- [ ] Configure R2 binding: `BACKUPS`
- [ ] Configure Workers AI binding: `AI`
- [ ] Configure Vectorize binding: `VECTORIZE` (if used)
- [ ] Configure Analytics Engine binding: `ANALYTICS` (if used)

### 6. Deploy
- [ ] Push code to Git repository
- [ ] Cloudflare Pages automatically builds
- [ ] Monitor build logs for errors
- [ ] Verify deployment successful

### 7. Post-Deployment

#### Database Migrations
- [ ] Run migrations on production:
  ```bash
  wrangler d1 migrations apply DB --remote
  ```
- [ ] Verify all tables created
- [ ] Verify indexes created

#### Testing
- [ ] Visit deployed URL: `https://inventory-everse.pages.dev`
- [ ] Test Cloudflare Access login
- [ ] Test dashboard loads
- [ ] Test navigation menu
- [ ] Test upload functionality
- [ ] Test AI Analytics
- [ ] Test Google Sheets sync (wait for cron trigger or trigger manually)
- [ ] Test all pages load correctly:
  - [ ] Dashboard (`/`)
  - [ ] Inventory (`/inventory`)
  - [ ] Sales (`/sales`)
  - [ ] Suppliers (`/suppliers`)
  - [ ] Upload (`/upload`)
  - [ ] AI Analytics (`/analytics`)
  - [ ] Low Stock (`/low-stock`)
  - [ ] ABC Analysis (`/abc-analysis`)
  - [ ] P&L (`/pnl`)

#### API Endpoints
- [ ] `/api/upload` - File upload works
- [ ] `/api/template` - Template download works
- [ ] `/api/sync-sheets` - Manual trigger works (optional)
- [ ] `/api/ai-query` - AI query works
- [ ] `/api/scrape-everse` - Web scraping works (if used)

#### Data Verification
- [ ] Upload test CSV/Excel file
- [ ] Verify data appears in database
- [ ] Verify KPIs calculate correctly
- [ ] Verify charts render (if any)

### 8. Monitoring & Maintenance

- [ ] Set up Cloudflare Analytics
- [ ] Monitor error rates
- [ ] Monitor API usage (Workers AI, D1, R2)
- [ ] Check cron triggers are executing
- [ ] Monitor Google Sheets sync status
- [ ] Set up alerts for critical failures

## Troubleshooting

### Build Fails
- Check build logs in Cloudflare Pages
- Verify `package.json` dependencies
- Verify Node.js version compatibility
- Check for TypeScript errors locally first

### Database Errors
- Verify D1 database ID is correct
- Verify bindings are configured
- Check migrations ran successfully
- Verify database has data (if expected)

### API Endpoints Not Working
- Verify functions directory is correct
- Check function file naming (`onRequest.ts`, `onRequestPost.ts`)
- Verify environment variables are set
- Check Cloudflare Workers logs

### Google Sheets Not Syncing
- Verify URLs are accessible (no auth required)
- Check URLs are CSV format (not HTML)
- Verify cron trigger is configured
- Check environment variable names match exactly
- Manually trigger sync via API endpoint

### Access Issues
- Verify Cloudflare Access application is active
- Check access policies are correct
- Verify user email matches policy
- Clear browser cache/cookies

## Rollback Plan

If deployment fails:
1. Go to Cloudflare Pages → Deployments
2. Find last successful deployment
3. Click "Retry deployment" or "Rollback"
4. Fix issues and redeploy

## Security Checklist

- [ ] No API keys or secrets in code
- [ ] All secrets in environment variables
- [ ] Cloudflare Access enabled
- [ ] HTTPS enforced
- [ ] Input validation on all API endpoints
- [ ] XSS protection (HTML escaping)
- [ ] SQL injection prevention (parameterized queries)

## Performance Optimization

- [ ] Enable Cloudflare CDN caching
- [ ] Optimize images (if any)
- [ ] Enable Brotli compression
- [ ] Monitor bundle sizes
- [ ] Check D1 query performance
- [ ] Optimize database indexes

## Documentation

- [ ] README.md updated
- [ ] API documentation updated
- [ ] User guide created (if needed)
- [ ] Environment variables documented
- [ ] Deployment process documented

---

**Last Updated**: 2024-12-19
**Version**: 3.0.0
**Maintainer**: Everse Team
