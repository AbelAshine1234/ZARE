const Joi = require('joi');

const subscriptionSchema = Joi.object({
  amount: Joi.number()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Amount must be a number.',
      'any.required': 'Amount is required.',
    }),

  plan: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Plan is required.',
      'any.required': 'Plan is required.',
    }),

  start_date: Joi.date()
    .required()
    .messages({
      'date.base': 'Start date must be a valid date.',
      'any.required': 'Start date is required.',
    }),

  end_date: Joi.date()
    .greater(Joi.ref('start_date'))
    .required()
    .messages({
      'date.base': 'End date must be a valid date.',
      'date.greater': 'End date must be after start date.',
      'any.required': 'End date is required.',
    }),

  status: Joi.string()
    .valid('active', 'inactive')
    .required()
    .messages({
      'any.only': 'Status must be either active or inactive.',
      'any.required': 'Status is required.',
    }),
});

module.exports = { subscriptionSchema };
