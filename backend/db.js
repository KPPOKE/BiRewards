import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

// Create a function to get a new pool instance
const createPool = () => {
  // Debug: Log environment variables (without password)
  console.log('🔍 Database Config Debug:');
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
  
  return new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
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
