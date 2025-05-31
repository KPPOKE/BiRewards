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
  getUserByPhone,
  verifyOtp
} from '../Controllers/userController.js'
import multer from 'multer';
import path from 'path';
import { validate, schemas } from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';
// Rate limiter removed

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
router.get('/', protect, authorize('admin', 'manager'), getAllUsers);
router.get('/lookup', protect, authorize('cashier', 'waiter', 'admin', 'manager', 'owner'), getUserByPhone);
router.post('/', protect, authorize('admin'), validate(schemas.user.create), auditLog('user_created'), createUser);
router.put('/:id', protect, authorize('admin'), validate(schemas.user.update), auditLog('user_updated'), updateUser);
router.delete('/:id', protect, authorize('admin'), auditLog('user_deleted'), deleteUser);

// Profile routes
router.get('/:id/profile', protect, getUserProfile);
router.post('/:id/profile-image', protect, upload.single('profile_image'), uploadProfileImage);
router.put('/:id/profile', protect, updateUser);

// Public routes (no authentication required)
router.post('/login', validate(schemas.user.login), loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/register', validate(schemas.user.create), createUser);

// Owner stats route (admin/owner/manager)
router.get('/owner/stats', protect, authorize('owner', 'admin', 'manager', 'cashier', 'waiter'), getOwnerStats);
router.get('/owner/users-stats', protect, authorize('owner', 'admin', 'manager', 'cashier', 'waiter'), getOwnerUsersStats);
router.get('/owner/metrics', protect, authorize('owner', 'admin', 'manager', 'cashier', 'waiter'), getOwnerMetrics);

export default router;