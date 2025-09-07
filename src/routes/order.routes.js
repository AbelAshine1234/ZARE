const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
// router.use(authenticate);

// Get all orders (with optional filters)
router.get('/', orderController.getAllOrders);

// Get order by ID
router.get('/:order_id', orderController.getOrderById);

// Get orders by vendor
router.get('/vendor/:vendor_id', orderController.getOrdersByVendor);

// Update order status
router.patch('/:order_id/status', orderController.updateOrderStatus);

module.exports = router;