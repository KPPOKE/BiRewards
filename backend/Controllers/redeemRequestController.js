import pool from '../db.js';
import AppError from '../utils/AppError.js';

// Create a new redeem request
export const createRedeemRequest = async (req, res, next) => {
  const { reward_id } = req.body;
  const user_id = req.user.id;

  try {
    // Begin transaction
    await pool.query('BEGIN');

    // Get reward info
    const rewardResult = await pool.query(
      'SELECT * FROM rewards WHERE id = $1',
      [reward_id]
    );

    if (rewardResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return next(new AppError('Reward not found', 404));
    }

    const reward = rewardResult.rows[0];
    const points_cost = reward.points_cost;

    // Check if user has enough points
    const userResult = await pool.query(
      'SELECT points, role FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return next(new AppError('User not found', 404));
    }

    const user = userResult.rows[0];
    if (user.points < points_cost) {
      await pool.query('ROLLBACK');
      return next(new AppError('Not enough points to redeem this reward', 400));
    }

    // Deduct points from user
    await pool.query(
      'UPDATE users SET points = points - $1 WHERE id = $2',
      [points_cost, user_id]
    );

    // Create redemption request
    const requestResult = await pool.query(
      'INSERT INTO redeem_requests (user_id, reward_id, points_used, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, reward_id, points_cost, 'pending']
    );

    // Record transaction
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, reward_id, description) VALUES ($1, $2, $3, $4, $5)',
      [user_id, 'points_redeemed', -points_cost, reward_id, `Points reserved for reward: ${reward.title}`]
    );

    // Commit transaction
    await pool.query('COMMIT');

    res.status(201).json({
      success: true,
      data: requestResult.rows[0],
      message: 'Redemption request submitted successfully. Waiting for approval.'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(new AppError(`Error creating redeem request: ${error.message}`, 500));
  }
};

// Get all redeem requests (for managers)
export const getAllRedeemRequests = async (req, res, next) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let queryParams = [];
    let whereClause = '';
    
    // Build where clause based on filters
    if (status) {
      queryParams.push(status);
      whereClause += `WHERE r.status = $${queryParams.length}`;
    }
    
    if (startDate && endDate) {
      queryParams.push(startDate, endDate);
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `r.requested_at BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
    }
    
    // Add pagination params
    queryParams.push(limit, offset);

    // Get requests with user and reward info
    const result = await pool.query(
      `SELECT r.*, 
        u.name as user_name, 
        u.email as user_email,
        rw.title as reward_name,
        rw.points_cost
      FROM redeem_requests r
      JOIN users u ON r.user_id = u.id
      JOIN rewards rw ON r.reward_id = rw.id
      ${whereClause}
      ORDER BY r.requested_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    // Count total for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM redeem_requests r ${whereClause}`,
      status ? [status] : []
    );
    
    const totalRequests = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalRequests,
        totalPages: Math.ceil(totalRequests / limit)
      }
    });
  } catch (error) {
    next(new AppError('Error fetching redeem requests', 500));
  }
};

// Get user's redeem requests (for users)
export const getUserRedeemRequests = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get user's requests with reward info
    const result = await pool.query(
      `SELECT r.*, 
        rw.title as reward_name,
        rw.description as reward_description,
        rw.points_cost
      FROM redeem_requests r
      JOIN rewards rw ON r.reward_id = rw.id
      WHERE r.user_id = $1
      ORDER BY r.requested_at DESC
      LIMIT $2 OFFSET $3`,
      [user_id, limit, offset]
    );

    // Count total for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM redeem_requests WHERE user_id = $1',
      [user_id]
    );
    
    const totalRequests = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalRequests,
        totalPages: Math.ceil(totalRequests / limit)
      }
    });
  } catch (error) {
    next(new AppError('Error fetching your redeem requests', 500));
  }
};

