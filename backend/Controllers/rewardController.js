import pool from '../db.js';
import AppError from '../utils/AppError.js';

// Get all rewards with pagination
export const getAllRewards = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get rewards with redemptions count and created_at
    const result = await pool.query(
      `SELECT r.*, 
        COALESCE(COUNT(t.id), 0) as redemptions
      FROM rewards r
      LEFT JOIN transactions t ON t.reward_id = r.id AND t.type = 'reward_redeemed'
      GROUP BY r.id
      ORDER BY r.points_cost ASC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM rewards');
    const totalRewards = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        totalRewards,
        totalPages: Math.ceil(totalRewards / limit)
      }
    });
  } catch (error) {
    next(new AppError('Error fetching rewards', 500));
  }
};

// Create new reward
export const createReward = async (req, res, next) => {
  const { title, description, points_cost, is_active = true } = req.body;

  try {
    // Validate input
    if (!title || !description || !points_cost) {
      return next(new AppError('Title, description and points cost are required', 400));
    }

    // Create reward
    const result = await pool.query(
      'INSERT INTO rewards (title, description, points_cost, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, points_cost, is_active]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(new AppError('Error creating reward', 500));
  }
};

// Update reward
export const updateReward = async (req, res, next) => {
  const { id } = req.params;
  const { title, description, points_cost, is_active } = req.body;

  try {
    // Check if reward exists
    const rewardExists = await pool.query('SELECT * FROM rewards WHERE id = $1', [id]);
    if (rewardExists.rows.length === 0) {
      return next(new AppError('Reward not found', 404));
    }

    // Update reward
    const result = await pool.query(
      'UPDATE rewards SET title = COALESCE($1, title), description = COALESCE($2, description), points_cost = COALESCE($3, points_cost), is_active = COALESCE($4, is_active) WHERE id = $5 RETURNING *',
      [title, description, points_cost, is_active, id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(new AppError('Error updating reward', 500));
  }
};

// Delete reward
export const deleteReward = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check if reward exists
    const rewardExists = await pool.query('SELECT * FROM rewards WHERE id = $1', [id]);
    if (rewardExists.rows.length === 0) {
      return next(new AppError('Reward not found', 404));
    }

    await pool.query('DELETE FROM rewards WHERE id = $1', [id]);
    
    res.status(204).send();
  } catch (error) {
    next(new AppError('Error deleting reward', 500));
  }
};

// Get reward by ID
export const getRewardById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM rewards WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return next(new AppError('Reward not found', 404));
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(new AppError('Error fetching reward', 500));
  }
};

// Get available rewards for user
export const getAvailableRewards = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Get user points
    const userResult = await pool.query('SELECT points FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    const userPoints = userResult.rows[0].points;

    // Get rewards that user can afford
    const result = await pool.query(
      'SELECT * FROM rewards WHERE points_cost <= $1 AND is_active = true ORDER BY points_cost ASC',
      [userPoints]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(new AppError('Error fetching available rewards', 500));
  }
}; 