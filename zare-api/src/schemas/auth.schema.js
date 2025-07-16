const Joi = require('joi');

const clientRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required.',
    'string.min': 'Name must be at least 2 characters.',
    'string.max': 'Name must be at most 50 characters.',
    'any.required': 'Name is required.'
  }),

  phone_number: Joi.string().pattern(/^\+?[0-9]{9,15}$/).required().messages({
    'string.empty': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be a valid international format.',
    'any.required': 'Phone number is required.'
  }),

  password: Joi.string().min(6).max(64).required().messages({
    'string.empty': 'Password is required.',
    'string.min': 'Password must be at least 6 characters.',
    'string.max': 'Password must be at most 64 characters.',
    'any.required': 'Password is required.'
  }),

  email: Joi.string().email().optional().messages({
    'string.email': 'Email must be a valid email address.'
  }),

  type: Joi.string().valid('client').default('client').messages({
    'any.only': 'Type must be "client".'
  }),
 
});
const adminRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required.',
    'string.min': 'Name must be at least 2 characters.',
    'string.max': 'Name must be at most 50 characters.',
    'any.required': 'Name is required.'
  }),

  phone_number: Joi.string().pattern(/^\+?[0-9]{9,15}$/).required().messages({
    'string.empty': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be a valid international format.',
    'any.required': 'Phone number is required.'
  }),

  password: Joi.string().min(6).max(64).required().messages({
    'string.empty': 'Password is required.',
    'string.min': 'Password must be at least 6 characters.',
    'string.max': 'Password must be at most 64 characters.',
    'any.required': 'Password is required.'
  }),

  email: Joi.string().email().optional().messages({
    'string.email': 'Email must be a valid email address.'
  }),

  type: Joi.string().valid('admin').default('client').messages({
    'any.only': 'Type must be "client".'
  }),
 
});




const loginSchema = Joi.object({
  phone_number: Joi.string().pattern(/^\+?[0-9]{9,15}$/).required().messages({
    'string.empty': 'Phone number is required.',
    'any.required': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be a valid international format.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.',
    'string.min': 'Password must be at least 6 characters.'
  })
});

module.exports = { clientRegisterSchema, loginSchema ,adminRegisterSchema}; 