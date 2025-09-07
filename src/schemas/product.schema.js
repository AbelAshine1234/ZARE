const Joi = require('joi');

const productSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Product name is required.',
      'string.max': 'Product name cannot exceed 255 characters.',
      'any.required': 'Product name is required.',
    }),

  description: Joi.string()
    .allow(null, '')
    .optional(),

  has_discount: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'has_discount must be a boolean.',
    }),

  stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Stock must be a number.',
      'number.integer': 'Stock must be an integer.',
      'number.min': 'Stock cannot be negative.',
      'any.required': 'Stock is required.',
    }),

  price: Joi.number()
    .precision(2)
    .min(0.01)
    .required()
    .messages({
      'number.base': 'Price must be a number.',
      'number.min': 'Price must be greater than 0.',
      'any.required': 'Price is required.',
    }),

  vendor_id: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Vendor ID must be a number.',
      'any.required': 'Vendor ID is required.',
    }),

  category_id: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Category ID must be a number.',
      'any.required': 'Category ID is required.',
    }),

  subcategory_id: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Subcategory ID must be a number.',
      'any.required': 'Subcategory ID is required.',
    }),

  low_stock_threshold: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(10)
    .messages({
      'number.base': 'Low stock threshold must be a number.',
      'number.integer': 'Low stock threshold must be an integer.',
      'number.min': 'Low stock threshold cannot be negative.',
    }),

  specs: Joi.array()
    .items(
      Joi.object({
        key: Joi.string()
          .trim()
          .min(1)
          .required()
          .messages({
            'string.empty': 'Spec key is required.',
            'any.required': 'Spec key is required.',
          }),
        value: Joi.string()
          .trim()
          .min(1)
          .required()
          .messages({
            'string.empty': 'Spec value is required.',
            'any.required': 'Spec value is required.',
          }),
      })
    )
    .optional()
    .default([])
    .messages({
      'array.base': 'Specs must be an array.',
    }),
});

module.exports = {
  productSchema,
}; 