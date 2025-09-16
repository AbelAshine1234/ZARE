const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Name is required.',
      'any.required': 'Name is required.'
    }),

  phone_number: Joi.string()
    .pattern(/^\+2519\d{8}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required.',
      'any.required': 'Phone number is required.',
      'string.pattern.base': 'Phone number must be Ethiopian format: +2519XXXXXXXX.'
    }),

  picture: Joi.string()
    .uri()
    .required()
    .messages({
      'string.empty': 'Picture URL is required.',
      'string.uri': 'Picture must be a valid URL.',
      'any.required': 'Picture is required.'
    }),

  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Email must be a valid email address.'
    }),

  type: Joi.string()
    .valid('client', 'vendor', 'driver', 'employee')
    .optional()
    .messages({
      'any.only': 'Type must be one of CLIENT, VENDOR, DRIVER, or EMPLOYEE.'
    }),
});

module.exports = userSchema;
