-- Usage tracking table for subscription limits

CREATE TABLE IF NOT EXISTS usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL, -- 'analyses', 'learning_maps', etc.
  usage_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint to ensure one record per user/resource/period
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_tracking_user_resource_period
ON usage_tracking(user_id, resource_type, period_start);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period
ON usage_tracking(user_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_period_end
ON usage_tracking(period_end);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_usage_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_usage_tracking_timestamp
BEFORE UPDATE ON usage_tracking
FOR EACH ROW
EXECUTE FUNCTION update_usage_tracking_timestamp();

COMMENT ON TABLE usage_tracking IS 'Tracks resource usage per user per billing period';
COMMENT ON COLUMN usage_tracking.resource_type IS 'Type of resource: analyses, learning_maps';
COMMENT ON COLUMN usage_tracking.usage_count IS 'Number of times resource was used in this period';
COMMENT ON COLUMN usage_tracking.period_start IS 'Start of billing period (usually first day of month)';
COMMENT ON COLUMN usage_tracking.period_end IS 'End of billing period (usually first day of next month)';
