const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const userController = require('../controllers/user.controller');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

// Apply authentication and admin authorization to all admin routes
router.use(authenticate);
router.use(authorizeAdmin);

// Dashboard routes
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/recent-orders', adminController.getRecentOrders);

// Users management routes
router.get('/users', adminController.getAllUsers);
router.post('/users/clients', userController.createClientAdmin);
router.post('/users/employees', userController.createEmployeeAdmin);
router.post('/users/vendor-owners', userController.createVendorOwnerAdmin);
router.post('/users/drivers', userController.createDriverAdmin);

// Vendors management routes
router.get('/vendors', adminController.getAllVendors);

// Products management routes
router.get('/products', adminController.getAllProducts);

// Orders management routes
router.get('/orders', adminController.getAllOrders);

// Drivers management routes
router.get('/drivers', adminController.getAllDrivers);

// Employees management routes
router.get('/employees', adminController.getAllEmployees);

// Cash out requests management routes
router.get('/cash-out-requests', adminController.getAllCashOutRequests);

// Transactions management routes
router.get('/transactions', adminController.getAllTransactions);

// Deliveries management routes
router.get('/deliveries', adminController.getAllDeliveries);

module.exports = router;
