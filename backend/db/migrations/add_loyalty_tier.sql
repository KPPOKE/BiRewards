-- Add loyalty_tier column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS loyalty_tier VARCHAR(20) DEFAULT 'Bronze';
