-- Migration 32: Trending Algorithm for Interview Experiences
-- Adds trending score calculation, materialized view, and supporting functions

-- Add trending score fields to interview_experiences table
ALTER TABLE interview_experiences
ADD COLUMN IF NOT EXISTS trending_score DECIMAL(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS trending_score_updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS decay_factor DECIMAL(5,4) DEFAULT 1.0;

-- Create index on trending_score for fast sorting
CREATE INDEX IF NOT EXISTS idx_interview_experiences_trending_score
  ON interview_experiences(trending_score DESC) WHERE deleted_at IS NULL;

-- Function to calculate trending score
-- Uses engagement, quality, impact, and time decay factors
CREATE OR REPLACE FUNCTION calculate_trending_score(
  p_upvotes INTEGER,
  p_downvotes INTEGER,
  p_views INTEGER,
  p_citation_count INTEGER,
  p_analysis_usage_count INTEGER,
  p_created_at TIMESTAMP,
  p_verified BOOLEAN
) RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL := 0;
  v_time_factor DECIMAL;
  v_engagement_score DECIMAL;
  v_quality_score DECIMAL;
  v_impact_score DECIMAL;
  v_age_in_seconds BIGINT;
BEGIN
  -- Time decay (newer content gets boost)
  -- Decay over 30 days using exponential decay
  v_age_in_seconds := EXTRACT(EPOCH FROM (NOW() - p_created_at));
  v_time_factor := EXP(-1.0 * v_age_in_seconds / (30 * 24 * 60 * 60));

  -- Engagement score (votes + views)
  -- Upvotes worth more than views, downvotes penalize
  v_engagement_score := (p_upvotes * 10) - (p_downvotes * 5) + (p_views * 0.1);

  -- Quality score (helpfulness ratio)
  -- Percentage of positive votes
  IF (p_upvotes + p_downvotes) > 0 THEN
    v_quality_score := (p_upvotes::DECIMAL / (p_upvotes + p_downvotes)) * 100;
  ELSE
    v_quality_score := 50; -- Neutral for no votes
  END IF;

  -- Impact score (citations and analysis usage)
  -- Citations worth more as they indicate academic influence
  v_impact_score := (p_citation_count * 20) + (p_analysis_usage_count * 15);

  -- Combine scores with weights
  -- Impact (40%) > Engagement (30%) > Quality (20%) + Time decay boost
  v_score := (
    (v_engagement_score * 0.3) +
    (v_quality_score * 0.2) +
    (v_impact_score * 0.4) +
    (v_time_factor * 10)
  );

  -- Verification boost (20% increase)
  IF p_verified THEN
    v_score := v_score * 1.2;
  END IF;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_trending_score IS 'Calculates trending score using engagement (30%), quality (20%), impact (40%), and time decay';

-- Create materialized view for fast trending queries
-- Top 100 trending experiences cached for performance
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_experiences AS
SELECT
  id,
  company,
  role,
  outcome,
  difficulty,
  trending_score,
  upvotes,
  downvotes,
  views,
  citation_count,
  analysis_usage_count,
  created_at,
  verified,
  verified_email_domain,
  helpfulness_ratio,
  impact_score
FROM interview_experiences
WHERE deleted_at IS NULL
ORDER BY trending_score DESC
LIMIT 100;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_experiences_id
  ON trending_experiences(id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_trending_experiences()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW trending_experiences;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_trending_experiences IS 'Refreshes the trending_experiences materialized view';

-- Update trending scores for all existing experiences
UPDATE interview_experiences
SET
  trending_score = calculate_trending_score(
    upvotes,
    downvotes,
    views,
    citation_count,
    analysis_usage_count,
    created_at,
    verified
  ),
  trending_score_updated_at = NOW()
WHERE deleted_at IS NULL;

-- Refresh the materialized view with initial data
SELECT refresh_trending_experiences();

COMMENT ON COLUMN interview_experiences.trending_score IS 'Calculated trending score based on engagement, quality, impact, and time decay';
COMMENT ON COLUMN interview_experiences.trending_score_updated_at IS 'Timestamp of last trending score calculation';
COMMENT ON COLUMN interview_experiences.decay_factor IS 'Time decay factor for trending algorithm';
COMMENT ON MATERIALIZED VIEW trending_experiences IS 'Cached top 100 trending experiences for fast queries';
