# Cloudflare Access Setup Guide

## Step 1: Enable Cloudflare Access (Zero Trust)

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Access** → **Applications**
3. Click **Add an application**
4. Select **Self-hosted**

## Step 2: Configure Application

- **Application name**: `Everse Inventory Pro`
- **Session duration**: `24 hours`
- **Application domain**: Your Cloudflare Pages domain (e.g., `inventory-everse.pages.dev`)
- **Path**: Leave empty (protect entire site)

## Step 3: Add Access Policies

### Policy 1: Email Domain Restriction

- **Policy name**: `Company Email Only`
- **Action**: Allow
- **Include**:
  - **Emails**: Add allowed email domains (e.g., `@yourcompany.com`)
  - **OR Email addresses**: Add specific emails (e.g., `admin@yourcompany.com`)

### Policy 2: Google Authentication (Optional)

- **Policy name**: `Google Login`
- **Action**: Allow
- **Include**:
  - **Emails**: `@gmail.com` (or your allowed Google domain)
- **Authentication**: **Google** (requires Google OAuth setup)

## Step 4: Test Access

1. Visit your Cloudflare Pages URL
2. You should be redirected to Cloudflare Access login
3. Sign in with allowed email
4. You should have access to the application

## Step 5: Development Mode

For local development, the middleware allows access without authentication. In production, Cloudflare Access automatically protects all routes.

## Notes

- Cloudflare Access is **FREE** for up to 50 users
- No passwords needed - authentication handled by Cloudflare
- Users can use Google, GitHub, Microsoft, or Email One-Time Passcode
- All authentication headers are automatically injected by Cloudflare

## Troubleshooting

- **403 Forbidden**: Check Access policies in Zero Trust dashboard
- **Not redirecting to login**: Ensure Access is enabled for your Pages domain
- **Email not recognized**: Add email/domain to Access policy

