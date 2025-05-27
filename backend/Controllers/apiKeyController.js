import { pool } from '../db/index.js';
import crypto from 'crypto';

export const createApiKey = async (req, res, next) => {
  const { name, permissions } = req.body;
  const apiKey = crypto.randomBytes(32).toString('hex');

  try {
    const result = await pool.query(
      'INSERT INTO api_keys (name, key, permissions) VALUES ($1, $2, $3) RETURNING *',
      [name, apiKey, permissions]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const rotateApiKey = async (req, res, next) => {
  const { id } = req.params;
  const newApiKey = crypto.randomBytes(32).toString('hex');

  try {
    const result = await pool.query(
      'UPDATE api_keys SET key = $1 WHERE id = $2 RETURNING *',
      [newApiKey, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const setApiKeyPermissions = async (req, res, next) => {
  const { id } = req.params;
  const { permissions } = req.body;

  try {
    const result = await pool.query(
      'UPDATE api_keys SET permissions = $1 WHERE id = $2 RETURNING *',
      [permissions, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}; 