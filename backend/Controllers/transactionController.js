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

// Helper to determine tier based on highest_points
function determineLoyaltyTier(highestPoints) {
  if (highestPoints >= 1000) return 'Gold';
  if (highestPoints >= 500) return 'Silver';
  return 'Bronze';
}

// Helper to get tier ID from tier name
function getTierIdFromName(tierName) {
  switch (tierName) {
    case 'Gold': return 3;
    case 'Silver': return 2;
    case 'Bronze': return 1;
    default: return 1;
  }
}

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

    // Add points to user and fetch new points
    const userResult = await client.query(
      'UPDATE users SET points = points + $1 WHERE id = $2 RETURNING points',
      [pointsToAdd, userId]
    );

    // Fetch highest_points
    const highestPointsResult = await client.query(
      'SELECT highest_points, points FROM users WHERE id = $1',
      [userId]
    );
    let { highest_points, points } = highestPointsResult.rows[0];
    let updatedHighestPoints = highest_points || 0;
    
    // FIXED: Always update highest_points if points > updatedHighestPoints
    // highest_points should only ever increase, never decrease
    if (points > updatedHighestPoints) {
      updatedHighestPoints = points;
    }
    
    // FIXED: Calculate tier based on highest_points, not current points
    // This ensures tier is based on user's best achievement
    const correctTier = determineLoyaltyTier(updatedHighestPoints);
    const tierId = getTierIdFromName(correctTier);
    
    // Update highest_points, loyalty_tier, and tier_id
    await client.query(
      'UPDATE users SET highest_points = $1, loyalty_tier = $2, tier_id = $3, last_tier_update = NOW() WHERE id = $4',
      [updatedHighestPoints, correctTier, tierId, userId]
    );
    
    console.log('DEBUG: Updated user with correct tier:', { 
      userId, 
      points, 
      highest_points: updatedHighestPoints, 
      correctTier,
      tierId 
    });

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
  // Helper to determine tier based on highest_points (reuse if not global)
  function determineLoyaltyTier(highestPoints) {
    if (highestPoints >= 1000) return 'Gold';
    if (highestPoints >= 500) return 'Silver';
    return 'Bronze';
  }

  const { userId } = req.params;
  const { rewardId } = req.body;
  
  console.log('STEP 1: Redemption request received:', { userId, rewardId, user: req.user });
  
  // Validate inputs early
  if (!userId || !rewardId) {
    return next(new AppError('Missing required parameters: userId and rewardId are required', 400));
  }

  let client = null;
  let user = null;
  let reward = null;
  let updateResult = null;
  let transactionResult = null;
  let userVoucherResult = null;

  try {
    // Get client from pool for transaction
    console.log('STEP 2: Getting database connection');
    client = await pool.connect();
    
    // Start transaction
    console.log('STEP 3: Beginning transaction');
    await client.query('BEGIN');

    // Get user data - do this as a separate query
    console.log('STEP 4: Fetching user data');
    const userResult = await client.query(
      'SELECT id, points, highest_points, loyalty_tier FROM users WHERE id = $1', 
      [userId]
    );
    console.log('User result:', userResult.rows);
    
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('User not found', 404));
    }
    user = userResult.rows[0];
    
    // Get reward data - do this as a separate query
    console.log('STEP 5: Fetching reward data');
    const rewardResult = await client.query(
      'SELECT * FROM rewards WHERE id = $1 AND is_active = true', 
      [rewardId]
    );
    console.log('Reward result:', rewardResult.rows);

    if (rewardResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Reward not found or inactive', 404));
    }
    reward = rewardResult.rows[0];

    // Use the stored loyalty_tier from the database, or calculate it if it's null
    let userTier = user.loyalty_tier || determineLoyaltyTier(user.highest_points);
    console.log('User tier from database:', userTier);
    
    // Check if user meets minimum tier requirement
    if (reward.minimum_required_tier) {
      const tierOrder = { 'Bronze': 1, 'Silver': 2, 'Gold': 3 };
      console.log('Tier check:', { 
        userTier, 
        requiredTier: reward.minimum_required_tier, 
        userTierValue: tierOrder[userTier], 
        requiredTierValue: tierOrder[reward.minimum_required_tier] 
      });
      
      if (tierOrder[userTier] < tierOrder[reward.minimum_required_tier]) {
        await client.query('ROLLBACK');
        return next(new AppError(`This reward requires ${reward.minimum_required_tier} tier.`, 403));
      }
    }

    // Check if user has enough points
    console.log('Points check:', { userPoints: user.points, rewardCost: reward.points_cost });
    if (user.points < reward.points_cost) {
      await client.query('ROLLBACK');
      return next(new AppError('Not enough points to redeem reward', 400));
    }

    // Deduct points from user but maintain tier based on highest_points
    console.log('STEP 6: Deducting points from user');
    updateResult = await client.query(
      'UPDATE users SET points = points - $1 WHERE id = $2 RETURNING points, highest_points',
      [reward.points_cost, userId]
    );
    console.log('Update result:', updateResult.rows);
    
    // IMPORTANT: When redeeming, we maintain the tier based on highest_points
    // This ensures users don't lose tier status when spending points
    const updatedPoints = updateResult.rows[0];
    
    // NEVER recalculate tier based on current points - always use highest_points
    const currentTier = determineLoyaltyTier(updatedPoints.highest_points);
    const tierId = getTierIdFromName(currentTier);
    
    // Update both loyalty_tier and tier_id to ensure consistency
    await client.query(
      'UPDATE users SET loyalty_tier = $1, tier_id = $2, last_tier_update = NOW() WHERE id = $3',
      [currentTier, tierId, userId]
    );
    console.log('Maintained tier based on highest_points:', { currentTier, tierId, highest_points: updatedPoints.highest_points });
    
    // Create transaction record
    console.log('STEP 7: Creating transaction record');
    transactionResult = await client.query(
      `INSERT INTO transactions 
       (user_id, type, amount, reward_id, description) 
       VALUES ($1, 'reward_redeemed', $2, $3, $4) 
       RETURNING *`,
      [userId, -reward.points_cost, rewardId, `Redeemed ${reward.title}`]
    );
    console.log('Transaction result:', transactionResult.rows);

    // Insert into user_vouchers table
    console.log('STEP 8: Creating user voucher record');
    try {
      userVoucherResult = await client.query(
        'INSERT INTO user_vouchers (user_id, reward_id, redeemed_at) VALUES ($1, $2, NOW()) RETURNING *',
        [userId, rewardId]
      );
      console.log('User voucher result:', userVoucherResult.rows);
    } catch (voucherError) {
      // Log all relevant Postgres error fields
      console.error('STEP ERROR: Error inserting user voucher:', {
        message: voucherError.message,
        detail: voucherError.detail,
        code: voucherError.code,
        constraint: voucherError.constraint,
        table: voucherError.table,
        column: voucherError.column
      });
      console.error('Full error:', voucherError);
      await client.query('ROLLBACK');
      return next(new AppError(
        'Failed to create user voucher: ' +
        (voucherError.detail || voucherError.message) +
        (voucherError.code ? ` (code: ${voucherError.code})` : '') +
        (voucherError.constraint ? ` (constraint: ${voucherError.constraint})` : ''),
        500
      ));
    }

    // Commit the transaction
    console.log('STEP 9: Committing transaction');
    await client.query('COMMIT');
    
    // Send success response
    console.log('STEP 10: Transaction committed successfully');
    res.json({
      success: true,
      data: {
        transaction: transactionResult.rows[0],
        newPoints: updateResult.rows[0].points,
        reward: reward,
        userVoucher: userVoucherResult ? userVoucherResult.rows[0] : null
      }
    });
  } catch (error) {
    // Log all relevant Postgres error fields if present
    console.error('Error in redeemReward:', {
      message: error.message,
      detail: error.detail,
      code: error.code,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
      stack: error.stack
    });
    
    // Rollback transaction on error
    try {
      if (client) await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    
    // Send error response
    next(new AppError(`Error redeeming reward: ${error.detail || error.message}`, 500));
  } finally {
    // Always release the client back to the pool
    if (client) client.release();
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