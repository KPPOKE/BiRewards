import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('backend/.env') });

console.log({
  user: process.env.db_user,
  password: process.env.db_password,
  host: process.env.db_host,
  port: process.env.db_port,
  database: process.env.db_name
});

const { Pool } = pg;
const pool = new Pool({
  user: process.env.db_user,
  password: process.env.db_password,
  host: process.env.db_host || 'localhost',
  port: Number(process.env.db_port),
  database: process.env.db_name
});

async function hashPasswords() {
  const res = await pool.query('SELECT id, password FROM users');
  for (const user of res.rows) {
    // Skip if already hashed (bcrypt hashes start with $2b$)
    if (!user.password.startsWith('$2b$')) {
      const hashed = await bcrypt.hash(user.password, 10);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
      console.log(`Updated user ${user.id}`);
    }
  }
  await pool.end();
  console.log('Done hashing passwords!');
}

hashPasswords().catch(err => {
  console.error('Error hashing passwords:', err);
  process.exit(1);
}); 