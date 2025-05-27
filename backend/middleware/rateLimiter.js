import rateLimit from 'express-rate-limit';
import AppError from '../utils/AppError.js';

// EMERGENCY FIX: Completely bypass rate limiting in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Create a pass-through middleware for development
const developmentBypass = (req, res, next) => {
  console.log('Rate limiting bypassed in development mode');
  return next();
};

// General API limiter - completely disabled in development
export const apiLimiter = isDevelopment ? developmentBypass : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res, next) => {
    next(new AppError('Too many requests from this IP, please try again after 15 minutes', 429));
  }
});

// Stricter limiter for authentication routes - completely disabled in development
export const authLimiter = isDevelopment ? developmentBypass : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Too many login attempts, please try again after 1 hour',
  handler: (req, res, next) => {
    next(new AppError('Too many login attempts, please try again after 1 hour', 429));
  }
});

// Points addition limiter - completely disabled in development
export const pointsLimiter = isDevelopment ? developmentBypass : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many points addition attempts, please try again after 1 hour',
  handler: (req, res, next) => {
    next(new AppError('Too many points addition attempts, please try again after 1 hour', 429));
  }
});

// Sensitive operations limiter - completely disabled in development
export const sensitiveLimiter = isDevelopment ? developmentBypass : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many sensitive operations, please try again after a minute',
  handler: (req, res, next) => {
    next(new AppError('Too many sensitive operations, please try again after a minute', 429));
  }
}); 