/**
 * ============================================================================
 * Subscription Controller
 * Handles Stripe subscription management
 * ============================================================================
 */

const { stripe, STRIPE_PRICE_IDS, PRICING_METADATA } = require('../config/stripeClient');
const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get pricing plans (public endpoint)
 */
async function getPricingPlans(req, res) {
  try {
    res.json({
      success: true,
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
            stripe_price_id: STRIPE_PRICE_IDS.pro_monthly,
          },
          annual: {
            price: 79.00,
            price_per_month: 6.58,
            interval: 'year',
            savings_percent: 26,
            stripe_price_id: STRIPE_PRICE_IDS.pro_annual,
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
            stripe_price_id: STRIPE_PRICE_IDS.premium_monthly,
          },
          annual: {
            price: 169.00,
            price_per_month: 14.08,
            interval: 'year',
            savings_percent: 26,
            stripe_price_id: STRIPE_PRICE_IDS.premium_annual,
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
    logger.error('[Subscription] Error getting pricing plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pricing plans',
    });
  }
}

/**
 * Create Stripe checkout session
 */
async function createCheckoutSession(req, res) {
  try {
    const { price_id, success_url, cancel_url } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Get user from database
    const userResult = await pool.query(
      'SELECT id, email, stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const user = userResult.rows[0];

    // Create or retrieve Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: userId,
        },
      });

      customerId = customer.id;

      // Save customer ID to database
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, userId]
      );

      logger.info(`[Subscription] Created Stripe customer ${customerId} for user ${userId}`);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      success_url: success_url || `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.FRONTEND_URL}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
      },
      metadata: {
        user_id: userId,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
        },
        trial_period_days: process.env.TRIAL_PERIOD_DAYS || 14, // 14-day free trial
      },
    });

    logger.info(`[Subscription] Created checkout session ${session.id} for user ${userId}`);

    res.json({
      success: true,
      session_id: session.id,
      checkout_url: session.url,
    });

  } catch (error) {
    logger.error('[Subscription] Error creating checkout session:', error);
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

    res.json({
      success: true,
      subscription: {
        tier: status.tier,
        status: status.status,
        period_end: status.period_end,
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
    logger.error('[Subscription] Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription status',
    });
  }
}

/**
 * Create Stripe billing portal session (for managing subscription)
 */
async function createPortalSession(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Get user's Stripe customer ID
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].stripe_customer_id) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    const customerId = userResult.rows[0].stripe_customer_id;

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.FRONTEND_URL || 'http://localhost:3000/dashboard',
    });

    logger.info(`[Subscription] Created portal session for user ${userId}`);

    res.json({
      success: true,
      portal_url: session.url,
    });

  } catch (error) {
    logger.error('[Subscription] Error creating portal session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create portal session',
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
      'SELECT stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    );

    if (subResult.rows.length === 0 || !subResult.rows[0].stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    const subscriptionId = subResult.rows[0].stripe_subscription_id;

    // Cancel subscription at period end (not immediately)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    logger.info(`[Subscription] Canceled subscription ${subscriptionId} for user ${userId}`);

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      cancel_at: new Date(subscription.cancel_at * 1000),
    });

  } catch (error) {
    logger.error('[Subscription] Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
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
      ['active', 'trialing']
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
      analytics: {
        mrr: mrrResult.rows,
        active_subscriptions: parseInt(activeResult.rows[0].count),
        revenue_this_month: parseFloat(revenueResult.rows[0]?.total_revenue || 0),
      },
    });

  } catch (error) {
    logger.error('[Subscription] Error getting analytics:', error);
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
  createPortalSession,
  cancelSubscription,
  getAnalytics,
};
