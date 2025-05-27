import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: process.env.db_user,
  password: process.env.db_password,
  port: Number(process.env.db_port),
  database: process.env.db_name,
  host: process.env.db_host || 'localhost'
});

async function tableExists(tableName) {
  const res = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    )`, [tableName]
  );
  return res.rows[0].exists;
}

async function runMigrations() {
  try {
    console.log('🚀 Starting database setup...');

    // Only run initial schema if users table does not exist
    if (!(await tableExists('users'))) {
      const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await pool.query(migrationSQL);
      console.log('✅ Database schema created successfully');
    } else {
      console.log('ℹ️  Initial schema already exists, skipping 001_initial_schema.sql');
    }

    // Always run new enhancements migration
    const enhancementPath = path.join(__dirname, 'migrations', '002_enhancements.sql');
    const enhancementSQL = fs.readFileSync(enhancementPath, 'utf8');
    await pool.query(enhancementSQL);
    console.log('✅ Enhancements migration applied');

    // Always run seeder
    const seederPath = path.join(__dirname, 'seeders', '001_initial_data.sql');
    const seederSQL = fs.readFileSync(seederPath, 'utf8');
    await pool.query(seederSQL);
    console.log('✅ Initial data seeded successfully');

    console.log('✨ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations(); 