// Process a redeem request (approve or reject)
export const processRedeemRequest = async (req, res, next) => {
  const { id } = req.params;
  const { action, notes } = req.body;
  const processed_by = req.user.id;

  if (!['approve', 'reject'].includes(action)) {
    return next(new AppError('Invalid action. Use "approve" or "reject"', 400));
  }

  try {
    // Begin transaction
    await pool.query('BEGIN');

    // Get request info
    const requestResult = await pool.query(
      'SELECT * FROM redeem_requests WHERE id = $1',
      [id]
    );

    if (requestResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return next(new AppError('Redeem request not found', 404));
    }

    const request = requestResult.rows[0];
    
    // Check if request is already processed
    if (request.status !== 'pending') {
      await pool.query('ROLLBACK');
      return next(new AppError(`This request has already been ${request.status}`, 400));
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    
    if (action === 'approve') {
      // Create voucher with correct fields based on db schema
      const voucherResult = await pool.query(
        `INSERT INTO user_vouchers (
          user_id, 
          reward_id,
          redeemed_at
        ) VALUES ($1, $2, NOW()) RETURNING *`,
        [
          request.user_id, 
          request.reward_id
        ]
      );
      
      const voucher = voucherResult.rows[0];
      
      // Update request with voucher_id and status
      await pool.query(
        'UPDATE redeem_requests SET status = $1, processed_at = NOW(), processed_by = $2, notes = $3, voucher_id = $4 WHERE id = $5',
        [status, processed_by, notes, voucher.id, id]
      );
      
      // Record transaction for approved redemption
      await pool.query(
        'INSERT INTO transactions (user_id, type, amount, reward_id, description) VALUES ($1, $2, $3, $4, $5)',
        [request.user_id, 'reward_redeemed', 0, request.reward_id, `Reward redemption approved: Request #${id}`]
      );
    } else {
      // Refund points
      await pool.query(
        'UPDATE users SET points = points + $1 WHERE id = $2',
        [request.points_used, request.user_id]
      );
      
      // Update request status
      await pool.query(
        'UPDATE redeem_requests SET status = $1, processed_at = NOW(), processed_by = $2, notes = $3 WHERE id = $4',
        [status, processed_by, notes, id]
      );
      
      // Record transaction for refunded points
      await pool.query(
        'INSERT INTO transactions (user_id, type, amount, reward_id, description) VALUES ($1, $2, $3, $4, $5)',
        [request.user_id, 'points_refunded', request.points_used, request.reward_id, `Points refunded: Redemption request rejected`]
      );
    }

    // Commit transaction
    await pool.query('COMMIT');

    res.json({
      success: true,
      message: `Request successfully ${action === 'approve' ? 'approved' : 'rejected'}`,
      status
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(new AppError(`Error processing request: ${error.message}`, 500));
  }
};

// Use a voucher (mark as used)
export const useVoucher = async (req, res, next) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    // Begin transaction
    await pool.query('BEGIN');

    // Check if request exists and is approved
    const requestResult = await pool.query(
      `SELECT r.*, v.id as voucher_id, v.status as voucher_status 
       FROM redeem_requests r
       JOIN user_vouchers v ON r.voucher_id = v.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [id, user_id]
    );

    if (requestResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return next(new AppError('Voucher not found or does not belong to you', 404));
    }

    const request = requestResult.rows[0];
    
    if (request.status !== 'approved') {
      await pool.query('ROLLBACK');
      return next(new AppError('This request has not been approved yet', 400));
    }
    
    if (request.voucher_status !== 'active') {
      await pool.query('ROLLBACK');
      return next(new AppError('This voucher has already been used or expired', 400));
    }

    // Mark voucher as used
    await pool.query(
      'UPDATE user_vouchers SET status = $1, used_at = NOW() WHERE id = $2',
      ['used', request.voucher_id]
    );

    // Commit transaction
    await pool.query('COMMIT');

    res.json({
      success: true,
      message: 'Voucher successfully used',
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(new AppError(`Error using voucher: ${error.message}`, 500));
  }
};
