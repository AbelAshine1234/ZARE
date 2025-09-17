const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { rootValidation, validateBody } = require('../middlewares/validate');
const userSchema = require('../schemas/user.schema');

// Import the middleware functions
const { authenticate } = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Apply authentication middleware to all routes
// router.use(authenticate);
// router.use(adminMiddleware)

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);

// Admin: add payment method to any user
router.post('/:id/payment-methods', authenticate, adminMiddleware, userController.addUserPaymentMethod);
// Admin: update and delete user payment methods
router.put('/:id/payment-methods/:pmId', authenticate, adminMiddleware, userController.updateUserPaymentMethod);
router.delete('/:id/payment-methods/:pmId', authenticate, adminMiddleware, userController.deleteUserPaymentMethod);

// Admin: user notes
router.get('/:id/notes', authenticate, adminMiddleware, userController.listUserNotes);
router.post('/:id/notes', authenticate, adminMiddleware, userController.createUserNote);
router.delete('/:id/notes/:noteId', authenticate, adminMiddleware, userController.deleteUserNote);

// Apply admin middleware only on delete route
router.delete('/:id', adminMiddleware, userController.deleteUser);

module.exports = router;
