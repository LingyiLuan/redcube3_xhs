/**
 * ============================================================================
 * Lemon Squeezy Webhook Handler
 * Processes Lemon Squeezy events (subscriptions, payments, etc.)
 * ============================================================================
 *
 * Pattern: Idempotent webhook processing with event deduplication
 *
 * Events handled:
 * - subscription_created
 * - subscription_updated
 * - subscription_cancelled
 * - subscription_resumed
 * - subscription_expired
 * - subscription_paused
 * - subscription_unpaused
 * - order_created
 * - subscription_payment_success
 * - subscription_payment_failed
 * - subscription_payment_recovered
 */

const crypto = require('crypto');
const { LS_CONFIG } = require('../config/lemonSqueezyClient');
const pool = require('../config/database');
const logger = require('../utils/logger');
const { Pool } = require('pg');

// Create separate pool for users database (where payment tables reside)
const usersPool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: 'redcube_users', // Payment tables are in users database
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 5,
  idleTimeoutMillis: 30000,
});

/**
 * Verify Lemon Squeezy webhook signature
 */
function verifyWebhookSignature(rawBody, signature) {
  const secret = LS_CONFIG.webhookSecret;

  if (!secret) {
    logger.warn('[LemonSqueezy Webhook] No webhook secret configured');
    return false;
  }

  // Convert Buffer to string if needed
  const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(bodyString).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

/**
 * Main webhook handler
 * Verifies signature and routes to specific handlers
 */
async function handleLemonSqueezyWebhook(req, res) {
  const signature = req.headers['x-signature'];

  if (!signature) {
    logger.error('[LemonSqueezy Webhook] Missing signature header');
    return res.status(400).json({ error: 'Missing signature' });
  }

  // Verify signature using raw body (stored by express.json verify function)
  const rawBody = req.rawBody || JSON.stringify(req.body);
  logger.info(`[LemonSqueezy Webhook] DEBUG: rawBody type=${typeof rawBody}, hasRawBody=${!!req.rawBody}, bodyType=${typeof req.body}, bodyIsObject=${typeof req.body === 'object'}`);
  logger.info(`[LemonSqueezy Webhook] DEBUG: rawBody first 100 chars: ${typeof rawBody === 'string' ? rawBody.substring(0, 100) : 'NOT A STRING: ' + Object.prototype.toString.call(rawBody)}`);
  const isValid = verifyWebhookSignature(rawBody, signature);

  if (!isValid) {
    logger.error('[LemonSqueezy Webhook] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Body is already parsed by express.json middleware
  const event = req.body;

  if (!event || !event.meta) {
    logger.error('[LemonSqueezy Webhook] Invalid payload structure');
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const eventName = event.meta?.event_name;
  const eventId = event.meta?.custom_data?.event_id || `${eventName}_${Date.now()}`;

  logger.info(`[LemonSqueezy Webhook] Received event: ${eventName} (${eventId})`);

  try {
    // Check if event already processed (idempotency)
    const existingEvent = await usersPool.query(
      'SELECT id, processed FROM lemon_squeezy_events WHERE event_id = $1',
      [eventId]
    );

    if (existingEvent.rows.length > 0 && existingEvent.rows[0].processed) {
      logger.info(`[LemonSqueezy Webhook] Event ${eventId} already processed, skipping`);
      return res.json({ received: true, already_processed: true });
    }

    // Save event to database
    await usersPool.query(
      `INSERT INTO lemon_squeezy_events (event_id, event_type, event_data, processed)
       VALUES ($1, $2, $3, false)
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId, eventName, JSON.stringify(event)]
    );

    // Route to specific handler
    let processed = false;

    switch (eventName) {
      case 'subscription_created':
        await handleSubscriptionCreated(event);
        processed = true;
        break;

      case 'subscription_updated':
        await handleSubscriptionUpdated(event);
        processed = true;
        break;

      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event);
        processed = true;
        break;

      case 'subscription_resumed':
        await handleSubscriptionResumed(event);
        processed = true;
        break;

      case 'subscription_expired':
        await handleSubscriptionExpired(event);
        processed = true;
        break;

      case 'subscription_paused':
      case 'subscription_unpaused':
        await handleSubscriptionUpdated(event);
        processed = true;
        break;

      case 'order_created':
        await handleOrderCreated(event);
        processed = true;
        break;

      case 'subscription_payment_success':
        await handlePaymentSuccess(event);
        processed = true;
        break;

      case 'subscription_payment_failed':
        await handlePaymentFailed(event);
        processed = true;
        break;

      case 'subscription_payment_recovered':
        await handlePaymentRecovered(event);
        processed = true;
        break;

      default:
        logger.info(`[LemonSqueezy Webhook] Unhandled event type: ${eventName}`);
        processed = true; // Mark as processed to avoid retries
    }

    // Mark event as processed
    if (processed) {
      await usersPool.query(
        'UPDATE lemon_squeezy_events SET processed = true, processed_at = NOW() WHERE event_id = $1',
        [eventId]
      );
    }

    res.json({ received: true });

  } catch (error) {
    logger.error(`[LemonSqueezy Webhook] Error processing event ${eventId}:`, error);

    // Update retry count
    await usersPool.query(
      'UPDATE lemon_squeezy_events SET retry_count = retry_count + 1, error_message = $1 WHERE event_id = $2',
      [error.message, eventId]
    ).catch(err => logger.error('[LemonSqueezy Webhook] Failed to update retry count:', err));

    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(event) {
  const subscription = event.data;
  const attributes = subscription.attributes;
  const userId = parseInt(attributes.custom_data?.user_id);

  if (!userId) {
    logger.error('[LemonSqueezy Webhook] No user_id in subscription custom_data');
    return;
  }

  // Determine tier from variant ID
  const variantId = attributes.variant_id?.toString();
  let tier = 'free';
  let billingInterval = 'month';

  if (variantId === LS_CONFIG.variants.pro_monthly) {
    tier = 'pro';
    billingInterval = 'month';
  } else if (variantId === LS_CONFIG.variants.pro_annual) {
    tier = 'pro';
    billingInterval = 'year';
  } else if (variantId === LS_CONFIG.variants.premium_monthly) {
    tier = 'premium';
    billingInterval = 'month';
  } else if (variantId === LS_CONFIG.variants.premium_annual) {
    tier = 'premium';
    billingInterval = 'year';
  }

  // Insert subscription
  await usersPool.query(
    `INSERT INTO subscriptions (
      user_id, ls_subscription_id, ls_customer_id, ls_variant_id,
      tier, billing_interval, status, amount_cents, currency,
      current_period_start, current_period_end, trial_start, trial_end,
      provider
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (ls_subscription_id) DO UPDATE SET
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()`,
    [
      userId,
      subscription.id,
      attributes.customer_id,
      variantId,
      tier,
      billingInterval,
      attributes.status,
      Math.round((attributes.subtotal || 0) * 100), // Convert to cents
      attributes.currency || 'USD',
      attributes.created_at ? new Date(attributes.created_at) : new Date(),
      attributes.renews_at ? new Date(attributes.renews_at) : null,
      attributes.trial_ends_at ? new Date(attributes.created_at) : null,
      attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
      'lemon_squeezy'
    ]
  );

  // Update user subscription info
  await usersPool.query(
    `UPDATE users
     SET subscription_tier = $1,
         subscription_status = $2,
         ls_subscription_id = $3,
         ls_customer_id = $4
     WHERE id = $5`,
    [tier, attributes.status, subscription.id, attributes.customer_id, userId]
  );

  logger.info(`[LemonSqueezy Webhook] Created subscription for user ${userId}: ${tier} (${attributes.status})`);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(event) {
  const subscription = event.data;
  const attributes = subscription.attributes;
  const subscriptionId = subscription.id;

  // Update subscription in database
  await usersPool.query(
    `UPDATE subscriptions
     SET status = $1,
         current_period_start = $2,
         current_period_end = $3,
         updated_at = NOW()
     WHERE ls_subscription_id = $4`,
    [
      attributes.status,
      attributes.created_at ? new Date(attributes.created_at) : new Date(),
      attributes.renews_at ? new Date(attributes.renews_at) : null,
      subscriptionId
    ]
  );

  // Update user status
  const subResult = await usersPool.query(
    'SELECT user_id, tier FROM subscriptions WHERE ls_subscription_id = $1',
    [subscriptionId]
  );

  if (subResult.rows.length > 0) {
    const { user_id, tier } = subResult.rows[0];

    await usersPool.query(
      'UPDATE users SET subscription_status = $1 WHERE id = $2',
      [attributes.status, user_id]
    );

    logger.info(`[LemonSqueezy Webhook] Updated subscription ${subscriptionId} for user ${user_id}: ${attributes.status}`);
  }
}

/**
 * Handle subscription cancelled
 */
async function handleSubscriptionCancelled(event) {
  const subscription = event.data;
  const subscriptionId = subscription.id;

  // Update subscription status
  await usersPool.query(
    `UPDATE subscriptions
     SET status = 'cancelled',
         ended_at = NOW(),
         updated_at = NOW()
     WHERE ls_subscription_id = $1`,
    [subscriptionId]
  );

  // Get user from subscription
  const subResult = await usersPool.query(
    'SELECT user_id FROM subscriptions WHERE ls_subscription_id = $1',
    [subscriptionId]
  );

  if (subResult.rows.length > 0) {
    const userId = subResult.rows[0].user_id;

    // Downgrade user to free tier
    await usersPool.query(
      `UPDATE users
       SET subscription_tier = 'free',
           subscription_status = 'cancelled',
           ls_subscription_id = NULL
       WHERE id = $1`,
      [userId]
    );

    logger.info(`[LemonSqueezy Webhook] Subscription cancelled for user ${userId}`);
  }
}

/**
 * Handle subscription resumed
 */
async function handleSubscriptionResumed(event) {
  const subscription = event.data;
  const attributes = subscription.attributes;
  const subscriptionId = subscription.id;

  await usersPool.query(
    `UPDATE subscriptions
     SET status = $1,
         updated_at = NOW()
     WHERE ls_subscription_id = $2`,
    [attributes.status, subscriptionId]
  );

  const subResult = await usersPool.query(
    'SELECT user_id, tier FROM subscriptions WHERE ls_subscription_id = $1',
    [subscriptionId]
  );

  if (subResult.rows.length > 0) {
    const { user_id, tier } = subResult.rows[0];

    await usersPool.query(
      `UPDATE users
       SET subscription_tier = $1,
           subscription_status = $2,
           ls_subscription_id = $3
       WHERE id = $4`,
      [tier, attributes.status, subscriptionId, user_id]
    );

    logger.info(`[LemonSqueezy Webhook] Subscription resumed for user ${user_id}`);
  }
}

/**
 * Handle subscription expired
 */
async function handleSubscriptionExpired(event) {
  const subscription = event.data;
  const subscriptionId = subscription.id;

  await usersPool.query(
    `UPDATE subscriptions
     SET status = 'expired',
         ended_at = NOW(),
         updated_at = NOW()
     WHERE ls_subscription_id = $1`,
    [subscriptionId]
  );

  const subResult = await usersPool.query(
    'SELECT user_id FROM subscriptions WHERE ls_subscription_id = $1',
    [subscriptionId]
  );

  if (subResult.rows.length > 0) {
    const userId = subResult.rows[0].user_id;

    await usersPool.query(
      `UPDATE users
       SET subscription_tier = 'free',
           subscription_status = 'expired',
           ls_subscription_id = NULL
       WHERE id = $1`,
      [userId]
    );

    logger.info(`[LemonSqueezy Webhook] Subscription expired for user ${userId}`);
  }
}

/**
 * Handle order created (one-time purchases)
 */
async function handleOrderCreated(event) {
  const order = event.data;
  const attributes = order.attributes;
  const userId = parseInt(attributes.custom_data?.user_id);

  if (!userId) {
    logger.warn('[LemonSqueezy Webhook] No user_id in order custom_data');
    return;
  }

  // Record transaction
  await usersPool.query(
    `INSERT INTO payment_transactions (
      user_id, ls_order_id, amount_cents, currency, status,
      payment_method_type, paid_at, description, provider
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (ls_order_id) DO NOTHING`,
    [
      userId,
      order.id,
      Math.round((attributes.total || 0) * 100),
      attributes.currency || 'USD',
      attributes.status,
      'lemon_squeezy',
      attributes.created_at ? new Date(attributes.created_at) : new Date(),
      `Order ${order.id}`,
      'lemon_squeezy'
    ]
  );

  logger.info(`[LemonSqueezy Webhook] Order created for user ${userId}: $${attributes.total}`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(event) {
  const subscription = event.data;
  const attributes = subscription.attributes;
  const subscriptionId = subscription.id;

  // Get subscription from database
  const subResult = await usersPool.query(
    'SELECT id, user_id FROM subscriptions WHERE ls_subscription_id = $1',
    [subscriptionId]
  );

  if (subResult.rows.length === 0) {
    logger.error(`[LemonSqueezy Webhook] Subscription ${subscriptionId} not found`);
    return;
  }

  const sub = subResult.rows[0];

  // Record payment transaction
  await usersPool.query(
    `INSERT INTO payment_transactions (
      user_id, subscription_id, amount_cents, currency, status,
      payment_method_type, paid_at, description, provider
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      sub.user_id,
      sub.id,
      Math.round((attributes.subtotal || 0) * 100),
      attributes.currency || 'USD',
      'succeeded',
      'lemon_squeezy',
      new Date(),
      `Subscription payment for ${subscriptionId}`,
      'lemon_squeezy'
    ]
  );

  logger.info(`[LemonSqueezy Webhook] Payment succeeded for user ${sub.user_id}: $${attributes.subtotal}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event) {
  const subscription = event.data;
  const subscriptionId = subscription.id;

  const subResult = await usersPool.query(
    'SELECT id, user_id FROM subscriptions WHERE ls_subscription_id = $1',
    [subscriptionId]
  );

  if (subResult.rows.length === 0) {
    logger.error(`[LemonSqueezy Webhook] Subscription ${subscriptionId} not found`);
    return;
  }

  const sub = subResult.rows[0];

  // Record failed transaction
  await usersPool.query(
    `INSERT INTO payment_transactions (
      user_id, subscription_id, currency, status,
      failure_reason, description, provider
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      sub.user_id,
      sub.id,
      'USD',
      'failed',
      'Payment failed',
      `Failed payment for subscription ${subscriptionId}`,
      'lemon_squeezy'
    ]
  );

  // TODO: Send email notification to user about failed payment

  logger.warn(`[LemonSqueezy Webhook] Payment failed for user ${sub.user_id}`);
}

/**
 * Handle payment recovered after failure
 */
async function handlePaymentRecovered(event) {
  const subscription = event.data;
  const attributes = subscription.attributes;
  const subscriptionId = subscription.id;

  const subResult = await usersPool.query(
    'SELECT id, user_id FROM subscriptions WHERE ls_subscription_id = $1',
    [subscriptionId]
  );

  if (subResult.rows.length > 0) {
    const sub = subResult.rows[0];

    // Record recovered payment
    await usersPool.query(
      `INSERT INTO payment_transactions (
        user_id, subscription_id, amount_cents, currency, status,
        payment_method_type, paid_at, description, provider
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        sub.user_id,
        sub.id,
        Math.round((attributes.subtotal || 0) * 100),
        attributes.currency || 'USD',
        'succeeded',
        'lemon_squeezy',
        new Date(),
        `Recovered payment for ${subscriptionId}`,
        'lemon_squeezy'
      ]
    );

    logger.info(`[LemonSqueezy Webhook] Payment recovered for user ${sub.user_id}`);
  }
}

module.exports = {
  handleLemonSqueezyWebhook,
};
