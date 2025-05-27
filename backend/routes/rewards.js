import express from 'express';
import {
  getAllRewards,
  createReward,
  updateReward,
  deleteReward,
  getRewardById,
  getAvailableRewards
} from '../Controllers/rewardController.js';
import { validate, schemas } from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all rewards
router.get('/rewards', protect, getAllRewards);

// Get reward by ID
router.get('/rewards/:id', protect, getRewardById);

// Create new reward
router.post('/rewards', protect, authorize('admin', 'manager'), validate(schemas.reward.create), createReward);

// Update reward
router.put('/rewards/:id', protect, authorize('admin', 'manager'), validate(schemas.reward.update), updateReward);

// Delete reward
router.delete('/rewards/:id', protect, authorize('admin', 'manager'), deleteReward);

// Get available rewards for user
router.get('/users/:userId/rewards', protect, getAvailableRewards);

export default router;
