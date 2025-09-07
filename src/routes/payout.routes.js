const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payout.controller');
const { authenticate } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all payout routes
router.use(authenticate);

// Get vendor payout statistics
router.get('/vendor/:vendor_id/stats', payoutController.getVendorPayoutStats);

// Get vendor payout history
router.get('/vendor/:vendor_id/history', payoutController.getVendorPayoutHistory);

// Create payout request
router.post('/vendor/:vendor_id/request', payoutController.createPayoutRequest);

// Get payout request by ID
router.get('/:payout_id', payoutController.getPayoutRequestById);

// Update payout request status (admin only)
router.patch('/:payout_id/status', payoutController.updatePayoutRequestStatus);

module.exports = router;

