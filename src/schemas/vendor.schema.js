const Joi = require('joi');

const vendorSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Vendor name is required.',
      'any.required': 'Vendor name is required.',
    }),

  user_id: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'User ID must be a number.',
      'any.required': 'User ID is required.',
    }),

  description: Joi.string()
    .allow(null, '')
    .optional(),

  category_ids: Joi.array()
    .items(
      Joi.number()
        .integer()
        .required()
        .messages({
          'number.base': 'Category IDs must be integers.',
          'number.integer': 'Category IDs must be integers.',
          'any.required': 'Each category ID is required.',
        })
    )
    .min(1)
    .max(3)
    .required()
    .messages({
      'array.base': 'Category IDs must be an array.',
      'array.min': 'At least one category is required.',
      'array.max': 'No more than 3 categories are allowed.',
      'any.required': 'Category IDs are required.',
    }),

  payment_method: Joi.object({
    name: Joi.string()
      .required()
      .messages({
        'string.empty': 'Payment method name is required.',
        'any.required': 'Payment method name is required.',
      }),
    account_number: Joi.string()
      .required()
      .messages({
        'string.empty': 'Account number is required.',
        'any.required': 'Account number is required.',
      }),
    account_holder: Joi.string()
      .required()
      .messages({
        'string.empty': 'Account holder name is required.',
        'any.required': 'Account holder name is required.',
      }),
    type: Joi.string()
      .allow(null, ''),
    details: Joi.object()
      .default({}),
  })
  .required(),

  subscription_id: Joi.number()
  .integer()
  .required()
  .messages({
    'number.base': 'Subscription ID must be a number.',
    'any.required': 'Subscription ID is required.',
  }),


  keepImages: Joi.string()
    .optional()
    .custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          return helpers.error('any.invalid');
        }
        return parsed; // Return parsed array instead of raw string
      } catch {
        return helpers.error('any.invalid');
      }
    })
    .messages({
      'any.invalid': 'keepImages must be a valid JSON array string',
    }),
});

module.exports = {
  vendorSchema,
};
