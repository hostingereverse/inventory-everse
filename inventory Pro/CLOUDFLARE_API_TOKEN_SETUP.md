# Cloudflare API Token Setup Guide

## Issue
During deployment, you're seeing:
```
In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work.
```

## Solution: Create and Configure Cloudflare API Token

### Step 1: Create API Token in Cloudflare Dashboard

1. **Login to Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com/
   - Login with: `hostinget.everse@gmail.com`

2. **Navigate to API Tokens**
   - Click on your profile icon (top right)
   - Select **"My Profile"**
   - Go to **"API Tokens"** tab
   - Or go directly to: https://dash.cloudflare.com/profile/api-tokens

3. **Create New Token**
   - Click **"Create Token"** button
   - You can either:
     - **Option A**: Use a template (recommended for Pages)
     - **Option B**: Create custom token

### Step 2A: Use Template (Recommended)

1. Click **"Edit Cloudflare Workers"** template
   - Or use **"Edit Cloudflare Pages"** template if available
   
2. Configure permissions:
   - **Account**: Select your account
   - **Cloudflare Pages**: 
     - **Edit** permission
     - Or **Read & Write** permission
   - **Zone Resources**: Include all zones (or specific zones if needed)

3. Click **"Continue to summary"**
4. Click **"Create Token"**
5. **Copy the token immediately** - you won't be able to see it again!

### Step 2B: Create Custom Token

1. Click **"Create Token"** > **"Get started"**
2. Under **"Permissions"**:
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Account** → **Account Settings** → **Read** (optional)
3. Under **"Account Resources"**:
   - Select your account: `Hostinger.everse@gmail.com's Account`
4. Under **"Zone Resources"**:
   - Include: All zones (or specific if needed)
5. Click **"Continue to summary"**
6. Review and click **"Create Token"**
7. **Copy the token immediately**

### Step 3: Add Token to Cloudflare Pages Environment Variables

1. **Go to Cloudflare Pages Dashboard**
   - Navigate to: https://dash.cloudflare.com/33cd05529e0bfb1c7eebed9144400d2c/workers-and-pages
   - Or: Workers & Pages > Pages

2. **Select Your Project**
   - Click on **"inventory"** project

3. **Open Settings**
   - Click **"Settings"** tab
   - Go to **"Environment Variables"** section

4. **Add Environment Variable**
   - Click **"Add variable"** or **"Add environment variable"**
   - **Variable name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: Paste your API token (the one you copied)
   - **Environment**: Select:
     - ✅ **Production**
     - ✅ **Preview** (optional, but recommended)
     - ✅ **Development** (optional)

5. **Save**
   - Click **"Save"** or **"Add"**

### Step 4: Verify Token

After adding the token, the next deployment should work automatically.

**To test manually:**
```bash
# Set token as environment variable (local testing only)
export CLOUDFLARE_API_TOKEN="your-token-here"

# Test deployment
npm run deploy
```

### Step 5: Alternative - Set in Build Settings

If environment variables don't work, you can also set it in the build command:

1. Go to **Settings** > **Builds & deployments**
2. Under **Environment Variables**:
   - Add: `CLOUDFLARE_API_TOKEN` = `your-token-here`

### Required Permissions Summary

Your API token needs at minimum:
- ✅ **Account** → **Cloudflare Pages** → **Edit** (or Read & Write)
- ✅ Access to your account: `33cd05529e0bfb1c7eebed9144400d2c`

### Security Notes

⚠️ **Important Security Practices:**
- Never commit the API token to Git
- Store it only in Cloudflare Pages environment variables
- Regenerate token if it's exposed
- Use least privilege principle (only give necessary permissions)
- Rotate tokens periodically

### Token Permissions Reference

For Cloudflare Pages deployment, you need:
- **Account** → **Cloudflare Pages** → **Edit**
- **Account** → **Account Settings** → **Read** (for account info)
- **Zone** → **Zone Settings** → **Read** (if using custom domains)

### Troubleshooting

**If deployment still fails:**

1. **Verify token is set:**
   - Go to Pages project > Settings > Environment Variables
   - Confirm `CLOUDFLARE_API_TOKEN` exists

2. **Check token permissions:**
   - Go to Profile > API Tokens
   - Verify token has "Edit" permission for Pages

3. **Verify account access:**
   - Ensure token has access to account: `33cd05529e0bfb1c7eebed9144400d2c`

4. **Check deployment logs:**
   - Go to Pages project > Deployments
   - View build logs for specific error messages

5. **Try regenerating token:**
   - Delete old token
   - Create new token with correct permissions
   - Update environment variable

### Quick Links

- Create Token: https://dash.cloudflare.com/profile/api-tokens
- API Token Docs: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- Pages Dashboard: https://dash.cloudflare.com/33cd05529e0bfb1c7eebed9144400d2c/workers-and-pages

### Next Steps

After setting up the token:
1. ✅ Token created in Cloudflare Dashboard
2. ✅ Token added to Pages environment variables
3. ✅ Next Git push will trigger deployment
4. ✅ Deployment should succeed automatically

