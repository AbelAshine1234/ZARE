const Joi = require('joi');

const subcategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Subcategory name is required.',
      'any.required': 'Subcategory name is required.',
    }),

  category_id: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'category_id must be a number.',
      'any.required': 'category_id is required.',
    }),

  keepImages: Joi.string()
    .optional()
    .custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          throw new Error('keepImages must be an array');
        }
        return value; // valid JSON string
      } catch {
        return helpers.error('any.invalid');
      }
    })
    .messages({
      'any.invalid': 'keepImages must be a valid JSON array string',
    }),
});

module.exports = {
  subcategorySchema,
};
