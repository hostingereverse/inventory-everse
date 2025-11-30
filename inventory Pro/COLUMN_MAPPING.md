# Column Mapping Reference

## Google Sheets CSV Format → Database Schema

### Sales Data Columns

| Google Sheets Column | Database Field | Type | Description |
|---------------------|----------------|------|-------------|
| `Order id` | `order_id` | TEXT UNIQUE | Unique order identifier (E1005, E1006, etc.) |
| `Date` | `date` | TEXT | Order date (format: 11-01, converted to YYYY-MM-DD) |
| `DELIVERY LOCATION` | `delivery_location` | TEXT | City/location for delivery (BANGLORE, KOLKATA, etc.) |
| `Product` | `product` | TEXT | Product name (MINI 4 PRO COMBO+, AIR 3S COMBO, etc.) |
| `Status` | `status` | TEXT | Order status (Delivered, Processing, Cancelled, Shipped) |
| `SP` | `sp` | REAL | Selling Price (₹104000, ₹138000, etc.) |
| `CP` | `cp` | REAL | Cost Price (optional, may be empty) |
| `GST` | `gst` | TEXT | GST information (YES/NO or amount) |
| `SALES PERSON` | `sales_person` | TEXT | Name of sales person (optional) |
| `REMARKS` | `remarks` | TEXT | Additional notes/comments |

### Derived Fields

| Field | Source | Logic |
|-------|--------|-------|
| `payment_status` | `status` | Delivered → 'paid', Processing/Shipped → 'pending', Cancelled → 'cancelled' |
| `quantity` | Default | Always 1 (unless specified) |
| `source` | System | 'google_sheets_november', 'google_sheets_october', etc. |

## Adding New Columns

When new columns are added to Google Sheets:

1. **Add to migration** (`migrations/0003_update_sales_columns.sql` or create new):
   ```sql
   ALTER TABLE sales ADD COLUMN new_column_name TEXT;
   CREATE INDEX IF NOT EXISTS idx_sales_new_column ON sales(new_column_name);
   ```

2. **Update sync function** (`functions/api/sync-sheets.ts`):
   ```typescript
   // Add to INSERT statement
   new_column_name: row['New Column'] || row['new_column'] || null
   ```

3. **Update upload function** (`functions/api/upload.ts`):
   ```typescript
   // Same mapping in CSV/Excel upload handler
   new_column_name: row['New Column'] || null
   ```

4. **Update display pages** (e.g., `src/pages/sales.astro`):
   ```typescript
   // Add to headers and rows array
   'New Column',
   sale.new_column_name || '-'
   ```

5. **Run migration**:
   ```bash
   npm run db:migrate:remote
   ```

## Date Format Handling

The CSV uses format `11-01` (month-day). The system automatically converts to `2025-11-01` (YYYY-MM-DD) by:
1. Detecting if date lacks year
2. Assuming current year
3. Padding month and day with zeros

## Status Mapping

| CSV Status | Database Status | Payment Status |
|------------|----------------|----------------|
| `Delivered` | `DELIVERED` | `paid` |
| `Processing` | `PROCESSING` | `pending` |
| `Shipped` | `SHIPPED` | `pending` |
| `Cancelled` | `CANCELLED` | `cancelled` |

## Inventory Column Mapping

When inventory CSV is uploaded, columns map as:

| CSV Column | Database Field | Notes |
|------------|----------------|-------|
| `SKU` | `sku` | Required, unique identifier |
| `Name` or `Product` | `name` | Product name |
| `Category` | `category` | Product category |
| `Stock` or `Quantity` | `stock` | Current stock level |
| `Cost Price` or `CP` | `cost_price` | Purchase cost |
| `Sell Price` or `SP` | `sell_price` | Selling price |
| `Reorder Point` | `reorder_point` | Minimum stock before reorder |
| `Warehouse` | `warehouse` | Defaults to 'Bangalore' |

