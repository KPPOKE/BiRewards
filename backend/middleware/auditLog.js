import pool from '../db.js';

export const auditLog = (action) => {
  return async (req, res, next) => {
    const userId = req.user?.id;
    const timestamp = new Date();
    const details = JSON.stringify(req.body);

    try {
      await pool.query(
        'INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, $4)',
        [userId, action, details, timestamp]
      );
    } catch (error) {
      console.error('Audit log error:', error);
    }
    next();
  };
}; 