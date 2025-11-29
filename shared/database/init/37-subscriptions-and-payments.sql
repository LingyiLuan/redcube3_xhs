-- ============================================================================
-- Migration 37: Subscriptions and Payments
-- Stripe integration for SaaS billing
-- ============================================================================
--
-- Pattern: Stripe Billing (used by 58% of SaaS with $5M+ ARR)
-- Companies using this: Slack, Notion, Linear, Vercel, OpenAI
--
-- Pricing Tiers:
-- - Free: $0/month (5 analyses, 2 learning maps)
-- - Pro: $9/month or $79/year (15 analyses, 10 learning maps)
-- - Premium: $19/month or $169/year (unlimited)
--
-- Created: 2025-11-27
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Stripe customer ID to users table
-- ============================================================================

-- Add Stripe fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;

-- Create index for fast subscription lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID (cus_xxxxx)';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID (sub_xxxxx)';
COMMENT ON COLUMN users.subscription_tier IS 'free, pro, or premium';
COMMENT ON COLUMN users.subscription_status IS 'active, canceled, past_due, trialing, inactive';

-- ============================================================================
-- STEP 2: Create subscriptions table (for history tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,

  -- Subscription details
  tier VARCHAR(50) NOT NULL, -- 'pro' or 'premium'
  billing_interval VARCHAR(20) NOT NULL, -- 'month' or 'year'
  status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing', 'incomplete'

  -- Pricing
  amount_cents INTEGER NOT NULL, -- Amount in cents (e.g., 900 for $9.00)
  currency VARCHAR(3) DEFAULT 'usd',

  -- Dates
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_tier CHECK (tier IN ('pro', 'premium')),
  CONSTRAINT valid_interval CHECK (billing_interval IN ('month', 'year')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'))
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

COMMENT ON TABLE subscriptions IS 'Stripe subscription history and current state';
COMMENT ON COLUMN subscriptions.amount_cents IS 'Subscription price in cents (900 = $9.00)';

-- ============================================================================
-- STEP 3: Create payment_transactions table (for invoice tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Stripe references
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_invoice_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),

  -- Transaction details
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL, -- 'succeeded', 'pending', 'failed', 'refunded'

  -- Payment method
  payment_method_type VARCHAR(50), -- 'card', 'paypal', etc.
  payment_method_last4 VARCHAR(4),
  payment_method_brand VARCHAR(50), -- 'visa', 'mastercard', etc.

  -- Dates
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  description TEXT,
  failure_reason TEXT,

  CONSTRAINT valid_transaction_status CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded', 'canceled'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_payment_intent ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paid_at ON payment_transactions(paid_at);

COMMENT ON TABLE payment_transactions IS 'All payment transactions (successful and failed)';
COMMENT ON COLUMN payment_transactions.amount_cents IS 'Transaction amount in cents';

-- ============================================================================
-- STEP 4: Create stripe_events table (for webhook idempotency)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_events (
  id SERIAL PRIMARY KEY,
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,

  -- Event data
  api_version VARCHAR(50),
  data JSONB NOT NULL,

  -- Processing
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT max_retries CHECK (retry_count <= 10)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_events_stripe_event_id ON stripe_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_events_created_at ON stripe_events(created_at);

COMMENT ON TABLE stripe_events IS 'Stripe webhook events for idempotency and debugging';
COMMENT ON COLUMN stripe_events.processed IS 'Whether event has been successfully processed';

-- ============================================================================
-- STEP 5: Create usage_limits table (for tier-based limits)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_limits (
  id SERIAL PRIMARY KEY,
  tier VARCHAR(50) UNIQUE NOT NULL,

  -- Limits per month
  analyses_per_month INTEGER NOT NULL,
  learning_maps_per_month INTEGER NOT NULL,
  batch_analyses_per_month INTEGER DEFAULT 0,

  -- Features
  api_access BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  data_export BOOLEAN DEFAULT FALSE,
  custom_branding BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_tier_limits CHECK (tier IN ('free', 'pro', 'premium', 'enterprise'))
);

-- Insert default tier limits
INSERT INTO usage_limits (tier, analyses_per_month, learning_maps_per_month, batch_analyses_per_month, api_access, priority_support, data_export) VALUES
  ('free', 5, 2, 0, false, false, false),
  ('pro', 15, 10, 5, false, true, false),
  ('premium', -1, -1, -1, true, true, true) -- -1 means unlimited
ON CONFLICT (tier) DO UPDATE SET
  analyses_per_month = EXCLUDED.analyses_per_month,
  learning_maps_per_month = EXCLUDED.learning_maps_per_month,
  batch_analyses_per_month = EXCLUDED.batch_analyses_per_month,
  api_access = EXCLUDED.api_access,
  priority_support = EXCLUDED.priority_support,
  data_export = EXCLUDED.data_export,
  updated_at = NOW();

COMMENT ON TABLE usage_limits IS 'Tier-based feature limits and permissions';
COMMENT ON COLUMN usage_limits.analyses_per_month IS '-1 means unlimited';

-- ============================================================================
-- STEP 6: Create views for subscription management
-- ============================================================================

-- View: Active subscriptions
CREATE OR REPLACE VIEW v_active_subscriptions AS
SELECT
  u.id as user_id,
  u.email,
  u.display_name,
  s.stripe_subscription_id,
  s.tier,
  s.billing_interval,
  s.amount_cents,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.trial_end,
  CASE
    WHEN s.current_period_end < NOW() THEN 'expired'
    WHEN s.trial_end IS NOT NULL AND s.trial_end > NOW() THEN 'trialing'
    ELSE s.status
  END as effective_status,
  EXTRACT(DAY FROM s.current_period_end - NOW()) as days_until_renewal
FROM users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.status IN ('active', 'trialing', 'past_due')
ORDER BY s.current_period_end ASC;

COMMENT ON VIEW v_active_subscriptions IS 'All currently active subscriptions with renewal dates';

-- View: Monthly recurring revenue (MRR)
CREATE OR REPLACE VIEW v_monthly_recurring_revenue AS
SELECT
  COUNT(DISTINCT user_id) as total_paying_users,
  tier,
  billing_interval,
  COUNT(*) as subscription_count,
  SUM(amount_cents) / 100.0 as total_amount_dollars,
  SUM(
    CASE
      WHEN billing_interval = 'month' THEN amount_cents
      WHEN billing_interval = 'year' THEN amount_cents / 12.0
      ELSE 0
    END
  ) / 100.0 as mrr_dollars
FROM subscriptions
WHERE status IN ('active', 'trialing')
GROUP BY tier, billing_interval
ORDER BY tier, billing_interval;

COMMENT ON VIEW v_monthly_recurring_revenue IS 'MRR breakdown by tier and billing interval';

-- View: User subscription status with usage
CREATE OR REPLACE VIEW v_user_subscription_status AS
SELECT
  u.id as user_id,
  u.email,
  u.subscription_tier as tier,
  u.subscription_status as status,
  u.subscription_period_end as period_end,
  ul.analyses_per_month as analysis_limit,
  ul.learning_maps_per_month as learning_map_limit,
  COALESCE(usage.analyses_this_month, 0) as analyses_used,
  COALESCE(usage.maps_this_month, 0) as learning_maps_used,
  CASE
    WHEN ul.analyses_per_month = -1 THEN -1
    ELSE ul.analyses_per_month - COALESCE(usage.analyses_this_month, 0)
  END as analyses_remaining,
  CASE
    WHEN ul.learning_maps_per_month = -1 THEN -1
    ELSE ul.learning_maps_per_month - COALESCE(usage.maps_this_month, 0)
  END as learning_maps_remaining
FROM users u
LEFT JOIN usage_limits ul ON u.subscription_tier = ul.tier
LEFT JOIN (
  SELECT
    analyzed_by_user_id,
    COUNT(*) FILTER (WHERE analysis_type = 'single_analysis') as analyses_this_month,
    COUNT(*) FILTER (WHERE analysis_type = 'learning_map') as maps_this_month
  FROM experience_analysis_history
  WHERE DATE_TRUNC('month', analyzed_at) = DATE_TRUNC('month', NOW())
  GROUP BY analyzed_by_user_id
) usage ON u.id = usage.analyzed_by_user_id;

COMMENT ON VIEW v_user_subscription_status IS 'User subscription status with usage tracking';

-- ============================================================================
-- STEP 7: Create functions for subscription management
-- ============================================================================

-- Function to update user subscription from Stripe webhook
CREATE OR REPLACE FUNCTION update_user_subscription(
  p_user_id INTEGER,
  p_stripe_subscription_id VARCHAR,
  p_tier VARCHAR,
  p_status VARCHAR,
  p_period_start TIMESTAMP,
  p_period_end TIMESTAMP
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET
    stripe_subscription_id = p_stripe_subscription_id,
    subscription_tier = p_tier,
    subscription_status = p_status,
    subscription_period_start = p_period_start,
    subscription_period_end = p_period_end,
    updated_at = NOW()
  WHERE id = p_user_id;

  RAISE NOTICE 'Updated user % subscription to % (%)', p_user_id, p_tier, p_status;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_subscription IS 'Update user subscription status from Stripe webhook';

-- Function to check if user has feature access
CREATE OR REPLACE FUNCTION user_has_feature(
  p_user_id INTEGER,
  p_feature_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier VARCHAR;
  v_has_access BOOLEAN;
BEGIN
  -- Get user's tier
  SELECT subscription_tier INTO v_tier
  FROM users
  WHERE id = p_user_id;

  -- Check feature access based on tier
  CASE p_feature_name
    WHEN 'api_access' THEN
      SELECT api_access INTO v_has_access
      FROM usage_limits
      WHERE tier = v_tier;
    WHEN 'priority_support' THEN
      SELECT priority_support INTO v_has_access
      FROM usage_limits
      WHERE tier = v_tier;
    WHEN 'data_export' THEN
      SELECT data_export INTO v_has_access
      FROM usage_limits
      WHERE tier = v_tier;
    ELSE
      v_has_access := false;
  END CASE;

  RETURN COALESCE(v_has_access, false);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION user_has_feature IS 'Check if user has access to a specific feature';

-- ============================================================================
-- STEP 8: Create triggers for automatic updates
-- ============================================================================

-- Trigger to update subscription updated_at
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscription_timestamp ON subscriptions;
CREATE TRIGGER trigger_update_subscription_timestamp
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscription_timestamp();

-- Trigger to sync subscription changes to users table
CREATE OR REPLACE FUNCTION sync_subscription_to_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    subscription_tier = NEW.tier,
    subscription_status = NEW.status,
    subscription_period_start = NEW.current_period_start,
    subscription_period_end = NEW.current_period_end,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_subscription_to_user ON subscriptions;
CREATE TRIGGER trigger_sync_subscription_to_user
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_subscription_to_user();

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Migration 37: Subscriptions - COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables created: ✅';
  RAISE NOTICE '  - subscriptions (subscription history)';
  RAISE NOTICE '  - payment_transactions (invoice tracking)';
  RAISE NOTICE '  - stripe_events (webhook idempotency)';
  RAISE NOTICE '  - usage_limits (tier limits)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created: ✅';
  RAISE NOTICE '  - v_active_subscriptions';
  RAISE NOTICE '  - v_monthly_recurring_revenue';
  RAISE NOTICE '  - v_user_subscription_status';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created: ✅';
  RAISE NOTICE '  - update_user_subscription()';
  RAISE NOTICE '  - user_has_feature()';
  RAISE NOTICE '';
  RAISE NOTICE 'Pricing Tiers Configured:';
  RAISE NOTICE '  Free: 5 analyses, 2 learning maps';
  RAISE NOTICE '  Pro: 15 analyses, 10 learning maps';
  RAISE NOTICE '  Premium: Unlimited';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Set up Stripe account at https://stripe.com';
  RAISE NOTICE '2. Create products in Stripe Dashboard';
  RAISE NOTICE '3. Install Stripe SDK: npm install stripe';
  RAISE NOTICE '4. Implement webhook handler';
  RAISE NOTICE '============================================';
END $$;
