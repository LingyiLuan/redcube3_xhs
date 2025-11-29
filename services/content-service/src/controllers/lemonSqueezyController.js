/**
 * ============================================================================
 * Lemon Squeezy Subscription Controller
 * Handles subscription management via Lemon Squeezy (Merchant of Record)
 * ============================================================================
 */

const {
  createCheckout,
  getSubscription,
  cancelSubscription: lsCancelSubscription,
  getCustomer,
} = require('@lemonsqueezy/lemonsqueezy.js');
const { LS_CONFIG, PRICING_METADATA } = require('../config/lemonSqueezyClient');
const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get pricing plans (public endpoint)
 */
async function getPricingPlans(req, res) {
  try {
    res.json({
      success: true,
      provider: 'lemon_squeezy',
      plans: {
        free: {
          name: 'Free',
          price: 0,
          interval: 'month',
          features: {
            analyses: 5,
            learning_maps: 2,
            batch_analyses: 0,
            api_access: false,
            priority_support: false,
          },
        },
        pro: {
          name: 'Pro',
          monthly: {
            price: 9.00,
            interval: 'month',
            variant_id: LS_CONFIG.variants.pro_monthly,
          },
          annual: {
            price: 79.00,
            price_per_month: 6.58,
            interval: 'year',
            savings_percent: 26,
            variant_id: LS_CONFIG.variants.pro_annual,
          },
          features: {
            analyses: 15,
            learning_maps: 10,
            batch_analyses: 5,
            api_access: false,
            priority_support: true,
          },
        },
        premium: {
          name: 'Premium',
          monthly: {
            price: 19.00,
            interval: 'month',
            variant_id: LS_CONFIG.variants.premium_monthly,
          },
          annual: {
            price: 169.00,
            price_per_month: 14.08,
            interval: 'year',
            savings_percent: 26,
            variant_id: LS_CONFIG.variants.premium_annual,
          },
          features: {
            analyses: -1, // Unlimited
            learning_maps: -1,
            batch_analyses: -1,
            api_access: true,
            priority_support: true,
            data_export: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error('[LemonSqueezy] Error getting pricing plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pricing plans',
    });
  }
}

/**
 * Create Lemon Squeezy checkout session
 */
async function createCheckoutSession(req, res) {
  try {
    const { variant_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Get user from database
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const user = userResult.rows[0];

    // Create checkout session
    const checkout = await createCheckout(
      LS_CONFIG.storeId,
      variant_id,
      {
        checkoutData: {
          email: user.email,
          custom: {
            user_id: userId.toString(),
          },
        },
        checkoutOptions: {
          embed: false,
          media: true,
          logo: true,
        },
        expiresAt: null,
        preview: false,
        testMode: process.env.NODE_ENV !== 'production',
      }
    );

    if (checkout.error) {
      throw new Error(checkout.error.message);
    }

    logger.info(`[LemonSqueezy] Created checkout for user ${userId}`);

    res.json({
      success: true,
      checkout_id: checkout.data?.id,
      checkout_url: checkout.data?.attributes?.url,
    });

  } catch (error) {
    logger.error('[LemonSqueezy] Error creating checkout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}

/**
 * Get user's current subscription status
 */
async function getSubscriptionStatus(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Get subscription status from view
    const result = await pool.query(
      'SELECT * FROM v_user_subscription_status WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const status = result.rows[0];

    // Get Lemon Squeezy subscription details if exists
    let lsSubscription = null;
    if (status.ls_subscription_id) {
      try {
        const subResponse = await getSubscription(status.ls_subscription_id);
        if (!subResponse.error) {
          lsSubscription = subResponse.data;
        }
      } catch (err) {
        logger.warn(`[LemonSqueezy] Could not fetch subscription details: ${err.message}`);
      }
    }

    res.json({
      success: true,
      subscription: {
        provider: 'lemon_squeezy',
        tier: status.tier,
        status: status.status,
        period_end: status.period_end,
        renews_at: lsSubscription?.attributes?.renews_at,
        urls: {
          customer_portal: lsSubscription?.attributes?.urls?.customer_portal,
          update_payment_method: lsSubscription?.attributes?.urls?.update_payment_method,
        },
        limits: {
          analyses: {
            limit: status.analysis_limit === -1 ? 'unlimited' : status.analysis_limit,
            used: status.analyses_used,
            remaining: status.analyses_remaining === -1 ? 'unlimited' : status.analyses_remaining,
          },
          learning_maps: {
            limit: status.learning_map_limit === -1 ? 'unlimited' : status.learning_map_limit,
            used: status.learning_maps_used,
            remaining: status.learning_maps_remaining === -1 ? 'unlimited' : status.learning_maps_remaining,
          },
        },
      },
    });

  } catch (error) {
    logger.error('[LemonSqueezy] Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription status',
    });
  }
}

/**
 * Get customer portal URL
 */
async function getCustomerPortalUrl(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Get user's Lemon Squeezy subscription ID
    const userResult = await pool.query(
      'SELECT ls_subscription_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].ls_subscription_id) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    const subscriptionId = userResult.rows[0].ls_subscription_id;

    // Get subscription to retrieve customer portal URL
    const subResponse = await getSubscription(subscriptionId);

    if (subResponse.error) {
      throw new Error(subResponse.error.message);
    }

    const portalUrl = subResponse.data?.attributes?.urls?.customer_portal;

    if (!portalUrl) {
      throw new Error('Customer portal URL not available');
    }

    logger.info(`[LemonSqueezy] Retrieved portal URL for user ${userId}`);

    res.json({
      success: true,
      portal_url: portalUrl,
    });

  } catch (error) {
    logger.error('[LemonSqueezy] Error getting portal URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer portal',
      message: error.message,
    });
  }
}

/**
 * Cancel subscription
 */
async function cancelSubscription(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Get user's subscription
    const subResult = await pool.query(
      'SELECT ls_subscription_id FROM users WHERE id = $1',
      [userId]
    );

    if (subResult.rows.length === 0 || !subResult.rows[0].ls_subscription_id) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    const subscriptionId = subResult.rows[0].ls_subscription_id;

    // Cancel subscription via Lemon Squeezy API
    const response = await lsCancelSubscription(subscriptionId);

    if (response.error) {
      throw new Error(response.error.message);
    }

    logger.info(`[LemonSqueezy] Canceled subscription ${subscriptionId} for user ${userId}`);

    res.json({
      success: true,
      message: 'Subscription canceled successfully',
      ends_at: response.data?.attributes?.ends_at,
    });

  } catch (error) {
    logger.error('[LemonSqueezy] Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
      message: error.message,
    });
  }
}

/**
 * Get subscription analytics (admin only)
 */
async function getAnalytics(req, res) {
  try {
    // TODO: Add admin authentication check

    // Get MRR
    const mrrResult = await pool.query('SELECT * FROM v_monthly_recurring_revenue');

    // Get active subscriptions count
    const activeResult = await pool.query(
      'SELECT COUNT(*) FROM subscriptions WHERE status IN ($1, $2)',
      ['active', 'on_trial']
    );

    // Get total revenue this month
    const revenueResult = await pool.query(
      `SELECT SUM(amount_cents) / 100.0 as total_revenue
       FROM payment_transactions
       WHERE status = 'succeeded'
         AND paid_at >= DATE_TRUNC('month', NOW())`
    );

    res.json({
      success: true,
      provider: 'lemon_squeezy',
      analytics: {
        mrr: mrrResult.rows,
        active_subscriptions: parseInt(activeResult.rows[0].count),
        revenue_this_month: parseFloat(revenueResult.rows[0]?.total_revenue || 0),
      },
    });

  } catch (error) {
    logger.error('[LemonSqueezy] Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
    });
  }
}

module.exports = {
  getPricingPlans,
  createCheckoutSession,
  getSubscriptionStatus,
  getCustomerPortalUrl,
  cancelSubscription,
  getAnalytics,
};
