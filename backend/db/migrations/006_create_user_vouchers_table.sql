-- Migration: Create user_vouchers table for tracking redeemed rewards

-- Create user_vouchers table
CREATE TABLE IF NOT EXISTS user_vouchers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reward_id INTEGER NOT NULL REFERENCES rewards(id),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_vouchers_user_id ON user_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_reward_id ON user_vouchers(reward_id);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_status ON user_vouchers(status);
