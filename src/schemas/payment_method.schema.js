const Joi = require('joi');

const vendorPaymentMethodCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  account_number: Joi.string().trim().min(1).required(),
  account_holder: Joi.string().trim().min(1).required(),
  type: Joi.string().trim().optional(),
  details: Joi.object().optional()
});

module.exports = { vendorPaymentMethodCreateSchema };


