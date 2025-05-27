-- Insert default roles
INSERT INTO users (name, email, password, role, points) VALUES
  ('Admin User', 'admin@birewards.com', 'admin123', 'admin', 0),
  ('Manager User', 'manager@birewards.com', 'manager123', 'manager', 0),
  ('Cashier User', 'cashier@birewards.com', 'cashier123', 'cashier', 0),
  ('Waiter User', 'waiter@birewards.com', 'waiter123', 'waiter', 0),
  ('Owner User', 'owner@birewards.com', 'owner123', 'owner', 0)
ON CONFLICT (email) DO NOTHING;

-- Insert sample rewards
INSERT INTO rewards (title, description, points_cost, is_active) VALUES
  ('Free Coffee', 'Get a free coffee of your choice', 100, true),
  ('Free Dessert', 'Enjoy a complimentary dessert', 200, true),
  ('Free Main Course', 'Get a free main course up to $20', 500, true),
  ('Free Meal for Two', 'Enjoy a complete meal for two people', 1000, true),
  ('VIP Membership', 'Get exclusive VIP benefits for a month', 2000, true)
ON CONFLICT DO NOTHING;

-- Insert sample transactions for testing
INSERT INTO transactions (user_id, type, amount, description) VALUES
  (1, 'points_added', 500, 'Initial points for admin'),
  (2, 'points_added', 300, 'Initial points for manager'),
  (3, 'points_added', 200, 'Initial points for cashier'),
  (4, 'points_added', 150, 'Initial points for waiter'),
  (5, 'points_added', 1000, 'Initial points for owner')
ON CONFLICT DO NOTHING; 