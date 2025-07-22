import express from 'express';
import { 
  createRedeemRequest, 
  getAllRedeemRequests, 
  getUserRedeemRequests, 
  processRedeemRequest,
  useVoucher
} from '../Controllers/redeemRequestController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import { auditLog } from '../middleware/auditLog.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Create redemption request (any authenticated user)
// router.post(
  '/redeem',
  validate(schemas.redeem.create),
  auditLog('redemption_requested'),
  createRedeemRequest
// );

// Get user's own redemption requests (user view)
// router.get(
  '/my-requests',
  getUserRedeemRequests
// );

// Get all redemption requests (manager view)
// router.get(
  '/all',
  authorize('admin', 'manager'),
  getAllRedeemRequests
// );

// Process (approve/reject) a redemption request
// router.put(
  '/:id/process',
  authorize('admin', 'manager'),
  validate(schemas.redeem.process),
  auditLog('redemption_processed'),
  processRedeemRequest
// );

// Use a voucher (mark as used)
// router.put(
  '/:id/use-voucher',
  useVoucher
// );

export default router;
