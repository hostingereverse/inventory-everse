# Product Scraper Testing Guide

## Test Setup

I've created a test page (`test-scraper.html`) to verify the scraper functionality.

### Starting the Test Server

1. Open terminal in project directory
2. Start a local server:
   ```bash
   python -m http.server 8000
   ```
   Or use any local server (Live Server extension, Node.js http-server, etc.)

3. Open browser to: `http://localhost:8000/test-scraper.html`

### Testing Steps

#### Test 1: Basic Scraper Functionality

1. Open `test-scraper.html`
2. Enter a product name (e.g., "AIR 3S", "NEO", "Drone")
3. Click "Test Search"
4. **Expected Results:**
   - Search logs appear in the log section
   - Results show found products or error message
   - Check browser console (F12) for any errors

#### Test 2: Integration in Products Page

1. Open `products.html` (via local server)
2. Click **"🔍 Search from everse.in"** button
3. Enter product name
4. Click "Search"
5. **Expected Results:**
   - Loading indicator appears
   - Products list appears if found
   - Click "Use This" to auto-fill form

#### Test 3: Quick Search Feature

1. Go to Products page
2. Type product name in "Name" field
3. Click **🔍** icon next to name field
4. **Expected Results:**
   - Modal opens with search term pre-filled
   - Auto-searches and shows results

#### Test 4: Stock Management Integration

1. Go to Stock Management page
2. In Serial Number Mapping section
3. Start typing product name
4. Click **"🔍 everse.in"** button
5. **Expected Results:**
   - Search results appear below
   - Can select product for mapping

## Common Issues & Solutions

### Issue 1: CORS Error

**Symptom:** Console shows CORS error

**Solution:**
- CORS proxy is already implemented as fallback
- If still failing, check if `allorigins.win` is accessible
- For production, consider backend proxy

### Issue 2: No Products Found

**Symptom:** "No products found" even though product exists

**Possible Causes:**
1. everse.in website structure changed
2. Search endpoint is different
3. Product selectors need updating

**Solution:**
1. Open everse.in in browser
2. Inspect product listing HTML
3. Update selectors in `js/product-scraper.js`
4. Check if search URL is correct

### Issue 3: Scraper Not Loading

**Symptom:** "ProductScraper is not defined" error

**Solution:**
1. Check if `js/product-scraper.js` is included in HTML
2. Check browser console for script errors
3. Verify file path is correct

### Issue 4: Modal Not Opening

**Symptom:** Clicking search button does nothing

**Solution:**
1. Check Bootstrap is loaded
2. Verify modal HTML exists in page
3. Check console for JavaScript errors

## Test Checklist

- [ ] Test page loads without errors
- [ ] ProductScraper object is available
- [ ] Search function executes
- [ ] Results are parsed correctly
- [ ] Modal opens in Products page
- [ ] Quick search works
- [ ] Auto-fill works after selection
- [ ] Stock management integration works
- [ ] Error handling works gracefully

## Manual Testing

### Test Search URLs

Try these direct URLs to verify everse.in structure:

1. **Homepage:** `https://everse.in`
2. **Search:** `https://everse.in/search?q=AIR`
3. **Products:** Check product listing page structure

### Verify Selectors

Open everse.in in browser DevTools and check:

```javascript
// In browser console on everse.in:
document.querySelector('.product-item')  // Check if exists
document.querySelector('.product-card')  // Check if exists
document.querySelectorAll('[class*="product"]')  // Find product containers
```

Update selectors in `js/product-scraper.js` if needed.

## Expected Behavior

### Successful Search

1. ✅ Shows "Searching everse.in..." message
2. ✅ Displays found products with name, description, price
3. ✅ Relevance scores are calculated
4. ✅ Products are sorted by relevance

### Auto-Fill

1. ✅ Product name filled
2. ✅ Description filled (if available)
3. ✅ Cost estimated from price (70%)
4. ✅ Product ID auto-generated

### Error Handling

1. ✅ Shows friendly error messages
2. ✅ Falls back gracefully
3. ✅ Allows manual entry as fallback

## Next Steps After Testing

If scraping doesn't work reliably:

1. **Option A:** Update HTML selectors based on actual everse.in structure
2. **Option B:** Use backend proxy for scraping
3. **Option C:** Export product list from everse.in as CSV
4. **Option D:** Use everse.in API if available

## Reporting Issues

When reporting issues, include:

- Browser and version
- Console errors
- Network tab (failed requests)
- Actual everse.in HTML structure
- Search term used

---

**Status:** Ready for Testing
**Last Updated:** 2025-01-25

