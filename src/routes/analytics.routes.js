const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const analyticsController = require('../controllers/analytics.controller');

router.use(authenticate);

// Approved vendors analytics
router.get('/vendors/approved', authorizeAdmin, analyticsController.getApprovedVendorsAnalytics);

// Summary analytics (KPIs across the system)
router.get('/summary', authorizeAdmin, analyticsController.getSummaryAnalytics);

module.exports = router;
