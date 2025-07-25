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
      `SELECT 
        r.*, 
        r.image_url AS "imageUrl",
        (SELECT COUNT(*) FROM transactions t WHERE t.reward_id = r.id AND t.type = 'reward_redeemed') as redemptions
      FROM rewards r
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
  const { title, description, points_cost, is_active = true, minimum_required_tier = 'Bronze', imageUrl } = req.body;

  try {
    // Validate input
    if (!title || !description || !points_cost) {
      return next(new AppError('Title, description and points cost are required', 400));
    }

    // Create reward
    const result = await pool.query(
      'INSERT INTO rewards (title, description, points_cost, is_active, minimum_required_tier, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *, image_url AS "imageUrl"',
      [title, description, points_cost, is_active, minimum_required_tier, imageUrl]
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
  const { title, description, points_cost, is_active, minimum_required_tier, imageUrl } = req.body;

  try {
    // Check if reward exists
    const rewardExists = await pool.query('SELECT * FROM rewards WHERE id = $1', [id]);
    if (rewardExists.rows.length === 0) {
      return next(new AppError('Reward not found', 404));
    }

    // Update reward
    const result = await pool.query(
      'UPDATE rewards SET title = COALESCE($1, title), description = COALESCE($2, description), points_cost = COALESCE($3, points_cost), is_active = COALESCE($4, is_active), minimum_required_tier = COALESCE($5, minimum_required_tier), image_url = COALESCE($6, image_url) WHERE id = $7 RETURNING *, image_url AS "imageUrl"',
      [title, description, points_cost, is_active, minimum_required_tier, imageUrl, id]
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
    const result = await pool.query('SELECT *, image_url AS "imageUrl" FROM rewards WHERE id = $1', [id]);

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
    // Get user info (points and highest_points)
    const userResult = await pool.query('SELECT points, highest_points FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    // Helper to determine tier based on highest_points
    function determineLoyaltyTier(highestPoints) {
      if (highestPoints >= 1000) return 'Gold';
      if (highestPoints >= 500) return 'Silver';
      return 'Bronze';
    }

    const userPoints = userResult.rows[0].points;
    const userTier = determineLoyaltyTier(userResult.rows[0].highest_points || 0);
    const tierOrder = { 'Bronze': 1, 'Silver': 2, 'Gold': 3 };

    // Get rewards that user can afford and meets tier requirement
    const result = await pool.query(
      'SELECT *, image_url AS "imageUrl" FROM rewards WHERE points_cost <= $1 AND is_active = true',
      [userPoints]
    );

    // Filter rewards by tier requirement
    const availableRewards = result.rows.filter(reward => {
      if (!reward.minimum_required_tier) return true;
      return tierOrder[userTier] >= tierOrder[reward.minimum_required_tier];
    });

    res.json({
      success: true,
      data: availableRewards
    });
  } catch (error) {
    next(new AppError('Error fetching available rewards', 500));
  }
}; 