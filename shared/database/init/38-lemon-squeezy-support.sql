/**
 * ============================================================================
 * Migration 38: Lemon Squeezy Payment Provider Support
 * Adds support for Lemon Squeezy alongside Stripe
 * ============================================================================
 *
 * Purpose: Enable dual payment provider support (Stripe + Lemon Squeezy)
 * - Lemon Squeezy: For users without SSN (Merchant of Record)
 * - Stripe: For users with SSN/ITIN/EIN (future option)
 *
 * Changes:
 * 1. Add Lemon Squeezy IDs to users table
 * 2. Add Lemon Squeezy IDs to subscriptions table
 * 3. Add provider column to track payment provider
 * 4. Create lemon_squeezy_events table for webhook idempotency
 * 5. Add Lemon Squeezy columns to payment_transactions
 * 6. Update views to handle both providers
 */

-- ============================================================================
-- 1. Add Lemon Squeezy columns to users table
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS ls_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS ls_customer_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_ls_subscription_id ON users(ls_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_ls_customer_id ON users(ls_customer_id);

-- ============================================================================
-- 2. Add Lemon Squeezy columns and provider to subscriptions table
-- ============================================================================

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS ls_subscription_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS ls_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS ls_variant_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'stripe' CHECK (provider IN ('stripe', 'lemon_squeezy'));

-- Update existing subscriptions to have 'stripe' provider
UPDATE subscriptions SET provider = 'stripe' WHERE provider IS NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_ls_subscription_id ON subscriptions(ls_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider ON subscriptions(provider);

-- ============================================================================
-- 3. Create lemon_squeezy_events table for webhook idempotency
-- ============================================================================

CREATE TABLE IF NOT EXISTS lemon_squeezy_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lemon_squeezy_events_event_id ON lemon_squeezy_events(event_id);
CREATE INDEX IF NOT EXISTS idx_lemon_squeezy_events_processed ON lemon_squeezy_events(processed);
CREATE INDEX IF NOT EXISTS idx_lemon_squeezy_events_created_at ON lemon_squeezy_events(created_at);

-- ============================================================================
-- 4. Add Lemon Squeezy columns to payment_transactions table
-- ============================================================================

ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS ls_order_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'stripe' CHECK (provider IN ('stripe', 'lemon_squeezy'));

-- Update existing transactions to have 'stripe' provider
UPDATE payment_transactions SET provider = 'stripe' WHERE provider IS NULL;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_ls_order_id ON payment_transactions(ls_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider);

-- ============================================================================
-- 5. Update views to handle both providers
-- ============================================================================

-- Update v_active_subscriptions view
DROP VIEW IF EXISTS v_active_subscriptions;
CREATE VIEW v_active_subscriptions AS
SELECT
  u.id as user_id,
  u.email,
  COALESCE(s.stripe_subscription_id, s.ls_subscription_id) as subscription_id,
  s.provider,
  s.tier,
  s.status,
  s.billing_interval,
  s.amount_cents / 100.0 as amount,
  s.currency,
  s.current_period_start,
  s.current_period_end,
  s.trial_end,
  s.created_at as subscription_created_at
FROM users u
INNER JOIN subscriptions s ON u.id = s.user_id
WHERE s.status IN ('active', 'trialing', 'on_trial')
  AND s.ended_at IS NULL
ORDER BY s.created_at DESC;

-- Update v_monthly_recurring_revenue view
DROP VIEW IF EXISTS v_monthly_recurring_revenue;
CREATE VIEW v_monthly_recurring_revenue AS
SELECT
  s.tier,
  s.provider,
  COUNT(*) as subscriber_count,
  SUM(
    CASE
      WHEN s.billing_interval = 'month' THEN s.amount_cents / 100.0
      WHEN s.billing_interval = 'year' THEN (s.amount_cents / 100.0) / 12
      ELSE 0
    END
  ) as mrr
FROM subscriptions s
WHERE s.status IN ('active', 'trialing', 'on_trial')
  AND s.ended_at IS NULL
GROUP BY s.tier, s.provider
ORDER BY s.tier, s.provider;

-- Update v_user_subscription_status view
DROP VIEW IF EXISTS v_user_subscription_status;
CREATE VIEW v_user_subscription_status AS
SELECT
  u.id as user_id,
  u.email,
  COALESCE(u.subscription_tier, 'free') as tier,
  COALESCE(u.subscription_status, 'inactive') as status,
  u.stripe_subscription_id,
  u.ls_subscription_id,
  s.provider,
  s.current_period_end as period_end,
  ul.analyses_per_month as analysis_limit,
  COALESCE(
    (SELECT COUNT(*) FROM analyses WHERE user_id = u.id
     AND created_at >= DATE_TRUNC('month', NOW())),
    0
  ) as analyses_used,
  GREATEST(
    0,
    ul.analyses_per_month - COALESCE(
      (SELECT COUNT(*) FROM analyses WHERE user_id = u.id
       AND created_at >= DATE_TRUNC('month', NOW())),
      0
    )
  ) as analyses_remaining,
  ul.learning_maps_per_month as learning_map_limit,
  COALESCE(
    (SELECT COUNT(*) FROM learning_maps WHERE user_id = u.id
     AND created_at >= DATE_TRUNC('month', NOW())),
    0
  ) as learning_maps_used,
  GREATEST(
    0,
    ul.learning_maps_per_month - COALESCE(
      (SELECT COUNT(*) FROM learning_maps WHERE user_id = u.id
       AND created_at >= DATE_TRUNC('month', NOW())),
      0
    )
  ) as learning_maps_remaining
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
  AND s.status IN ('active', 'trialing', 'on_trial')
  AND s.ended_at IS NULL
LEFT JOIN usage_limits ul ON COALESCE(u.subscription_tier, 'free') = ul.tier;

-- ============================================================================
-- 6. Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN users.ls_subscription_id IS 'Lemon Squeezy subscription ID';
COMMENT ON COLUMN users.ls_customer_id IS 'Lemon Squeezy customer ID';
COMMENT ON COLUMN subscriptions.ls_subscription_id IS 'Lemon Squeezy subscription ID';
COMMENT ON COLUMN subscriptions.ls_customer_id IS 'Lemon Squeezy customer ID';
COMMENT ON COLUMN subscriptions.ls_variant_id IS 'Lemon Squeezy variant/product ID';
COMMENT ON COLUMN subscriptions.provider IS 'Payment provider: stripe or lemon_squeezy';
COMMENT ON TABLE lemon_squeezy_events IS 'Webhook events from Lemon Squeezy for idempotent processing';
COMMENT ON COLUMN payment_transactions.ls_order_id IS 'Lemon Squeezy order ID';
COMMENT ON COLUMN payment_transactions.provider IS 'Payment provider: stripe or lemon_squeezy';

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 38 complete: Lemon Squeezy support added';
  RAISE NOTICE '   - Added ls_subscription_id and ls_customer_id to users';
  RAISE NOTICE '   - Added Lemon Squeezy columns to subscriptions';
  RAISE NOTICE '   - Created lemon_squeezy_events table';
  RAISE NOTICE '   - Updated views to handle both providers';
  RAISE NOTICE '   - System now supports both Stripe and Lemon Squeezy';
END $$;
