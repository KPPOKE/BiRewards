import pool from './db.js';

async function setAllUsersVerified() {
  try {
    const result = await pool.query('UPDATE users SET is_verified = TRUE');
    console.log('All users set to verified:', result.rowCount);
    process.exit(0);
  } catch (err) {
    console.error('Error updating users:', err);
    process.exit(1);
  }
}

setAllUsersVerified();
