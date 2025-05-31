import pool from './db.js';
import bcrypt from 'bcrypt';

async function isHashed(password) {
  // bcrypt hashes start with $2a$, $2b$, or $2y$
  return password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
}

async function hashAllPlainPasswords() {
  try {
    const { rows: users } = await pool.query('SELECT id, password FROM users');
    let updated = 0;
    for (const user of users) {
      if (!(await isHashed(user.password))) {
        const hashed = await bcrypt.hash(user.password, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
        updated++;
        console.log(`Updated password for user id ${user.id}`);
      }
    }
    console.log(`Done. Updated ${updated} users.`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating passwords:', err);
    process.exit(1);
  }
}

hashAllPlainPasswords();
