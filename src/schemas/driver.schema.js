const Joi = require('joi');

// Schema for driver registration
const driverRegistrationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required.',
      'string.min': 'Name must be at least 2 characters long.',
      'string.max': 'Name cannot exceed 100 characters.',
      'any.required': 'Name is required.',
    }),

  phone_number: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid international format.',
      'any.required': 'Phone number is required.',
    }),

  email: Joi.string()
    .email()
    .allow(null, '')
    .optional()
    .messages({
      'string.email': 'Email must be a valid email address.',
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Password is required.',
      'string.min': 'Password must be at least 6 characters long.',
      'any.required': 'Password is required.',
    }),

  vehicle_info: Joi.string()
    .trim()
    .min(5)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Vehicle ID/Number is required.',
      'string.min': 'Vehicle ID must be at least 5 characters long.',
      'string.max': 'Vehicle ID cannot exceed 50 characters.',
      'any.required': 'Vehicle ID/Number is required.',
    }),

  type: Joi.string()
    .valid('driver')
    .default('driver')
    .messages({
      'any.only': 'Type must be "driver".',
    }),
});

// Schema for admin driver creation
const adminDriverCreationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required.',
      'string.min': 'Name must be at least 2 characters long.',
      'string.max': 'Name cannot exceed 100 characters.',
      'any.required': 'Name is required.',
    }),

  phone_number: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid international format.',
      'any.required': 'Phone number is required.',
    }),

  email: Joi.string()
    .email()
    .allow(null, '')
    .optional()
    .messages({
      'string.email': 'Email must be a valid email address.',
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Password is required.',
      'string.min': 'Password must be at least 6 characters long.',
      'any.required': 'Password is required.',
    }),

  vehicle_info: Joi.string()
    .trim()
    .min(5)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Vehicle ID/Number is required.',
      'string.min': 'Vehicle ID must be at least 5 characters long.',
      'string.max': 'Vehicle ID cannot exceed 50 characters.',
      'any.required': 'Vehicle ID/Number is required.',
    }),

  current_status: Joi.string()
    .valid('available', 'on_delivery', 'offline')
    .default('offline')
    .optional()
    .messages({
      'any.only': 'Current status must be one of: available, on_delivery, offline.',
    }),
});

// Schema for driver profile update (driver only - no images)
const driverProfileUpdateSchema = Joi.object({
  vehicle_info: Joi.string()
    .trim()
    .min(5)
    .max(50)
    .allow(null, '')
    .optional()
    .messages({
      'string.min': 'Vehicle info must be at least 5 characters long.',
      'string.max': 'Vehicle info cannot exceed 50 characters.',
    }),

  current_status: Joi.string()
    .valid('available', 'on_delivery', 'offline')
    .optional()
    .messages({
      'any.only': 'Current status must be one of: available, on_delivery, offline.',
    }),
}).custom((value, helpers) => {
  // Check if at least one field is provided
  const hasVehicleInfo = value.vehicle_info && value.vehicle_info.trim() !== '';
  const hasCurrentStatus = value.current_status;
  
  if (!hasVehicleInfo && !hasCurrentStatus) {
    return helpers.error('any.invalid', { 
      message: 'At least one field (vehicle_info or current_status) must be provided for update.' 
    });
  }
  
  return value;
}).messages({
  'any.invalid': 'At least one field (vehicle_info or current_status) must be provided for update.',
});

// Schema for driver profile update with images (driver or admin)
const driverProfileWithImagesSchema = Joi.object({
  vehicle_info: Joi.string()
    .trim()
    .min(5)
    .max(50)
    .allow(null, '')
    .optional()
    .messages({
      'string.min': 'Vehicle info must be at least 5 characters long.',
      'string.max': 'Vehicle info cannot exceed 50 characters.',
    }),

  current_status: Joi.string()
    .valid('available', 'on_delivery', 'offline')
    .optional()
    .messages({
      'any.only': 'Current status must be one of: available, on_delivery, offline.',
    }),
});

// Schema for image-only updates (no vehicle_info or current_status)
const driverImageUpdateSchema = Joi.object({
  // No fields needed - only image files are expected
}).custom((value, helpers) => {
  // This schema is for image-only updates, no body validation needed
  return value;
});

// Schema for driver approval
const driverApprovalSchema = Joi.object({
  isApproved: Joi.string()
    .valid('true', 'false', '1', '0')
    .required()
    .messages({
      'any.only': 'isApproved must be one of: true, false, 1, or 0.',
      'any.required': 'isApproved field is required. Please provide the approval status.',
      'string.empty': 'isApproved field cannot be empty. Please provide true, false, 1, or 0.',
    }),
});

// Schema for driver ID validation
const driverIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Driver ID must be a number.',
      'number.integer': 'Driver ID must be an integer.',
      'number.positive': 'Driver ID must be positive.',
      'any.required': 'Driver ID is required.',
    }),
});

// Schema for pagination and filtering
const driverQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .messages({
      'number.base': 'Page must be a number.',
      'number.integer': 'Page must be an integer.',
      'number.min': 'Page must be at least 1.',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
    .messages({
      'number.base': 'Limit must be a number.',
      'number.integer': 'Limit must be an integer.',
      'number.min': 'Limit must be at least 1.',
      'number.max': 'Limit cannot exceed 100.',
    }),

  status: Joi.string()
    .valid('available', 'on_delivery', 'offline')
    .optional()
    .messages({
      'any.only': 'Status must be one of: available, on_delivery, offline.',
    }),

  approved: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Approved must be a boolean value.',
    }),

  search: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Search term must be at least 1 character long.',
      'string.max': 'Search term cannot exceed 50 characters.',
    }),
});

module.exports = {
  driverRegistrationSchema,
  adminDriverCreationSchema,
  driverProfileUpdateSchema,
  driverProfileWithImagesSchema,
  driverImageUpdateSchema,
  driverApprovalSchema,
  driverIdSchema,
  driverQuerySchema,
}; 