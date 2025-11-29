-- Migrate subscriptions table from Stripe to Lemon Squeezy

-- Add new Lemon Squeezy columns
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS ls_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS ls_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS ls_variant_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Drop old Stripe columns (if they exist and are not being used)
-- Note: We'll keep the old columns for now to avoid data loss
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS stripe_subscription_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS stripe_customer_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS stripe_price_id;

-- Make ls_subscription_id unique
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_ls_subscription_id_key
ON subscriptions(ls_subscription_id)
WHERE ls_subscription_id IS NOT NULL;

-- Update status constraint to include more states
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE subscriptions
ADD CONSTRAINT valid_status CHECK (
  status IN ('active', 'cancelled', 'expired', 'past_due', 'paused', 'on_trial', 'unpaid')
);

-- Update tier constraint to include free tier
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS valid_tier;
ALTER TABLE subscriptions
ADD CONSTRAINT valid_tier CHECK (
  tier IN ('free', 'pro', 'premium')
);

-- Make some columns nullable for better flexibility
ALTER TABLE subscriptions ALTER COLUMN stripe_subscription_id DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN stripe_customer_id DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN stripe_price_id DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN amount_cents DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN current_period_start DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN current_period_end DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN billing_interval DROP NOT NULL;

COMMENT ON COLUMN subscriptions.ls_subscription_id IS 'Lemon Squeezy subscription ID';
COMMENT ON COLUMN subscriptions.ls_customer_id IS 'Lemon Squeezy customer ID';
COMMENT ON COLUMN subscriptions.ls_variant_id IS 'Lemon Squeezy variant ID (product variant)';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at end of current period';

-- Create index on user_id + status for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
ON subscriptions(user_id, status);
