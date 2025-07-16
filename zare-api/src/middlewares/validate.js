const Joi = require('joi');

function rootValidation(req, res, next) {
  if (!req.body) {
    return res.status(400).json({ error: 'Request body cannot be empty' });
  }
  next();
}

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
}

function validateFileExists(fieldName) {
  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: `${fieldName} is required.` });
    }
    const hasFile = req.files.some(file => file.fieldname === fieldName);
    if (!hasFile) {
      return res.status(400).json({ error: `${fieldName} file is missing.` });
    }
    next();
  };
}

module.exports = {
  rootValidation,
  validateBody,
  validateFileExists
};
