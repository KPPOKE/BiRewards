-- Migration: Create redeem_requests table for tracking reward redemption requests

-- Create redeem_requests table
CREATE TABLE IF NOT EXISTS redeem_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reward_id INTEGER NOT NULL REFERENCES rewards(id),
  points_used INTEGER NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by INTEGER REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT,
  voucher_id INTEGER REFERENCES user_vouchers(id),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redeem_requests_user_id ON redeem_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_redeem_requests_reward_id ON redeem_requests(reward_id);
CREATE INDEX IF NOT EXISTS idx_redeem_requests_status ON redeem_requests(status);
