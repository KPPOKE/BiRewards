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
  
  // Debug logging
  console.log('🔍 canAccessOwnOrAdmin Debug:');
  console.log('Requested userId:', userId);
  console.log('Current user:', currentUser ? {
    id: currentUser.id,
    role: currentUser.role,
    email: currentUser.email
  } : 'null');
  
  if (!currentUser) {
    console.log('❌ No current user - not authenticated');
    return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
  }
  
  const hasAccess = (
    currentUser.role === 'admin' ||
    currentUser.role === 'manager' ||
    String(currentUser.id) === String(userId)
  );
  
  console.log('Access check:', {
    isAdmin: currentUser.role === 'admin',
    isManager: currentUser.role === 'manager',
    isOwnData: String(currentUser.id) === String(userId),
    hasAccess
  });
  
  if (hasAccess) {
    console.log('✅ Access granted');
    return next();
  }
  
  console.log('❌ Access denied');
  return res.status(403).json({ success: false, error: { message: 'Forbidden: You can only access your own data.' } });
}; 