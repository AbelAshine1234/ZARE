const { 
  createCashOutRequestSchema, 
  userIdParamSchema, 
  requestIdParamSchema, 
  paginationQuerySchema, 
  rejectCashOutRequestSchema 
} = require('../schemas/cash_out_request.schema');

// Middleware to validate create cashout request
const validateCreateCashOutRequest = (req, res, next) => {
  const { error } = createCashOutRequestSchema.validate(req.body);
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

// Middleware to validate request ID parameter
const validateRequestId = (req, res, next) => {
  const { error } = requestIdParamSchema.validate(req.params);
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

// Middleware to validate reject cashout request
const validateRejectCashOutRequest = (req, res, next) => {
  const { error } = rejectCashOutRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

module.exports = {
  validateCreateCashOutRequest,
  validateUserId,
  validateRequestId,
  validatePagination,
  validateRejectCashOutRequest
}; 