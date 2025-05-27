import express from 'express';
import {
  getUserTransactions,
  addPoints,
  redeemReward,
  getTransactionStats,
  getAllTransactions
} from '../Controllers/transactionController.js';
import { protect, authorize, canAccessOwnOrAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import { auditLog } from '../middleware/auditLog.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get user transactions
router.get('/users/:userId/transactions', canAccessOwnOrAdmin, getUserTransactions);

// Get transaction statistics
router.get('/users/:userId/transactions/stats', canAccessOwnOrAdmin, getTransactionStats);

// Get all transactions (admin/manager)
router.get('/all', authorize('admin', 'manager'), getAllTransactions);

// Add points (admin/manager/cashier only)
router.post('/users/:userId/points', authorize('admin', 'manager', 'cashier'), validate(schemas.transaction.addPoints), auditLog('points_changed'), addPoints);

// Redeem reward
router.post('/users/:userId/redeem', validate(schemas.transaction.redeemReward), auditLog('reward_redeemed'), redeemReward);

export default router; 