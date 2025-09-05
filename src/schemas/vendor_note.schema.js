const Joi = require('joi');

const vendorNoteCreateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Title is required',
    'any.required': 'Title is required'
  }),
  description: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Description is required',
    'any.required': 'Description is required'
  })
});

module.exports = { vendorNoteCreateSchema };


