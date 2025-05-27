-- Add purchase_amount column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS purchase_amount INTEGER;

-- Create index for purchase_amount
CREATE INDEX IF NOT EXISTS idx_transactions_purchase_amount ON transactions(purchase_amount);
