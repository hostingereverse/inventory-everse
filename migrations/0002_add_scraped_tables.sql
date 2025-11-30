-- Additional tables for scraped prices, users, and activity log

-- Scraped prices from everse.in
CREATE TABLE IF NOT EXISTS scraped_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  url TEXT NOT NULL,
  scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(sku, url)
);

-- Users table (populated via Cloudflare Access)
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  name TEXT,
  role TEXT DEFAULT 'user',
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_email) REFERENCES users(email)
);

-- Update inventory table to include scraped_price and everse_url
ALTER TABLE inventory ADD COLUMN scraped_price REAL;
ALTER TABLE inventory ADD COLUMN scraped_at TEXT;
ALTER TABLE inventory ADD COLUMN everse_url TEXT;

-- Update sales table to include source
ALTER TABLE sales ADD COLUMN source TEXT DEFAULT 'manual';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraped_prices_sku ON scraped_prices(sku);
CREATE INDEX IF NOT EXISTS idx_scraped_prices_scraped_at ON scraped_prices(scraped_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_order_id ON sales(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_email ON sales(customer_email);

