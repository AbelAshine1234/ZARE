const express = require('express');
const router = express.Router();
const { subscriptionSchema } = require('../schemas/subscription.schema');
const { validateBody } = require('../middlewares/validate');
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

// Protect routes
// router.use(authenticate);
// router.use(authorizeAdmin);

// Create subscription
router.post(
  '/',
  validateBody(subscriptionSchema),
  subscriptionController.createSubscription
);

// Get all subscriptions
router.get('/', subscriptionController.getAllSubscriptions);

// Get subscription by id
router.get('/:id', subscriptionController.getSubscriptionById);

// Get subscription details with vendor statistics
router.get('/:id/details', subscriptionController.getSubscriptionDetails);

// Update subscription by id
router.put(
  '/:id',
  validateBody(subscriptionSchema),
  subscriptionController.updateSubscription
);

// Delete subscription by id
router.delete('/:id', subscriptionController.deleteSubscription);

module.exports = router;
