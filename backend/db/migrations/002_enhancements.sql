-- Add new columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255),
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by VARCHAR(50),
  ADD COLUMN IF NOT EXISTS loyalty_tier VARCHAR(20) DEFAULT 'Bronze',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add expiry to rewards
ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  description VARCHAR(255),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Create qr_claims table for QR code point claims
CREATE TABLE IF NOT EXISTS qr_claims (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  staff_id INTEGER REFERENCES users(id),
  points INTEGER NOT NULL,
  qr_token VARCHAR(255) NOT NULL,
  claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 