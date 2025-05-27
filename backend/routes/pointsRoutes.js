import express from 'express';
import { addPoints } from '../Controllers/transactionController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import { auditLog } from '../middleware/auditLog.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Add points (admin/manager/cashier only)
router.post('/points/:userId', 
  authorize('admin', 'manager', 'cashier'), 
  validate(schemas.transaction.addPoints), 
  auditLog('points_changed'), 
  addPoints
);

export default router;
