-- Migration: Add permanent tier tracking and reward tier requirements

-- 1. Add highest_points to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS highest_points INTEGER NOT NULL DEFAULT 0;

-- 2. Add minimum_required_tier to rewards table
ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS minimum_required_tier VARCHAR(20) DEFAULT 'Bronze';
