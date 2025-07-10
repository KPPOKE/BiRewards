import Joi from 'joi';
import AppError from '../utils/AppError.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

// Validation schemas
export const schemas = {
  user: {
    create: Joi.object({
      name: Joi.string().required().min(2).max(255),
      email: Joi.string().required().email(),
      password: Joi.string().required().min(6),
      role: Joi.string().valid('user', 'admin', 'cashier', 'waiter', 'manager', 'owner')
    }),
    update: Joi.object({
      name: Joi.string().min(2).max(255),
      email: Joi.string().email(),
      role: Joi.string().valid('user', 'admin', 'cashier', 'waiter', 'manager', 'owner'),
      points: Joi.number().integer().min(0)
    }),
    login: Joi.object({
      email: Joi.string().required().email(),
      password: Joi.string().required().min(6)
    }),
    forgotPassword: Joi.object({
      email: Joi.string().required().email()
    }),
    resetPassword: Joi.object({
      email: Joi.string().required().email(),
      otp: Joi.string().required().length(6),
      newPassword: Joi.string().required().min(8)
    })
  },
  reward: {
    create: Joi.object({
      title: Joi.string().required().min(2).max(255),
      description: Joi.string().required(),
      points_cost: Joi.number().integer().required().min(1),
      is_active: Joi.boolean(),
      minimum_required_tier: Joi.string().valid('Bronze', 'Silver', 'Gold')
    }),
    update: Joi.object({
      title: Joi.string().min(2).max(255),
      description: Joi.string(),
      points_cost: Joi.number().integer().min(1),
      is_active: Joi.boolean(),
      minimum_required_tier: Joi.string().valid('Bronze', 'Silver', 'Gold')
    })
  },
  transaction: {
    addPoints: Joi.object({
      amount: Joi.number().integer().required().min(1),
      description: Joi.string().required()
    }),
    redeemReward: Joi.object({
      rewardId: Joi.number().integer().required().min(1)
    })
  },
  // New schema for redeem requests
  redeem: {
    create: Joi.object({
      reward_id: Joi.number().integer().required().min(1)
    }),
    process: Joi.object({
      action: Joi.string().required().valid('approve', 'reject'),
      notes: Joi.string().allow('', null)
    })
  }
}; 