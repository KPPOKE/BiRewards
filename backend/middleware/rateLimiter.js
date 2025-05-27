import rateLimit from 'express-rate-limit';
import AppError from '../utils/AppError.js';

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res, next) => {
    next(new AppError('Too many requests from this IP, please try again after 15 minutes', 429));
  }
});

// Stricter limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again after an hour',
  handler: (req, res, next) => {
    next(new AppError('Too many login attempts, please try again after an hour', 429));
  }
});

// Points addition limiter
export const pointsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many points addition attempts, please try again after an hour',
  handler: (req, res, next) => {
    next(new AppError('Too many points addition attempts, please try again after an hour', 429));
  }
});

export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute'
}); 