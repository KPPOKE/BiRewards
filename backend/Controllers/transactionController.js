import pool from '../db.js';
import AppError from '../utils/AppError.js';
import { createActivityLog } from './activityLogController.js';

// Get user transactions with pagination
export const getUserTransactions = async (req, res, next) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT t.*, r.title as reward_title 
       FROM transactions t 
       LEFT JOIN rewards r ON t.reward_id = r.id 
       WHERE t.user_id = $1 
       ORDER BY t.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM transactions WHERE user_id = $1',
      [userId]
    );
    const totalTransactions = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        totalTransactions,
        totalPages: Math.ceil(totalTransactions / limit)
      }
    });
  } catch (error) {
    next(new AppError('Error fetching transactions', 500));
  }
};

// Add points to user
export const addPoints = async (req, res, next) => {
  const { userId } = req.params;
  const { amount, description, purchaseAmount } = req.body;

  // Validate input
  if (!amount || isNaN(amount) || amount <= 0) {
    return next(new AppError('Invalid points amount. Must be a positive number.', 400));
  }

  // Convert amount to integer to ensure we're working with whole points
  const pointsToAdd = Math.floor(Number(amount));
  
  // Extract purchase amount from description if not provided directly
  let actualPurchaseAmount = purchaseAmount;
  if (!actualPurchaseAmount && description) {
    const match = description.match(/Rp(\d+)/);
    if (match && match[1]) {
      actualPurchaseAmount = parseInt(match[1], 10);
    }
  }

  let client;
  try {
    // Get client from pool
    client = await pool.connect();
    
    // Start transaction
    await client.query('BEGIN');

    // Check if user exists first
    const userCheckResult = await client.query(
      'SELECT id, points FROM users WHERE id = $1',
      [userId]
    );

    if (userCheckResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('User not found', 404));
    }

    // Add points to user
    const userResult = await client.query(
      'UPDATE users SET points = points + $1 WHERE id = $2 RETURNING points',
      [pointsToAdd, userId]
    );

    // Try to create transaction record with purchase_amount if available
    let transactionResult;
    try {
      transactionResult = await client.query(
        `INSERT INTO transactions 
         (user_id, type, amount, description, purchase_amount) 
         VALUES ($1, 'points_added', $2, $3, $4) 
         RETURNING *`,
        [userId, pointsToAdd, description, actualPurchaseAmount || null]
      );
    } catch (insertError) {
      // If the insert fails due to missing column, fall back to the original schema
      console.error('Error inserting with purchase_amount, falling back:', insertError.message);
      transactionResult = await client.query(
        `INSERT INTO transactions 
         (user_id, type, amount, description) 
         VALUES ($1, 'points_added', $2, $3) 
         RETURNING *`,
        [userId, pointsToAdd, description]
      );
    }

    // Create activity log (do NOT block transaction commit on log error)
    try {
      console.log('[DEBUG] addPoints called by user:', req.user);
      console.log('[DEBUG] ActivityLog payload:', {
        actor_id: req.user.id,
        actor_role: req.user.role,
        target_id: userId,
        target_role: 'customer',
        description: description || `Added ${pointsToAdd} points`,
        points_added: pointsToAdd
      });
      await createActivityLog({
        actor_id: req.user.id,
        actor_role: req.user.role,
        target_id: userId,
        target_role: 'customer',
        description: description || `Added ${pointsToAdd} points`,
        points_added: pointsToAdd
      }, client);
    } catch (logErr) {
      console.error('Failed to log activity:', logErr);
      // Do not throw, just log
    }

    // Commit the transaction
    await client.query('COMMIT');

    // Return success response
    res.json({
      success: true,
      data: {
        transaction: transactionResult.rows[0],
        newPoints: userResult.rows[0].points,
        purchaseAmount: actualPurchaseAmount
      }
    });
  } catch (error) {
    console.error('Error in addPoints:', error);
    // Rollback transaction on error
    if (client) {
      await client.query('ROLLBACK').catch(err => {
        console.error('Error during rollback:', err);
      });
    }
    next(new AppError(`Error adding points: ${error.message}`, 500));
  } finally {
    // Release client back to pool
    if (client) {
      client.release();
    }
  }
};

// Redeem reward
export const redeemReward = async (req, res, next) => {
  const { userId } = req.params;
  const { rewardId } = req.body;

  try {
    // Start transaction
    await pool.query('BEGIN');

    // Get user and reward
    const [userResult, rewardResult] = await Promise.all([
      pool.query('SELECT points FROM users WHERE id = $1', [userId]),
      pool.query('SELECT * FROM rewards WHERE id = $1 AND is_active = true', [rewardId])
    ]);

    if (userResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return next(new AppError('User not found', 404));
    }

    if (rewardResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return next(new AppError('Reward not found or inactive', 404));
    }

    const user = userResult.rows[0];
    const reward = rewardResult.rows[0];

    // Check if user has enough points
    if (user.points < reward.points_cost) {
      await pool.query('ROLLBACK');
      return next(new AppError('Not enough points to redeem reward', 400));
    }

    // Deduct points and create transaction
    const [updateResult, transactionResult] = await Promise.all([
      pool.query(
        'UPDATE users SET points = points - $1 WHERE id = $2 RETURNING points',
        [reward.points_cost, userId]
      ),
      pool.query(
        `INSERT INTO transactions 
         (user_id, type, amount, reward_id, description) 
         VALUES ($1, 'reward_redeemed', $2, $3, $4) 
         RETURNING *`,
        [userId, -reward.points_cost, rewardId, `Redeemed ${reward.title}`]
      )
    ]);

    // Insert into user_vouchers
    const userVoucherResult = await pool.query(
      `INSERT INTO user_vouchers (user_id, reward_id, redeemed_at) VALUES ($1, $2, NOW()) RETURNING *`,
      [userId, rewardId]
    );

    await pool.query('COMMIT');

    res.json({
      success: true,
      data: {
        transaction: transactionResult.rows[0],
        newPoints: updateResult.rows[0].points,
        reward: reward,
        userVoucher: userVoucherResult.rows[0]
      }
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(new AppError('Error redeeming reward', 500));
  }
};

// Get transaction statistics
export const getTransactionStats = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN type = 'points_added' THEN amount ELSE 0 END) as total_points_earned,
        SUM(CASE WHEN type = 'reward_redeemed' THEN ABS(amount) ELSE 0 END) as total_points_spent,
        COUNT(CASE WHEN type = 'reward_redeemed' THEN 1 END) as total_rewards_redeemed
       FROM transactions 
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: stats.rows[0]
    });
  } catch (error) {
    next(new AppError('Error fetching transaction statistics', 500));
  }
};

// Get all transactions (admin/manager)
export const getAllTransactions = async (req, res, next) => {
  const { page = 1, limit = 10, user_id, transaction_type } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM transactions';
  const params = [];

  if (user_id) {
    query += ' WHERE user_id = $1';
    params.push(user_id);
  }

  if (transaction_type) {
    query += user_id ? ' AND' : ' WHERE';
    query += ' transaction_type = $' + (params.length + 1);
    params.push(transaction_type);
  }

  query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);

  try {
    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}; 