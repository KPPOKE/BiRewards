import express from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  uploadProfileImage,
  getUserProfile,
  loginUser,
  getOwnerStats,
  getOwnerUsersStats,
  getOwnerMetrics,
  getUserByPhone
} from '../Controllers/userController.js'
import multer from 'multer';
import path from 'path';
import { validate, schemas } from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';
import { sensitiveLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Multer setup for profile images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const ext = file.originalname.toLowerCase().split('.').pop();
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(ext);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .jpg, .jpeg, .png files are allowed!'));
  }
});

// Protected routes
router.get('/users', protect, authorize('admin', 'manager'), getAllUsers);
router.get('/users/lookup', protect, authorize('cashier', 'waiter'), getUserByPhone);
router.post('/users', protect, authorize('admin'), validate(schemas.user.create), auditLog('user_created'), createUser);
router.put('/users/:id', protect, authorize('admin'), validate(schemas.user.update), auditLog('user_updated'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), auditLog('user_deleted'), deleteUser);

// Profile routes
router.get('/users/:id/profile', protect, getUserProfile);
router.post('/users/:id/profile-image', protect, upload.single('profile_image'), uploadProfileImage);
router.put('/users/:id/profile', protect, updateUser);

// Public routes (no authentication required)
router.post('/users/login', sensitiveLimiter, validate(schemas.user.login), loginUser);
router.post('/users/register', sensitiveLimiter, validate(schemas.user.create), createUser);

// Owner stats route (admin/owner/manager)
router.get('/owner/stats', protect, authorize('owner', 'admin', 'manager'), getOwnerStats);
router.get('/owner/users-stats', protect, authorize('owner', 'admin', 'manager'), getOwnerUsersStats);
router.get('/owner/metrics', protect, authorize('owner', 'admin', 'manager'), getOwnerMetrics);

export default router;