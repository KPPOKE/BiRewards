import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getRecentActivityLogs } from '../Controllers/activityLogController.js';

const router = express.Router();

// Debug log for every request to this router
router.use((req, res, next) => {
  console.log('[DEBUG] activityLogRoutes loaded and received request:', req.method, req.url);
  next();
});

router.use(protect);
router.get('/activity-logs', authorize('admin', 'manager'), getRecentActivityLogs);

export default router;
