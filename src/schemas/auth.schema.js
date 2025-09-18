const Joi = require('joi');

const clientRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required.',
    'string.min': 'Name must be at least 2 characters.',
    'string.max': 'Name must be at most 50 characters.',
    'any.required': 'Name is required.'
  }),

  phone_number: Joi.string().pattern(/^\+2519\d{8}$/).required().messages({
    'string.empty': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be Ethiopian format: +2519XXXXXXXX.',
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

  phone_number: Joi.string().pattern(/^\+2519\d{8}$/).required().messages({
    'string.empty': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be Ethiopian format: +2519XXXXXXXX.',
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
  phone_number: Joi.string().pattern(/^\+2519\d{8}$/).required().messages({
    'string.empty': 'Phone number is required.',
    'any.required': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be Ethiopian format: +2519XXXXXXXX.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.',
    'string.min': 'Password must be at least 6 characters.'
  })
});

const verifyOtpSchema = Joi.object({
  phone_number: Joi.string().pattern(/^\+2519\d{8}$/).required().messages({
    'string.empty': 'Phone number is required.',
    'any.required': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be Ethiopian format: +2519XXXXXXXX.'
  }),
  code: Joi.string().trim().pattern(/^[0-9]{4,8}$/).required().messages({
    'string.empty': 'OTP code is required.',
    'any.required': 'OTP code is required.',
    'string.pattern.base': 'OTP code must be 4-8 digits.'
  })
});

// Resend OTP schema
const resendOtpSchema = Joi.object({
  phone_number: Joi.string().pattern(/^\+2519\d{8}$/).required().messages({
    'string.empty': 'Phone number is required.',
    'any.required': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be Ethiopian format: +2519XXXXXXXX.'
  }),
  channel: Joi.string().valid('sms', 'whatsapp').default('sms')
});

// Forgot Password schemas
const forgotPasswordSchema = Joi.object({
  phone_number: Joi.string().pattern(/^\+2519\d{8}$/).required().messages({
    'string.empty': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be Ethiopian format: +2519XXXXXXXX.',
    'any.required': 'Phone number is required.'
  })
});

const verifyResetOtpSchema = Joi.object({
  phone_number: Joi.string().pattern(/^\+2519\d{8}$/).required().messages({
    'string.empty': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be Ethiopian format: +2519XXXXXXXX.',
    'any.required': 'Phone number is required.'
  }),
  code: Joi.string().trim().pattern(/^[0-9]{4,8}$/).required().messages({
    'string.empty': 'OTP code is required.',
    'any.required': 'OTP code is required.',
    'string.pattern.base': 'OTP code must be 4-8 digits.'
  })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required.',
    'any.required': 'Reset token is required.'
  }),
  new_password: Joi.string().min(6).max(64).required().messages({
    'string.empty': 'New password is required.',
    'string.min': 'New password must be at least 6 characters.',
    'string.max': 'New password must be at most 64 characters.',
    'any.required': 'New password is required.'
  })
});

const driverRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required.',
    'string.min': 'Name must be at least 2 characters.',
    'string.max': 'Name must be at most 50 characters.',
    'any.required': 'Name is required.'
  }),
  vehicle_info: Joi.string().trim().optional().messages({
    'string.base': 'Vehicle info must be a string.'
  }),
  current_status: Joi.string().valid('AVAILABLE', 'BUSY', 'OFFLINE').required().messages({
    'any.only': 'Current status must be one of AVAILABLE, BUSY, or OFFLINE.',
    'any.required': 'Current status is required.'
  }),
  license_image_id: Joi.number().integer().positive().optional().messages({
    'number.base': 'License image ID must be a number.',
    'number.integer': 'License image ID must be an integer.',
    'number.positive': 'License image ID must be a positive number.'
  }),
  fayda_image_id: Joi.number().integer().positive().optional().messages({
    'number.base': 'Fayda image ID must be a number.',
    'number.integer': 'Fayda image ID must be an integer.',
    'number.positive': 'Fayda image ID must be a positive number.'
  }),
  user_id: Joi.number().integer().positive().required().messages({
    'number.base': 'User ID must be a number.',
    'number.integer': 'User ID must be an integer.',
    'number.positive': 'User ID must be a positive number.',
    'any.required': 'User ID is required.'
  }),
  wallet_id: Joi.number().integer().positive().optional().messages({
    'number.base': 'Wallet ID must be a number.',
    'number.integer': 'Wallet ID must be an integer.',
    'number.positive': 'Wallet ID must be a positive number.'
  })
});

 
module.exports = { 
  clientRegisterSchema, 
  loginSchema,
  adminRegisterSchema, 
  verifyOtpSchema, 
  resendOtpSchema,
  driverRegisterSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema
};