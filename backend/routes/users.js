import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Ambil semua user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  const { name, email } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [name, email, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Tambah points ke user
router.post('/:id/points', async (req, res) => {
  const { points } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE users SET points = points + $1 WHERE id = $2 RETURNING *',
      [points, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add points' });
  }
});

export default router;
