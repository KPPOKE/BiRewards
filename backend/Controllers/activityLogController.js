import pool from '../db.js';
import AppError from '../utils/AppError.js';

// Create activity log entry
export const createActivityLog = async ({ actor_id, actor_role, target_id, target_role, description, points_added }, client = pool) => {
  // client can be a pool or a transaction client
  const query = `INSERT INTO activity_logs (actor_id, actor_role, target_id, target_role, description, points_added) VALUES ($1, $2, $3, $4, $5, $6)`;
  const values = [actor_id, actor_role, target_id, target_role, description, points_added];
  try {
    await client.query(query, values);
  } catch (error) {
    console.error('Failed to create activity log:', error);
    throw new AppError('Failed to log activity', 500);
  }
};

// Get recent activity logs (for manager dashboard)
export const getRecentActivityLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await pool.query(
      `SELECT al.*, 
              ua.name AS actor_name, 
              ua.role AS actor_role, 
              ut.name AS target_name, 
              ut.role AS target_role
       FROM activity_logs al
       LEFT JOIN users ua ON al.actor_id = ua.id
       LEFT JOIN users ut ON al.target_id = ut.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ success: true, data: logs.rows });
  } catch (error) {
    next(new AppError('Failed to fetch activity logs', 500));
  }
};
