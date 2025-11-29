const pool = require('../database/connection');

/**
 * Get current user's subscription
 */
async function getSubscription(req, res) {
  try {
    const userId = req.user.id;

    console.log('[SubscriptionController] Fetching subscription for user:', userId);

    // Get active subscription from database
    const result = await pool.query(
      `SELECT
        id,
        user_id,
        ls_subscription_id,
        ls_customer_id,
        tier,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        created_at,
        updated_at
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // User doesn't have a subscription - they're on free tier
      return res.json({
        success: true,
        subscription: null, // Frontend will treat this as free tier
        tier: 'free'
      });
    }

    const subscription = result.rows[0];

    // Calculate price and billing cycle from tier
    let price = 0;
    let billing_cycle = 'monthly';

    if (subscription.tier === 'pro') {
      price = 9; // Default to monthly, TODO: Get from LS data
      billing_cycle = 'monthly';
    } else if (subscription.tier === 'premium') {
      price = 19;
      billing_cycle = 'monthly';
    }

    const response = {
      id: subscription.id,
      user_id: subscription.user_id,
      ls_subscription_id: subscription.ls_subscription_id,
      tier: subscription.tier,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      price,
      billing_cycle,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at
    };

    return res.json({
      success: true,
      subscription: response
    });
  } catch (error) {
    console.error('[SubscriptionController] Error fetching subscription:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription',
      message: error.message
    });
  }
}

/**
 * Get current user's usage statistics
 */
async function getUsage(req, res) {
  try {
    const userId = req.user.id;

    console.log('[SubscriptionController] Fetching usage for user:', userId);

    // Get user's current subscription tier
    const subscriptionResult = await pool.query(
      `SELECT tier, status
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const tier = subscriptionResult.rows.length > 0
      ? subscriptionResult.rows[0].tier
      : 'free';

    // Get current month's usage
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Get actual usage from database
    const usageResult = await pool.query(
      `SELECT resource_type, usage_count
       FROM usage_tracking
       WHERE user_id = $1
         AND period_start = $2
         AND period_end = $3`,
      [userId, currentMonth, nextMonth]
    );

    // Build usage map
    const usageMap = {};
    usageResult.rows.forEach(row => {
      usageMap[row.resource_type] = row.usage_count;
    });

    // Determine limits based on tier
    let analysesLimit = 5;
    let learningMapsLimit = 2;

    if (tier === 'pro') {
      analysesLimit = 15;
      learningMapsLimit = 10;
    } else if (tier === 'premium') {
      analysesLimit = null; // Unlimited
      learningMapsLimit = null; // Unlimited
    }

    return res.json({
      success: true,
      usage: {
        analyses: {
          used: usageMap['analyses'] || 0,
          limit: analysesLimit,
          reset_date: nextMonth.toISOString()
        },
        learning_maps: {
          used: usageMap['learning_maps'] || 0,
          limit: learningMapsLimit,
          reset_date: nextMonth.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('[SubscriptionController] Error fetching usage:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch usage statistics',
      message: error.message
    });
  }
}

/**
 * Cancel subscription (marks for cancellation at period end)
 */
async function cancelSubscription(req, res) {
  try {
    const userId = req.user.id;

    console.log('[SubscriptionController] Cancelling subscription for user:', userId);

    // Get active subscription
    const subscriptionResult = await pool.query(
      `SELECT id, ls_subscription_id, cancel_at_period_end
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    const subscription = subscriptionResult.rows[0];

    if (subscription.cancel_at_period_end) {
      return res.status(400).json({
        success: false,
        error: 'Subscription is already scheduled for cancellation'
      });
    }

    // Mark subscription for cancellation
    await pool.query(
      `UPDATE subscriptions
       SET cancel_at_period_end = true, updated_at = NOW()
       WHERE id = $1`,
      [subscription.id]
    );

    // TODO: Call Lemon Squeezy API to cancel subscription
    // const lsResponse = await cancelLemonSqueezySubscription(subscription.ls_subscription_id);

    console.log('[SubscriptionController] Subscription marked for cancellation:', subscription.id);

    return res.json({
      success: true,
      message: 'Subscription will cancel at the end of the current billing period'
    });
  } catch (error) {
    console.error('[SubscriptionController] Error cancelling subscription:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
      message: error.message
    });
  }
}

/**
 * Reactivate a cancelled subscription
 */
async function reactivateSubscription(req, res) {
  try {
    const userId = req.user.id;

    console.log('[SubscriptionController] Reactivating subscription for user:', userId);

    // Get subscription marked for cancellation
    const subscriptionResult = await pool.query(
      `SELECT id, ls_subscription_id, cancel_at_period_end
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    const subscription = subscriptionResult.rows[0];

    if (!subscription.cancel_at_period_end) {
      return res.status(400).json({
        success: false,
        error: 'Subscription is not scheduled for cancellation'
      });
    }

    // Remove cancellation flag
    await pool.query(
      `UPDATE subscriptions
       SET cancel_at_period_end = false, updated_at = NOW()
       WHERE id = $1`,
      [subscription.id]
    );

    // TODO: Call Lemon Squeezy API to reactivate subscription
    // const lsResponse = await reactivateLemonSqueezySubscription(subscription.ls_subscription_id);

    console.log('[SubscriptionController] Subscription reactivated:', subscription.id);

    return res.json({
      success: true,
      message: 'Subscription reactivated successfully'
    });
  } catch (error) {
    console.error('[SubscriptionController] Error reactivating subscription:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reactivate subscription',
      message: error.message
    });
  }
}

/**
 * Get subscription history
 */
async function getSubscriptionHistory(req, res) {
  try {
    const userId = req.user.id;

    console.log('[SubscriptionController] Fetching subscription history for user:', userId);

    // Get all subscriptions for this user
    const result = await pool.query(
      `SELECT
        id,
        tier,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        created_at,
        updated_at
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      history: result.rows
    });
  } catch (error) {
    console.error('[SubscriptionController] Error fetching subscription history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription history',
      message: error.message
    });
  }
}

module.exports = {
  getSubscription,
  getUsage,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionHistory
};
