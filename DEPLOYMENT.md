# Netlify Deployment & DNS Setup Guide

Complete step-by-step guide for deploying Everse Inventory Management to Netlify and configuring DNS for everse.co.in.

## Prerequisites

- ✅ GitHub repository created and code pushed: `https://github.com/Adminforeverse/inventory`
- ✅ Domain `everse.co.in` purchased and access to DNS management
- ✅ Netlify account (free tier works perfectly)

---

## Part 1: Netlify Deployment

### Step 1: Create/Login to Netlify

1. Visit [https://www.netlify.com/](https://www.netlify.com/)
2. Click **"Sign up"** → Choose **"Sign up with GitHub"**
3. Authorize Netlify to access your GitHub repositories
4. You'll be redirected to the Netlify dashboard

### Step 2: Import Your Repository

1. Click the **"Add new site"** button
2. Select **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. If first time, authorize Netlify:
   - Click **"Authorize Netlify"**
   - Select repository access: **"All repositories"** or **"Only select repositories"** (choose `inventory`)
   - Click **"Install"**

5. **Select your repository:**
   - Find and click on `Adminforeverse/inventory`
   - Click **"Connect"**

### Step 3: Configure Build Settings

**IMPORTANT:** This is a static site, so we need minimal build configuration.

1. **Branch to deploy:** `main` (or `master` if you're on master branch)
2. **Build command:** Leave **EMPTY** (no build step needed)
3. **Publish directory:** `/` (root directory)
4. Click **"Deploy site"**

### Step 4: Wait for Deployment

- Netlify will start deploying immediately
- You'll see build logs in real-time
- Deployment usually takes 30-60 seconds
- Once complete, you'll see: **"Site is live"**
- You'll get a Netlify URL like: `https://random-name-123456.netlify.app`

✅ **Test your deployment:** Visit the Netlify URL to verify the site works!

---

## Part 2: Custom Domain Setup (everse.co.in)

### Step 5: Add Custom Domain in Netlify

1. In Netlify dashboard, go to your site
2. Click **"Domain settings"** (left sidebar)
3. Click **"Add custom domain"**
4. Enter: `everse.co.in`
5. Click **"Verify"**
6. Click **"Yes, add domain"**

### Step 6: Configure Domain Settings

1. Netlify will show you DNS configuration options
2. Note your Netlify site URL (e.g., `random-name-123456.netlify.app`)
3. Click **"Check DNS configuration"** to see what records you need

---

## Part 3: DNS Configuration

You need to configure DNS with your domain registrar (where you purchased everse.co.in).

### Find Your Domain Registrar

Common registrars:
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare
- AWS Route 53

### DNS Configuration Methods

#### Method 1: Root Domain + WWW (Recommended)

This setup allows both `everse.co.in` and `www.everse.co.in` to work.

**In your domain registrar's DNS settings, add:**

**Record 1: Root Domain (everse.co.in)**
```
Type: A Record
Name: @ (or leave blank, or "everse.co.in")
Value: 75.2.60.5
TTL: 3600 (or Auto)
```

**Record 2: WWW Subdomain (www.everse.co.in)**
```
Type: CNAME
Name: www
Value: [your-netlify-site].netlify.app
TTL: 3600 (or Auto)
```

**Example from Netlify dashboard:**
```
A Record:
  Name: @
  Value: 75.2.60.5

CNAME Record:
  Name: www
  Value: happy-unicorn-123456.netlify.app
```

#### Method 2: CNAME Flattening (If Supported)

Some registrars (like Cloudflare) support CNAME at root:

```
Type: CNAME
Name: @
Value: [your-netlify-site].netlify.app
TTL: 3600
```

---

## Part 4: Step-by-Step DNS Setup (Popular Registrars)

### Namecheap

1. Log in to [Namecheap](https://www.namecheap.com/)
2. Go to **"Domain List"**
3. Click **"Manage"** next to `everse.co.in`
4. Go to **"Advanced DNS"** tab
5. Add/Edit records:

   **For Root Domain:**
   ```
   Type: A Record
   Host: @
   Value: 75.2.60.5
   TTL: Automatic
   ```

   **For WWW:**
   ```
   Type: CNAME Record
   Host: www
   Value: [your-netlify-site].netlify.app
   TTL: Automatic
   ```

6. Click **"Save"** (checkmark icon)

### GoDaddy

1. Log in to [GoDaddy](https://www.godaddy.com/)
2. Go to **"My Products"**
3. Click **"DNS"** next to `everse.co.in`
4. Scroll to **"Records"** section
5. Add/Edit records:

   **For Root Domain:**
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   TTL: 600 seconds
   ```

   **For WWW:**
   ```
   Type: CNAME
   Name: www
   Value: [your-netlify-site].netlify.app
   TTL: 600 seconds
   ```

6. Click **"Save"**

### Cloudflare

1. Log in to [Cloudflare](https://www.cloudflare.com/)
2. Select `everse.co.in` domain
3. Go to **"DNS"** → **"Records"**
4. Add records:

   **For Root Domain (using A Record):**
   ```
   Type: A
   Name: @
   IPv4 address: 75.2.60.5
   Proxy status: DNS only (gray cloud) or Proxied (orange cloud)
   TTL: Auto
   ```

   **For WWW:**
   ```
   Type: CNAME
   Name: www
   Target: [your-netlify-site].netlify.app
   Proxy status: DNS only (gray cloud)
   TTL: Auto
   ```

5. Click **"Save"**

---

## Part 5: SSL Certificate (Automatic)

✅ **Netlify automatically provides SSL certificates!**

1. After DNS is configured, Netlify will detect your domain
2. SSL certificate provisioning starts automatically (takes 5-10 minutes)
3. Check status in: **Domain settings** → **HTTPS**
4. Once ready, your site will be accessible at: `https://everse.co.in`

**Note:** SSL certificate provisioning requires:
- DNS records to be propagated
- Domain verified in Netlify
- Wait time: Usually 5-10 minutes, sometimes up to 24 hours

---

## Part 6: Verify Everything Works

### Check DNS Propagation

1. **Online Checker:**
   - Visit [https://dnschecker.org/](https://dnschecker.org/)
   - Enter `everse.co.in`
   - Click **"Search"**
   - Verify it shows `75.2.60.5` or your Netlify site globally

2. **Command Line:**
   ```bash
   nslookup everse.co.in
   ping everse.co.in
   ```

3. **Wait Time:**
   - DNS changes take **15 minutes to 48 hours** to propagate
   - Usually works within **1-2 hours**
   - Different regions may update at different times

### Test Your Site

1. Visit `https://everse.co.in` (wait for SSL certificate)
2. Or visit `http://everse.co.in` first (will redirect to HTTPS)
3. Test all pages:
   - ✅ `https://everse.co.in/`
   - ✅ `https://everse.co.in/index.html`
   - ✅ `https://everse.co.in/orders.html`
   - ✅ `https://everse.co.in/products.html`
   - ✅ `https://everse.co.in/stock.html`
   - ✅ `https://everse.co.in/gaps.html`
   - ✅ `https://everse.co.in/analytics.html`

### Verify HTTPS

1. Check browser address bar shows **🔒 lock icon**
2. URL should show `https://everse.co.in`
3. No security warnings should appear

---

## Part 7: Netlify Settings Configuration

### Redirect HTTP to HTTPS (Automatic)

Netlify automatically redirects HTTP → HTTPS. No action needed!

### Force HTTPS

1. Go to: **Site settings** → **Domain management**
2. Under **HTTPS**, verify:
   - ✅ "Automatic HTTPS provisioning" is ON
   - ✅ "Force HTTPS" is enabled (usually automatic)

### Custom 404 Page (Optional)

1. Create `404.html` in your project root
2. Commit and push to GitHub
3. Netlify will automatically use it

---

## Part 8: Continuous Deployment

✅ **Already configured!** Your site auto-deploys when you push to GitHub.

### How it works:

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. Netlify automatically detects the push
4. Builds and deploys new version (usually 30-60 seconds)
5. Site updates live automatically!

### Deployment Status

- Check deployment history: **Site dashboard** → **Deploys**
- View build logs for each deployment
- Rollback to previous deployment if needed

---

## Troubleshooting

### Domain Not Resolving

**Problem:** `everse.co.in` doesn't load or shows DNS error

**Solutions:**
1. ✅ Verify DNS records are correct in your registrar
2. ✅ Check DNS propagation: [dnschecker.org](https://dnschecker.org/)
3. ✅ Wait 24-48 hours for full propagation
4. ✅ Clear browser cache and DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # macOS/Linux
   sudo dscacheutil -flushcache
   ```

### SSL Certificate Not Provisioning

**Problem:** HTTPS not working or certificate error

**Solutions:**
1. ✅ Ensure DNS is fully propagated
2. ✅ Verify domain is added in Netlify Domain settings
3. ✅ Check Netlify → Domain settings → HTTPS for errors
4. ✅ Wait 24 hours after DNS setup
5. ✅ Contact Netlify support if still failing

### Site Shows "Page Not Found"

**Problem:** Site loads but shows 404 error

**Solutions:**
1. ✅ Verify `index.html` exists in root directory
2. ✅ Check publish directory is set to `/` in Netlify
3. ✅ Check deployment logs for errors
4. ✅ Verify all files are committed to GitHub

### Build Errors

**Problem:** Deployment fails with build error

**Solutions:**
1. ✅ Check Netlify deploy logs for specific error
2. ✅ Verify no syntax errors in JavaScript files
3. ✅ Ensure all required files are committed
4. ✅ For static sites, build command should be EMPTY

### Can't Access Domain in Netlify

**Problem:** Can't add custom domain in Netlify

**Solutions:**
1. ✅ Verify you own the domain
2. ✅ Try adding without www first: `everse.co.in`
3. ✅ Check if domain is already added to another Netlify site
4. ✅ Contact Netlify support

---

## Quick Reference

### Netlify IP Address (A Record)
```
75.2.60.5
```

### Required DNS Records
```
A Record:
  Name: @
  Value: 75.2.60.5

CNAME Record:
  Name: www
  Value: [your-netlify-site].netlify.app
```

### Netlify URLs
- **Temporary:** `https://[site-name].netlify.app`
- **Custom Domain:** `https://everse.co.in`
- **WWW:** `https://www.everse.co.in` (if configured)

### Support Resources
- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify DNS Setup Guide](https://docs.netlify.com/domains-https/custom-domains/configure-external-dns/)
- [Netlify Support](https://www.netlify.com/support/)

---

## Success Checklist

- ✅ Netlify account created
- ✅ GitHub repository connected
- ✅ Site deployed successfully
- ✅ Custom domain added: `everse.co.in`
- ✅ DNS records configured (A + CNAME)
- ✅ DNS propagated (verified with dnschecker.org)
- ✅ SSL certificate provisioned
- ✅ Site accessible at `https://everse.co.in`
- ✅ All pages load correctly
- ✅ HTTPS working (lock icon visible)

---

## Need Help?

If you encounter issues:

1. **Check Netlify Deploy Logs:** Site dashboard → Deploys → Click deployment → View logs
2. **Check DNS Status:** [dnschecker.org](https://dnschecker.org/) for propagation
3. **Netlify Support:** [https://www.netlify.com/support/](https://www.netlify.com/support/)
4. **Domain Registrar Support:** Contact your domain registrar's support

---

**Last Updated:** 2025-01-25  
**Version:** 1.0

