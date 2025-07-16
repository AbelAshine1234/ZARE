const Joi = require('joi');

// Validation for creating cashout request
const createCashOutRequestSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required'
  }),
  reason: Joi.string().optional().max(255).messages({
    'string.max': 'Reason must be less than 255 characters'
  })
});

// Validation for user ID parameter
const userIdParamSchema = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    'number.base': 'User ID must be a number',
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be positive',
    'any.required': 'User ID is required'
  })
});

// Validation for request ID parameter
const requestIdParamSchema = Joi.object({
  requestId: Joi.number().integer().positive().required().messages({
    'number.base': 'Request ID must be a number',
    'number.integer': 'Request ID must be an integer',
    'number.positive': 'Request ID must be positive',
    'any.required': 'Request ID is required'
  })
});

// Validation for pagination query parameters
const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must be at most 100'
  }),
  status: Joi.string().valid('pending', 'approved', 'rejected').optional().messages({
    'string.valid': 'Status must be one of: pending, approved, rejected'
  })
});

// Validation for rejecting cashout request
const rejectCashOutRequestSchema = Joi.object({
  reason: Joi.string().optional().max(255).messages({
    'string.max': 'Reason must be less than 255 characters'
  })
});

module.exports = {
  createCashOutRequestSchema,
  userIdParamSchema,
  requestIdParamSchema,
  paginationQuerySchema,
  rejectCashOutRequestSchema
}; 