# Product Scraper from everse.in - Implementation Guide

## Overview

Added product scraping functionality from everse.in website to automatically fetch product names and details when adding products. This significantly speeds up product entry and ensures consistency.

## Features

✅ **Search Products on everse.in**
- Search by product name or keyword
- Returns multiple matching products
- Shows product name, description, and price

✅ **Auto-Fill Product Forms**
- Automatically fills product name
- Fills description
- Estimates cost from sale price (70% of sale price)
- Generates product ID

✅ **Integration Points**
- Products Management page: Search button and modal
- Stock Management: Quick search button for serial mapping
- Smart product detection before adding

## How It Works

### Architecture

1. **Direct Fetch**: Tries to fetch directly from everse.in
2. **CORS Proxy Fallback**: Uses free CORS proxy (allorigins.win) if direct fetch fails
3. **HTML Parsing**: Parses product listings from HTML
4. **Auto-Fill**: Populates form fields automatically

### Product Search Flow

```
User enters product name
    ↓
Search everse.in
    ↓
Parse HTML results
    ↓
Show matching products
    ↓
User selects product
    ↓
Auto-fill form fields
```

## Usage

### In Products Management

1. Click **"🔍 Search from everse.in"** button
2. Enter product name or keyword
3. Click **"Search"**
4. Select product from results
5. Form auto-fills with product details
6. Review and adjust if needed
7. Click **"Add Product"**

### In Stock Management (Serial Mapping)

1. Start typing product name in search field
2. Click **"🔍 everse.in"** button next to search field
3. Search results appear with "Use" button
4. Click **"Use"** to select product
5. If product not in inventory, system offers to add it automatically

### Quick Search

- In Products page: Click **🔍** icon next to product name field
- Automatically searches with current text
- Opens modal with results

## Implementation Details

### Files Created

- **`js/product-scraper.js`**: Core scraping logic
  - `searchProduct()`: Search products on everse.in
  - `getProductDetails()`: Get detailed product info
  - `parseProductResults()`: Parse HTML to extract products
  - `autoFillProductForm()`: Auto-fill form fields

### Files Modified

- **`products.html`**: Added search modal and integration
- **`stock.html`**: Added quick search button

## HTML Parsing

The scraper uses multiple selector strategies to find products:

```javascript
// Tries these selectors in order:
- .product-item
- .product-card
- .product
- [class*="product"]
- .item
- .product-list-item
```

Extracts:
- Product name (from `.product-name`, `h2`, `h3`, etc.)
- Price (from `.price`, `.product-price`)
- Description (from `.description`)
- Product URL
- Image URL

## CORS Handling

Due to browser CORS restrictions, we use:

1. **Direct Fetch** (if everse.in allows)
2. **CORS Proxy** (allorigins.win) as fallback
3. **Manual Entry** as final fallback

### Alternative: Backend Proxy (Recommended for Production)

For better reliability, create a backend endpoint:

```javascript
// Example: backend/api/scrape-product.js
app.get('/api/scrape-product', async (req, res) => {
  const searchTerm = req.query.q;
  const html = await fetch(`https://everse.in/search?q=${searchTerm}`);
  // Parse and return JSON
});
```

## Configuration

### Update Base URL

In `js/product-scraper.js`:

```javascript
BASE_URL: 'https://everse.in'  // Change if needed
```

### Change CORS Proxy

```javascript
CORS_PROXY: 'https://api.allorigins.win/get?url='  // Or use your own
```

## Benefits

1. ✅ **Faster Product Entry**: Auto-fills from website
2. ✅ **Consistency**: Uses official product names
3. ✅ **Price Estimation**: Auto-calculates cost from sale price
4. ✅ **Reduced Errors**: Less manual typing
5. ✅ **Integration**: Works with existing product management

## Limitations

1. ⚠️ **CORS Restrictions**: May need proxy for some browsers
2. ⚠️ **Website Changes**: HTML structure changes break parsing
3. ⚠️ **Rate Limiting**: Too many requests might be blocked
4. ⚠️ **Network Dependency**: Requires internet connection

## Recommendations

### For Production:

1. **Backend Proxy**: Create server-side scraper (avoids CORS)
2. **Caching**: Cache product data to reduce requests
3. **Rate Limiting**: Limit requests per minute
4. **Error Handling**: Graceful fallback to manual entry
5. **API Integration**: If everse.in has API, use that instead

### Alternative Approach:

If scraping is unreliable, consider:

1. **Export from everse.in**: Export product list to CSV
2. **Import Feature**: Bulk import products from CSV
3. **API Integration**: If everse.in provides product API
4. **Shared Database**: Sync products between systems

## Testing

Test the scraper:

1. Go to Products page
2. Click "Search from everse.in"
3. Search for known products (e.g., "AIR 3S", "NEO")
4. Verify results appear
5. Test auto-fill functionality

## Troubleshooting

### No Results Found

- Check if everse.in website structure changed
- Verify CORS proxy is working
- Try different search terms
- Check browser console for errors

### CORS Errors

- Use backend proxy instead
- Or rely on manual entry
- Check if everse.in has API

### Parsing Errors

- Update selectors in `parseProductResults()`
- Inspect everse.in HTML structure
- Adjust extraction logic

---

**Status**: ✅ Implemented and Ready
**Last Updated**: 2025-01-25

