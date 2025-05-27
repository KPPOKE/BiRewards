import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';

export const protect = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Not authorized to access this route', 401));
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized to access this route', 403));
    }
    next();
  };
};

export const canAccessOwnOrAdmin = (req, res, next) => {
  const userId = req.params.userId;
  const currentUser = req.user;
  if (!currentUser) {
    return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
  }
  if (
    currentUser.role === 'admin' ||
    currentUser.role === 'manager' ||
    String(currentUser.id) === String(userId)
  ) {
    return next();
  }
  return res.status(403).json({ success: false, error: { message: 'Forbidden: You can only access your own data.' } });
}; 