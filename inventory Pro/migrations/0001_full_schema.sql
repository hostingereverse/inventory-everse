-- Everse Inventory Pro - Complete D1 Schema
-- Run: wrangler d1 migrations apply DB --local (for local) or --remote (for production)

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  supplier TEXT,
  warehouse TEXT NOT NULL DEFAULT 'Bangalore',
  stock INTEGER NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  sell_price REAL NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sales table (matches Google Sheets format)
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,
  date TEXT NOT NULL,
  delivery_location TEXT,
  product TEXT NOT NULL,
  status TEXT DEFAULT 'PROCESSING', -- Delivered, Processing, Cancelled, Shipped
  sp REAL, -- Selling Price (SP)
  cp REAL, -- Cost Price (CP)
  gst TEXT, -- GST (YES/NO or amount)
  sales_person TEXT,
  remarks TEXT,
  quantity INTEGER DEFAULT 1,
  customer_email TEXT,
  payment_status TEXT DEFAULT 'pending',
  delivery_days INTEGER,
  source TEXT DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Accounts/Suppliers table (for purchase orders and supplier data)
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_name TEXT,
  purchase_rate REAL,
  quantity INTEGER,
  payment_date TEXT,
  payment_method TEXT,
  invoice_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ad spends table
CREATE TABLE IF NOT EXISTS ad_spends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  campaign TEXT,
  platform TEXT,
  spend REAL NOT NULL DEFAULT 0,
  attributed_sales REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stock movements (audit log)
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'in', 'out', 'adjustment', 'transfer'
  quantity INTEGER NOT NULL,
  reason TEXT,
  warehouse TEXT,
  reference TEXT, -- Order ID, PO Number, etc.
  date TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT DEFAULT 'system',
  FOREIGN KEY (product_id) REFERENCES inventory(id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_order_id ON sales(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_ad_spends_date ON ad_spends(date);

-- Insert default categories
INSERT OR IGNORE INTO categories (name, description) VALUES
  ('Drones', 'Drone products'),
  ('Action Cameras', 'Action camera products'),
  ('Accessories', 'Product accessories'),
  ('Other', 'Other products');

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('warehouses', '["Bangalore", "Kolkata", "Chennai", "Mumbai"]'),
  ('currency', 'INR'),
  ('low_stock_threshold', '10'),
  ('theme', 'light');

