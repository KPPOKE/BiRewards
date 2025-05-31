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

// New routes for owner dashboard data
router.get('/owner/user_growth', protect, authorize('owner', 'admin', 'manager'), (req, res) => {
  const { granularity = 'month' } = req.query;
  
  // Temporary mock data for user growth trends
  const mockData = [];
  const today = new Date();
  
  // Generate mock data based on granularity
  if (granularity === 'month') {
    for (let i = 0; i < 12; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      mockData.unshift({
        label: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total_users: Math.floor(500 - i * 25 + Math.random() * 50),
        new_users: Math.floor(40 - i * 2 + Math.random() * 15)
      });
    }
  } else if (granularity === 'year') {
    for (let i = 0; i < 5; i++) {
      const year = today.getFullYear() - i;
      mockData.unshift({
        label: year.toString(),
        total_users: Math.floor(500 - i * 75 + Math.random() * 100),
        new_users: Math.floor(150 - i * 20 + Math.random() * 40)
      });
    }
  } else { // day
    for (let i = 0; i < 14; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      mockData.unshift({
        label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total_users: Math.floor(500 - i * 3 + Math.random() * 20),
        new_users: Math.floor(10 - i * 0.5 + Math.random() * 8)
      });
    }
  }
  
  return res.status(200).json({
    success: true,
    data: mockData
  });
});

router.get('/owner/points_stats', protect, authorize('owner', 'admin', 'manager'), (req, res) => {
  const { granularity = 'month' } = req.query;
  
  // Temporary mock data for points transaction overview
  const mockData = [];
  const today = new Date();
  
  // Generate mock data based on granularity
  if (granularity === 'month') {
    for (let i = 0; i < 12; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      mockData.unshift({
        label: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        points_issued: Math.floor(2000 - i * 100 + Math.random() * 400),
        points_redeemed: Math.floor(1500 - i * 80 + Math.random() * 300)
      });
    }
  } else if (granularity === 'year') {
    for (let i = 0; i < 5; i++) {
      const year = today.getFullYear() - i;
      mockData.unshift({
        label: year.toString(),
        points_issued: Math.floor(10000 - i * 1000 + Math.random() * 2000),
        points_redeemed: Math.floor(8000 - i * 800 + Math.random() * 1500)
      });
    }
  } else { // day
    for (let i = 0; i < 14; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      mockData.unshift({
        label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        points_issued: Math.floor(200 - i * 5 + Math.random() * 50),
        points_redeemed: Math.floor(150 - i * 4 + Math.random() * 40)
      });
    }
  }
  
  return res.status(200).json({
    success: true,
    data: mockData
  });
});

export default router;