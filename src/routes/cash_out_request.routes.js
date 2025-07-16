const express = require('express');
const router = express.Router();
const cashOutRequestController = require('../controllers/cash_out_request.controller');
const {
  validateCreateCashOutRequest,
  validateUserId,
  validateRequestId,
  validatePagination,
  validateRejectCashOutRequest
} = require('../middleware/cash_out_request.validation.middleware');

// Create cashout request (vendor only)
router.post('/:userId', validateUserId, validateCreateCashOutRequest, cashOutRequestController.createCashOutRequest);

// Get all cashout requests (admin only)
router.get('/', validatePagination, cashOutRequestController.getAllCashOutRequests);

// Get cashout requests by user ID
router.get('/user/:userId', validateUserId, validatePagination, cashOutRequestController.getCashOutRequestsByUserId);

// Get specific cashout request by ID
router.get('/:requestId', validateRequestId, cashOutRequestController.getCashOutRequestById);

// Approve cashout request (admin only)
router.patch('/:requestId/approve', validateRequestId, cashOutRequestController.approveCashOutRequest);

// Reject cashout request (admin only)
router.patch('/:requestId/reject', validateRequestId, validateRejectCashOutRequest, cashOutRequestController.rejectCashOutRequest);

module.exports = router;
