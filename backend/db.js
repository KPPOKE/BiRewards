import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

// Konversi port ke number
const pool = new Pool({
  user: process.env.db_user,
  password: process.env.db_password,
  port: Number(process.env.db_port),
  database: process.env.db_name,
  host: process.env.db_host || 'localhost'
});

// Coba koneksi saat inisialisasi
pool.connect()
  .then(() => {
    console.log('✅ Database connected successfully!');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err.message);
  });

export default pool;
