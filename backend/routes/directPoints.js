import express from 'express';
import pool from '../db.js';
import AppError from '../utils/AppError.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Simple direct endpoint for adding points
router.post('/add-points/:userId', authorize('admin', 'manager', 'cashier'), async (req, res, next) => {
  const { userId } = req.params;
  const { amount, description } = req.body;

  // Validate input
  if (!amount || isNaN(amount) || amount <= 0) {
    return next(new AppError('Invalid points amount. Must be a positive number.', 400));
  }

  // Convert amount to integer to ensure we're working with whole points
  const pointsToAdd = Math.floor(Number(amount));

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

    // Create transaction record
    const transactionResult = await client.query(
      `INSERT INTO transactions 
       (user_id, type, amount, description) 
       VALUES ($1, 'points_added', $2, $3) 
       RETURNING *`,
      [userId, pointsToAdd, description]
    );

    // Commit the transaction
    await client.query('COMMIT');

    // Return success response
    res.json({
      success: true,
      data: {
        transaction: transactionResult.rows[0],
        newPoints: userResult.rows[0].points
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
});

export default router;
