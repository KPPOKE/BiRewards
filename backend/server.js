import express from 'express';
import pool from './db.js'; // import koneksi db yang kamu buat
import cors from 'cors';
import userRoutes from './routes/users.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', userRoutes);

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Query user berdasarkan email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Validasi password (contoh sederhana, sesuaikan dengan cara hashing kamu)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Berhasil login, kirim data user (atau token)
    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
