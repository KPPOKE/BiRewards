import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { fixAllUserTiers } from '../utils/fixUserTiers.js';

const router = express.Router();

// Route to fix all user tiers (Admin only)
router.post('/fix-user-tiers', protect, authorize('Admin'), async (req, res) => {
  try {
    const result = await fixAllUserTiers();
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
