// Script to add loyalty_tier column to users table
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addLoyaltyTierColumn() {
  const client = await pool.connect();
  try {
    console.log('Adding loyalty_tier column to users table...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS loyalty_tier VARCHAR(20) DEFAULT 'Bronze';
    `);
    console.log('Column added successfully!');
    
    // Update existing users' loyalty_tier based on their highest_points
    console.log('Updating loyalty tiers for existing users...');
    await client.query(`
      UPDATE users
      SET loyalty_tier = 
        CASE
          WHEN highest_points >= 1000 THEN 'Gold'
          WHEN highest_points >= 500 THEN 'Silver'
          ELSE 'Bronze'
        END;
    `);
    console.log('Loyalty tiers updated successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

addLoyaltyTierColumn();
