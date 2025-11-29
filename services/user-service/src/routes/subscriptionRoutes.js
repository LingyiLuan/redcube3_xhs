const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }
  next();
};

// Get current user's subscription
router.get('/subscription', requireAuth, subscriptionController.getSubscription);

// Get current user's usage statistics
router.get('/usage', requireAuth, subscriptionController.getUsage);

// Cancel subscription (marks for cancellation at period end)
router.post('/subscription/cancel', requireAuth, subscriptionController.cancelSubscription);

// Reactivate a cancelled subscription
router.post('/subscription/reactivate', requireAuth, subscriptionController.reactivateSubscription);

// Get subscription history
router.get('/subscription/history', requireAuth, subscriptionController.getSubscriptionHistory);

module.exports = router;
