const Joi = require('joi');

const categorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Category name is required.',
      'any.required': 'Category name is required.',
    }),

  description: Joi.string()
    .allow(null, '')
    .optional(),

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
  categorySchema,
};
