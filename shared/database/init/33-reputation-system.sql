-- Migration 33: Reputation & Gamification System
-- Adds user reputation, points, tiers, and reputation history tracking

-- Add reputation fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reputation_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS linkedin_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_tier_updated_at TIMESTAMP DEFAULT NOW();

-- Create reputation_history table for tracking all point changes
CREATE TABLE IF NOT EXISTS reputation_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_delta INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  related_entity_type VARCHAR(50), -- 'experience', 'upvote', 'citation', 'profile', etc.
  related_entity_id INTEGER, -- ID of the related entity
  metadata JSONB, -- Additional context (e.g., { "experienceTitle": "..." })
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_tier_history table for tracking tier progression
CREATE TABLE IF NOT EXISTS user_tier_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_tier VARCHAR(50),
  new_tier VARCHAR(50) NOT NULL,
  points_at_transition INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_reputation_points
  ON users(reputation_points DESC);

CREATE INDEX IF NOT EXISTS idx_users_tier
  ON users(tier);

CREATE INDEX IF NOT EXISTS idx_reputation_history_user_id
  ON reputation_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reputation_history_entity
  ON reputation_history(related_entity_type, related_entity_id);

CREATE INDEX IF NOT EXISTS idx_user_tier_history_user_id
  ON user_tier_history(user_id, created_at DESC);

-- Function to calculate user tier based on points
CREATE OR REPLACE FUNCTION calculate_user_tier(p_points INTEGER)
RETURNS VARCHAR AS $$
BEGIN
  IF p_points >= 500 THEN
    RETURN 'platinum';
  ELSIF p_points >= 200 THEN
    RETURN 'gold';
  ELSIF p_points >= 50 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_user_tier IS 'Calculates user tier based on reputation points: Bronze (0-49), Silver (50-199), Gold (200-499), Platinum (500+)';

-- Function to update user tier when points change
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
DECLARE
  v_old_tier VARCHAR(50);
  v_new_tier VARCHAR(50);
BEGIN
  -- Calculate new tier based on updated points
  v_new_tier := calculate_user_tier(NEW.reputation_points);
  v_old_tier := OLD.tier;

  -- Only update if tier changed
  IF v_new_tier != v_old_tier THEN
    NEW.tier := v_new_tier;
    NEW.last_tier_updated_at := NOW();

    -- Record tier transition in history
    INSERT INTO user_tier_history (user_id, old_tier, new_tier, points_at_transition)
    VALUES (NEW.id, v_old_tier, v_new_tier, NEW.reputation_points);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update tier when reputation_points changes
DROP TRIGGER IF EXISTS trigger_update_user_tier ON users;
CREATE TRIGGER trigger_update_user_tier
  BEFORE UPDATE OF reputation_points ON users
  FOR EACH ROW
  WHEN (OLD.reputation_points IS DISTINCT FROM NEW.reputation_points)
  EXECUTE FUNCTION update_user_tier();

-- Function to get usage limits based on tier
CREATE OR REPLACE FUNCTION get_tier_analysis_limit(p_tier VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  CASE p_tier
    WHEN 'bronze' THEN RETURN 5;
    WHEN 'silver' THEN RETURN 15;
    WHEN 'gold' THEN RETURN -1; -- Unlimited
    WHEN 'platinum' THEN RETURN -1; -- Unlimited
    ELSE RETURN 5; -- Default to bronze
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_tier_analysis_limit IS 'Returns monthly analysis limit for a tier (-1 means unlimited)';

-- Create view for user reputation leaderboard
CREATE OR REPLACE VIEW reputation_leaderboard AS
SELECT
  u.id,
  u.email,
  u.reputation_points,
  u.tier,
  u.verified_at,
  u.linkedin_verified,
  u.profile_completed,
  u.created_at as user_since,
  COUNT(DISTINCT ie.id) as experiences_shared,
  COALESCE(SUM(ie.upvotes), 0) as total_upvotes_received,
  COALESCE(SUM(ie.analysis_usage_count), 0) as total_citations_received,
  u.last_tier_updated_at
FROM users u
LEFT JOIN interview_experiences ie ON ie.user_id = u.id AND ie.deleted_at IS NULL
GROUP BY u.id
ORDER BY u.reputation_points DESC, u.created_at ASC;

COMMENT ON VIEW reputation_leaderboard IS 'Leaderboard view showing users ranked by reputation with key stats';

-- Add comments to document the schema
COMMENT ON COLUMN users.reputation_points IS 'Total reputation points earned by user (determines tier)';
COMMENT ON COLUMN users.tier IS 'User tier based on points: bronze (0-49), silver (50-199), gold (200-499), platinum (500+)';
COMMENT ON COLUMN users.verified_at IS 'Timestamp when user verified their email (awards 20 points)';
COMMENT ON COLUMN users.linkedin_verified IS 'Whether user verified LinkedIn profile (awards 30 points)';
COMMENT ON COLUMN users.profile_completed IS 'Whether user completed profile setup (awards 20 points)';
COMMENT ON COLUMN users.last_tier_updated_at IS 'Timestamp of last tier change';

COMMENT ON TABLE reputation_history IS 'Audit log of all reputation point changes for transparency';
COMMENT ON COLUMN reputation_history.points_delta IS 'Change in points (positive or negative)';
COMMENT ON COLUMN reputation_history.reason IS 'Human-readable reason for point change';
COMMENT ON COLUMN reputation_history.related_entity_type IS 'Type of entity that caused point change (experience, upvote, citation, etc.)';
COMMENT ON COLUMN reputation_history.related_entity_id IS 'ID of the related entity in its respective table';
COMMENT ON COLUMN reputation_history.metadata IS 'Additional JSON context about the point change';

COMMENT ON TABLE user_tier_history IS 'History of user tier promotions/demotions for gamification tracking';
