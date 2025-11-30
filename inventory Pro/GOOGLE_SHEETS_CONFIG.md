# Google Sheets Configuration

## 📊 Sales Data Sheets

The system syncs sales data from multiple tabs:

### November 2025
- **URL**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vTtQR1993HKYMuY4YNXHwcJ21KAAQYU1Xk8Xk0BkF6U18IAvGk-_Wl5XFEC_cNhJnHvgFPGSNmxg9vm/pub?gid=0&single=true&output=csv`
- **GID**: `0`
- **Auto-sync**: Every 3 hours

### October 2025
- **URL**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vTtQR1993HKYMuY4YNXHwcJ21KAAQYU1Xk8Xk0BkF6U18IAvGk-_Wl5XFEC_cNhJnHvgFPGSNmxg9vm/pub?gid=1834564973&single=true&output=csv`
- **GID**: `1834564973`
- **Auto-sync**: Every 3 hours

### September 2025
- **URL**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vTtQR1993HKYMuY4YNXHwcJ21KAAQYU1Xk8Xk0BkF6U18IAvGk-_Wl5XFEC_cNhJnHvgFPGSNmxg9vm/pub?gid=1396812475&single=true&output=csv`
- **GID**: `1396812475`
- **Auto-sync**: Every 3 hours

## 📦 Inventory Data

### Bangalore Inventory
- **URL**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vTqDFekc9mG22gGCvrt1xgBXNLqOMBJim35x3lKQ6bkVS-tsV4pZ8ZegxVnkYwgyxtUbtuhdubxFdLm/pub?gid=450436603&single=true&output=csv`
- **GID**: `450436603`
- **Warehouse**: Bangalore
- **Auto-sync**: Every 3 hours

## 📋 CSV Column Mapping

### Sales Data Format
The sales CSV contains these columns (case-insensitive mapping):

| CSV Column | Database Field | Description |
|------------|----------------|-------------|
| `Order id` | `order_id` | Unique order identifier |
| `Date` | `date` | Order date (format: MM-DD or YYYY-MM-DD) |
| `DELIVERY LOCATION` | `delivery_location` | City/location for delivery |
| `Product` | `product` | Product name |
| `Status` | `status` | Delivered, Processing, Cancelled, Shipped |
| `SP` | `sp` | Selling Price |
| `CP` | `cp` | Cost Price (optional) |
| `GST` | `gst` | GST information |
| `SALES PERSON` | `sales_person` | Sales person name |
| `REMARKS` | `remarks` | Additional notes |

### Status Mapping
- `Delivered` → Payment Status: `paid`
- `Processing` → Payment Status: `pending`
- `Shipped` → Payment Status: `pending`
- `Cancelled` → Payment Status: `cancelled`

## 🔄 Adding New Columns

If new columns are added to the Google Sheets:

1. **Add column to database schema** in `migrations/0001_full_schema.sql`:
   ```sql
   ALTER TABLE sales ADD COLUMN new_column_name TEXT;
   ```

2. **Update sync function** in `functions/api/sync-sheets.ts`:
   ```typescript
   // Add to INSERT statement
   new_column_name: row['New Column'] || null
   ```

3. **Run migration**:
   ```bash
   npm run db:migrate:remote
   ```

4. **Update upload parser** in `functions/api/upload.ts` to handle new column

## ⚙️ Environment Variables

All URLs are configured in `wrangler.toml` and will be automatically set when deploying:

```toml
GOOGLE_SHEET_SALES_NOV_URL = "..."
GOOGLE_SHEET_SALES_OCT_URL = "..."
GOOGLE_SHEET_SALES_SEP_URL = "..."
GOOGLE_SHEET_INVENTORY_BANGALORE_URL = "..."
```

You can also override these in Cloudflare Pages Dashboard → Settings → Environment Variables if needed.

## 🧪 Testing Sync

To manually trigger sync:
```bash
curl https://your-site.pages.dev/api/sync-sheets
```

Or check cron logs in Cloudflare Dashboard → Workers & Pages → Logs.

