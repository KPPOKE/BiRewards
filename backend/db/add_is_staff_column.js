import pool from '../db.js';

// Add is_staff column to support_ticket_messages table
async function addIsStaffColumn() {
  try {
    console.log('Starting database migration: Adding is_staff column to support_ticket_messages table...');
    
    // Check if column already exists to avoid errors
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'support_ticket_messages' 
      AND column_name = 'is_staff'
    `);
    
    if (checkResult.rows.length === 0) {
      // Column doesn't exist, so add it
      await pool.query(`
        ALTER TABLE support_ticket_messages 
        ADD COLUMN is_staff BOOLEAN DEFAULT false
      `);
      console.log('✅ Successfully added is_staff column to support_ticket_messages table');
    } else {
      console.log('ℹ️ is_staff column already exists in support_ticket_messages table');
    }
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('❌ Error during database migration:', error);
  } finally {
    // Close the pool connection
    await pool.end();
  }
}

// Run the migration
addIsStaffColumn();
