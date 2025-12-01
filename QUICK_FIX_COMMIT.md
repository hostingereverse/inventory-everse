# ⚡ Quick Fix: Change Commit in Cloudflare Pages

## Problem
Cloudflare building from: `7285df3` (OLD)  
Need it to use: `0dfe4d1` (LATEST)

## 3-Step Fix

### 1️⃣ Fix Root Directory

**Cloudflare Dashboard** → **Pages** → **inventory-everse** → **Settings**

Find **"Builds & deployments"**:
- **Root directory**: Change to `/` (EMPTY - delete any value)
- **Save**

### 2️⃣ Clear Cache

Same page:
- Scroll down
- Click **"Clear build cache"**

### 3️⃣ Retry Deployment

**Deployments** tab:
- Click **"..."** on latest deployment
- Click **"Retry deployment"**

---

## Verify

Check build log - should show:
```
HEAD is now at 0dfe4d1...
```

✅ **Done!**

---

**Most Important**: Root directory = `/` (empty)

