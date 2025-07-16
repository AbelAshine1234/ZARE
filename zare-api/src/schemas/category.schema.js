const Joi = require('joi');

const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Category name is required.',
    'any.required': 'Category name is required.',
  }),
  description: Joi.string().allow(null, '').optional(),
});

module.exports = {
  categorySchema,
};
