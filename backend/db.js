import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

// Create a function to get a new pool instance
const createPool = () => {
  return new Pool({
    user: process.env.db_user,
    password: process.env.db_password,
    port: Number(process.env.db_port),
    database: process.env.db_name,
    host: process.env.db_host || 'localhost',
    // Add connection timeout
    connectionTimeoutMillis: 5000,
    // Add idle timeout
    idleTimeoutMillis: 30000
  });
};

// Create the main pool instance
const pool = createPool();

// Coba koneksi saat inisialisasi
pool.connect()
  .then(() => {
    console.log('✅ Database connected successfully!');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err.message);
  });

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export { createPool };
export default pool;
