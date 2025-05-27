-- Add customer categorization and enhance support ticket system

-- Add category field to support_tickets table if it doesn't exist
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER,
  ADD COLUMN IF NOT EXISTS satisfaction_feedback TEXT;

-- Create customer_tags table for tagging customers
CREATE TABLE IF NOT EXISTS customer_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20) DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_tags junction table
CREATE TABLE IF NOT EXISTS user_tags (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES customer_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, tag_id)
);

-- Create customer_notes table for staff to add notes about customers
CREATE TABLE IF NOT EXISTS customer_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_activity table for tracking all customer interactions
CREATE TABLE IF NOT EXISTS customer_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_customer_activity_user_id ON customer_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_type ON customer_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_customer_notes_user_id ON customer_notes(user_id);

-- Add trigger for customer_notes updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_customer_notes_updated_at') THEN
    CREATE TRIGGER update_customer_notes_updated_at
      BEFORE UPDATE ON customer_notes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;
