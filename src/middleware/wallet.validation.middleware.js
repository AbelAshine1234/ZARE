const { 
  addFundsSchema, 
  deductFundsSchema, 
  createWalletSchema, 
  userIdParamSchema, 
  paginationQuerySchema 
} = require('../validations/wallet.validation');

// Middleware to validate add funds request
const validateAddFunds = (req, res, next) => {
  const { error } = addFundsSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

// Middleware to validate deduct funds request
const validateDeductFunds = (req, res, next) => {
  const { error } = deductFundsSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

// Middleware to validate user ID parameter
const validateUserId = (req, res, next) => {
  const { error } = userIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

// Middleware to validate pagination query parameters
const validatePagination = (req, res, next) => {
  const { error } = paginationQuerySchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

// Middleware to validate create wallet request
const validateCreateWallet = (req, res, next) => {
  const { error } = createWalletSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

module.exports = {
  validateAddFunds,
  validateDeductFunds,
  validateUserId,
  validatePagination,
  validateCreateWallet
}; 