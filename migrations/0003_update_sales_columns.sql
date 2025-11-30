-- Update sales table to match Google Sheets format
-- Adds new columns from actual CSV structure

-- Add new columns if they don't exist
ALTER TABLE sales ADD COLUMN delivery_location TEXT;
ALTER TABLE sales ADD COLUMN product TEXT;
ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'PROCESSING';
ALTER TABLE sales ADD COLUMN sp REAL; -- Selling Price
ALTER TABLE sales ADD COLUMN cp REAL; -- Cost Price
ALTER TABLE sales ADD COLUMN gst TEXT;
ALTER TABLE sales ADD COLUMN sales_person TEXT;
ALTER TABLE sales ADD COLUMN remarks TEXT;
ALTER TABLE sales ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));

-- Update existing records to use new format
-- Map old 'amount' to 'sp' (selling price)
UPDATE sales SET sp = amount WHERE sp IS NULL AND amount IS NOT NULL;

-- Update status based on payment_status
UPDATE sales SET status = 
  CASE 
    WHEN payment_status = 'paid' THEN 'DELIVERED'
    WHEN payment_status = 'cancelled' THEN 'CANCELLED'
    WHEN payment_status = 'pending' THEN 'PROCESSING'
    ELSE 'PROCESSING'
  END
WHERE status IS NULL;

-- Create index on new columns for better performance
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_delivery_location ON sales(delivery_location);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product);

