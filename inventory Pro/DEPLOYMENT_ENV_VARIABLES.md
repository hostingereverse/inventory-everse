# Cloudflare Pages Environment Variables Setup

## Required Environment Variable

For Cloudflare Pages deployment to work in non-interactive mode, you need to set:

### `CLOUDFLARE_API_TOKEN`

This token is required for `wrangler` to authenticate and deploy to Cloudflare Pages.

## Quick Setup Steps

### 1. Create API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Use **"Edit Cloudflare Workers"** template
4. Set permissions:
   - Account → Cloudflare Pages → **Edit**
5. Copy the token (you won't see it again!)

### 2. Add to Cloudflare Pages

1. Go to your Pages project: https://dash.cloudflare.com/33cd05529e0bfb1c7eebed9144400d2c/workers-and-pages
2. Click on **"inventory"** project
3. Go to **Settings** > **Environment Variables**
4. Add:
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: (paste your token)
   - **Environments**: Production, Preview, Development
5. Save

### 3. Verify

After setting the token, the next deployment should work automatically.

## Alternative: Local Testing

For local deployment testing:

```bash
# Set environment variable
export CLOUDFLARE_API_TOKEN="your-token-here"

# Deploy
npm run deploy
```

Or on Windows PowerShell:
```powershell
$env:CLOUDFLARE_API_TOKEN="your-token-here"
npm run deploy
```

## Security

- ❌ Never commit token to Git
- ✅ Store only in Cloudflare Dashboard
- ✅ Use environment variables, not code
- ✅ Regenerate if exposed

