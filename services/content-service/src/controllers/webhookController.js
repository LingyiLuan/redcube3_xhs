/**
 * ============================================================================
 * Stripe Webhook Handler
 * Processes Stripe events (subscriptions, payments, etc.)
 * ============================================================================
 *
 * Pattern: Idempotent webhook processing with event deduplication
 * Companies using this: Stripe itself, Shopify, Vercel, Linear
 *
 * Events handled:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

const { stripe, STRIPE_WEBHOOK_SECRET } = require('../config/stripeClient');
const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Main webhook handler
 * Verifies signature and routes to specific handlers
 */
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error(`[Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    // Check if event already processed (idempotency)
    const existingEvent = await pool.query(
      'SELECT id, processed FROM stripe_events WHERE stripe_event_id = $1',
      [event.id]
    );

    if (existingEvent.rows.length > 0 && existingEvent.rows[0].processed) {
      logger.info(`[Webhook] Event ${event.id} already processed, skipping`);
      return res.json({ received: true, already_processed: true });
    }

    // Save event to database
    await pool.query(
      `INSERT INTO stripe_events (stripe_event_id, event_type, api_version, data, processed)
       VALUES ($1, $2, $3, $4, false)
       ON CONFLICT (stripe_event_id) DO NOTHING`,
      [event.id, event.type, event.api_version, JSON.stringify(event.data)]
    );

    // Route to specific handler
    let processed = false;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event);
        processed = true;
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        processed = true;
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event);
        processed = true;
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event);
        processed = true;
        break;

      default:
        logger.info(`[Webhook] Unhandled event type: ${event.type}`);
        processed = true; // Mark as processed to avoid retries
    }

    // Mark event as processed
    if (processed) {
      await pool.query(
        'UPDATE stripe_events SET processed = true, processed_at = NOW() WHERE stripe_event_id = $1',
        [event.id]
      );
    }

    res.json({ received: true });

  } catch (error) {
    logger.error(`[Webhook] Error processing event ${event.id}:`, error);

    // Update retry count
    await pool.query(
      'UPDATE stripe_events SET retry_count = retry_count + 1, error_message = $1 WHERE stripe_event_id = $2',
      [error.message, event.id]
    );

    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdate(event) {
  const subscription = event.data.object;
  const userId = parseInt(subscription.metadata.user_id);

  if (!userId) {
    logger.error('[Webhook] No user_id in subscription metadata');
    return;
  }

  // Determine tier from price ID
  const priceId = subscription.items.data[0].price.id;
  let tier = 'free';
  let billingInterval = subscription.items.data[0].price.recurring.interval;

  if (priceId.includes('pro')) {
    tier = 'pro';
  } else if (priceId.includes('premium')) {
    tier = 'premium';
  }

  // Upsert subscription
  await pool.query(
    `INSERT INTO subscriptions (
      user_id, stripe_subscription_id, stripe_customer_id, stripe_price_id,
      tier, billing_interval, status, amount_cents, currency,
      current_period_start, current_period_end, trial_start, trial_end
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()`,
    [
      userId,
      subscription.id,
      subscription.customer,
      priceId,
      tier,
      billingInterval,
      subscription.status,
      subscription.items.data[0].price.unit_amount,
      subscription.items.data[0].price.currency,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    ]
  );

  logger.info(`[Webhook] Updated subscription for user ${userId}: ${tier} (${subscription.status})`);
}

/**
 * Handle subscription deleted/canceled
 */
async function handleSubscriptionDeleted(event) {
  const subscription = event.data.object;
  const userId = parseInt(subscription.metadata.user_id);

  if (!userId) {
    logger.error('[Webhook] No user_id in subscription metadata');
    return;
  }

  // Update subscription status
  await pool.query(
    `UPDATE subscriptions
     SET status = 'canceled', ended_at = NOW(), updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );

  // Downgrade user to free tier
  await pool.query(
    `UPDATE users
     SET subscription_tier = 'free',
         subscription_status = 'inactive',
         stripe_subscription_id = NULL
     WHERE id = $1`,
    [userId]
  );

  logger.info(`[Webhook] Subscription canceled for user ${userId}`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(event) {
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription;

  // Get subscription from database
  const subResult = await pool.query(
    'SELECT id, user_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [subscriptionId]
  );

  if (subResult.rows.length === 0) {
    logger.error(`[Webhook] Subscription ${subscriptionId} not found`);
    return;
  }

  const sub = subResult.rows[0];

  // Record payment transaction
  await pool.query(
    `INSERT INTO payment_transactions (
      user_id, subscription_id, stripe_payment_intent_id, stripe_invoice_id,
      amount_cents, currency, status, payment_method_type, paid_at, description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (stripe_payment_intent_id) DO NOTHING`,
    [
      sub.user_id,
      sub.id,
      invoice.payment_intent,
      invoice.id,
      invoice.amount_paid,
      invoice.currency,
      'succeeded',
      invoice.charge?.payment_method_details?.type || 'card',
      new Date(invoice.status_transitions.paid_at * 1000),
      `Payment for ${invoice.lines.data[0]?.description}`,
    ]
  );

  logger.info(`[Webhook] Payment succeeded for user ${sub.user_id}: $${invoice.amount_paid / 100}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event) {
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription;

  // Get subscription
  const subResult = await pool.query(
    'SELECT id, user_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [subscriptionId]
  );

  if (subResult.rows.length === 0) {
    logger.error(`[Webhook] Subscription ${subscriptionId} not found`);
    return;
  }

  const sub = subResult.rows[0];

  // Record failed transaction
  await pool.query(
    `INSERT INTO payment_transactions (
      user_id, subscription_id, stripe_invoice_id,
      amount_cents, currency, status, failure_reason, description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      sub.user_id,
      sub.id,
      invoice.id,
      invoice.amount_due,
      invoice.currency,
      'failed',
      invoice.last_finalization_error?.message || 'Payment failed',
      `Failed payment for ${invoice.lines.data[0]?.description}`,
    ]
  );

  // TODO: Send email notification to user about failed payment

  logger.warn(`[Webhook] Payment failed for user ${sub.user_id}`);
}

module.exports = {
  handleWebhook,
};
