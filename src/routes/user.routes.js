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

// Apply admin middleware only on delete route
router.delete('/:id', adminMiddleware, userController.deleteUser);

module.exports = router;
