const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/authMiddleware');

// Optionally protect routes
// router.use(authenticate);

// List notifications for a user
router.get('/user/:userId', controller.getUserNotifications);

// Unread count badge
router.get('/user/:userId/unread-count', controller.getUserUnreadCount);

// Mark all as read for a user
router.post('/user/:userId/read-all', controller.readAllNotifications);

// Create a notification
router.post('/', controller.createUserNotification);

// Toggle read/unread
router.patch('/:id/read', controller.readNotification);
router.patch('/:id/unread', controller.unreadNotification);

// Delete
router.delete('/:id', controller.deleteUserNotification);

module.exports = router;
