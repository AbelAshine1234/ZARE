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
  
  // Optional: basic format guard to reduce obvious duplicates
  // You can relax or adjust this depending on product needs
  // Ensures name has at least one alphanumeric character
  // .pattern(/.*[A-Za-z0-9].*/, 'alphanumeric content')

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

  // payment_method: Joi.object({
  //   name: Joi.string()
  //     .required()
  //     .messages({
  //       'string.empty': 'Payment method name is required.',
  //       'any.required': 'Payment method name is required.',
  //     }),
  //   account_number: Joi.string()
  //     .required()
  //     .messages({
  //       'string.empty': 'Account number is required.',
  //       'any.required': 'Account number is required.',
  //     }),
  //   account_holder: Joi.string()
  //     .required()
  //     .messages({
  //       'string.empty': 'Account holder name is required.',
  //       'any.required': 'Account holder name is required.',
  //     }),
  //   type: Joi.string()
  //     .allow(null, ''),
  //   details: Joi.object()
  //     .default({}),
  // })
  // .required(),

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

// Additional schemas for vendor routes
const vendorStatusSchema = Joi.object({
  status: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.string().trim().valid('true','false','1','0','yes','no','on','off','TRUE','FALSE','YES','NO','ON','OFF','True','False','Yes','No','On','Off'),
      Joi.number().valid(1,0)
    )
    .custom((value, helpers) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value === 1;
      if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (['true','1','yes','on'].includes(v)) return true;
        if (['false','0','no','off'].includes(v)) return false;
      }
      return helpers.error('boolean.base');
    })
    .required()
    .messages({
      'any.required': 'status is required',
      'boolean.base': 'status must be a boolean'
    })
}).required().unknown(false);

const vendorApprovalSchema = Joi.object({
  vendor_id: Joi.number().integer().required().messages({
    'any.required': 'vendor_id is required',
    'number.base': 'vendor_id must be a number',
    'number.integer': 'vendor_id must be an integer'
  }),
  isApproved: Joi.boolean().required().messages({
    'any.required': 'isApproved is required',
    'boolean.base': 'isApproved must be a boolean'
  })
}).required().unknown(false);

const vendorDeleteSchema = Joi.object({
  vendor_id: Joi.number().integer().optional().messages({
    'number.base': 'vendor_id must be a number',
    'number.integer': 'vendor_id must be an integer'
  })
}).required().unknown(false);

module.exports.vendorStatusSchema = vendorStatusSchema;
module.exports.vendorApprovalSchema = vendorApprovalSchema;
module.exports.vendorDeleteSchema = vendorDeleteSchema;