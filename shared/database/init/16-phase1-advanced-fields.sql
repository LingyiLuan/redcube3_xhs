-- Migration: Add Phase 1 Advanced Analytics Fields
-- High-impact fields for prediction models and advanced analysis

-- ============================================================================
-- PREPARATION & EXPERIENCE METRICS
-- ============================================================================

ALTER TABLE scraped_posts
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
  ADD COLUMN IF NOT EXISTS prep_duration_weeks INTEGER,
  ADD COLUMN IF NOT EXISTS leetcode_problems_solved INTEGER,
  ADD COLUMN IF NOT EXISTS mock_interviews_count INTEGER,
  ADD COLUMN IF NOT EXISTS prior_interview_attempts INTEGER;

-- ============================================================================
-- INTERVIEW PERFORMANCE METRICS
-- ============================================================================

ALTER TABLE scraped_posts
  ADD COLUMN IF NOT EXISTS rounds_passed INTEGER,
  ADD COLUMN IF NOT EXISTS total_rounds INTEGER,
  ADD COLUMN IF NOT EXISTS coding_difficulty VARCHAR(20),
  ADD COLUMN IF NOT EXISTS system_design_difficulty VARCHAR(20);

-- ============================================================================
-- INTERVIEWER SIGNALS & ENGAGEMENT
-- ============================================================================

ALTER TABLE scraped_posts
  ADD COLUMN IF NOT EXISTS positive_interviewer_signals TEXT[],
  ADD COLUMN IF NOT EXISTS negative_interviewer_signals TEXT[],
  ADD COLUMN IF NOT EXISTS interviewer_engagement VARCHAR(20),
  ADD COLUMN IF NOT EXISTS received_hints BOOLEAN;

-- ============================================================================
-- COMPENSATION & REFERRAL DATA
-- ============================================================================

ALTER TABLE scraped_posts
  ADD COLUMN IF NOT EXISTS base_salary INTEGER,
  ADD COLUMN IF NOT EXISTS total_compensation INTEGER,
  ADD COLUMN IF NOT EXISTS is_referral BOOLEAN,
  ADD COLUMN IF NOT EXISTS has_competing_offers BOOLEAN;

-- ============================================================================
-- UNIFIED BACKFILL TRACKING
-- ============================================================================

-- Rename metadata_analyzed_at to backfill_analyzed_at (unified tracking)
ALTER TABLE scraped_posts
  RENAME COLUMN metadata_analyzed_at TO backfill_analyzed_at;

-- ============================================================================
-- INDEXES FOR ANALYTICS QUERIES
-- ============================================================================

-- Index for experience-based queries
CREATE INDEX IF NOT EXISTS idx_experience_outcome
  ON scraped_posts(years_of_experience, outcome)
  WHERE years_of_experience IS NOT NULL;

-- Index for preparation correlation analysis
CREATE INDEX IF NOT EXISTS idx_prep_metrics
  ON scraped_posts(prep_duration_weeks, leetcode_problems_solved, outcome)
  WHERE prep_duration_weeks IS NOT NULL;

-- Index for interview performance analysis
CREATE INDEX IF NOT EXISTS idx_interview_performance
  ON scraped_posts(rounds_passed, total_rounds, outcome)
  WHERE total_rounds IS NOT NULL;

-- Index for compensation analysis
CREATE INDEX IF NOT EXISTS idx_compensation
  ON scraped_posts((metadata->>'company'), level, base_salary)
  WHERE base_salary IS NOT NULL;

-- Index for referral impact analysis
CREATE INDEX IF NOT EXISTS idx_referral_success
  ON scraped_posts(is_referral, outcome)
  WHERE is_referral IS NOT NULL;

-- Composite index for backfill queue (unified)
CREATE INDEX IF NOT EXISTS idx_comprehensive_backfill_queue
  ON scraped_posts((metadata->>'company'), backfill_analyzed_at, created_at DESC)
  WHERE is_relevant = true
    AND backfill_analyzed_at IS NULL;

-- ============================================================================
-- CONSTRAINTS & VALIDATION
-- ============================================================================

-- Add check constraints for valid difficulty levels
ALTER TABLE scraped_posts
  ADD CONSTRAINT check_coding_difficulty
    CHECK (coding_difficulty IN ('easy', 'medium', 'hard') OR coding_difficulty IS NULL);

ALTER TABLE scraped_posts
  ADD CONSTRAINT check_system_design_difficulty
    CHECK (system_design_difficulty IN ('easy', 'medium', 'hard') OR system_design_difficulty IS NULL);

ALTER TABLE scraped_posts
  ADD CONSTRAINT check_interviewer_engagement
    CHECK (interviewer_engagement IN ('engaged', 'neutral', 'disengaged') OR interviewer_engagement IS NULL);

-- Ensure rounds_passed <= total_rounds
ALTER TABLE scraped_posts
  ADD CONSTRAINT check_rounds_logic
    CHECK (rounds_passed IS NULL OR total_rounds IS NULL OR rounds_passed <= total_rounds);

-- Ensure reasonable values
ALTER TABLE scraped_posts
  ADD CONSTRAINT check_years_experience_range
    CHECK (years_of_experience IS NULL OR (years_of_experience >= 0 AND years_of_experience <= 50));

ALTER TABLE scraped_posts
  ADD CONSTRAINT check_prep_duration_range
    CHECK (prep_duration_weeks IS NULL OR (prep_duration_weeks >= 0 AND prep_duration_weeks <= 104));

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN scraped_posts.years_of_experience IS 'Candidate years of professional experience';
COMMENT ON COLUMN scraped_posts.prep_duration_weeks IS 'Interview preparation duration in weeks';
COMMENT ON COLUMN scraped_posts.leetcode_problems_solved IS 'Number of LeetCode problems solved';
COMMENT ON COLUMN scraped_posts.mock_interviews_count IS 'Number of mock interviews practiced';
COMMENT ON COLUMN scraped_posts.prior_interview_attempts IS 'Number of previous interview attempts at same company';

COMMENT ON COLUMN scraped_posts.rounds_passed IS 'Number of interview rounds passed';
COMMENT ON COLUMN scraped_posts.total_rounds IS 'Total number of interview rounds';
COMMENT ON COLUMN scraped_posts.coding_difficulty IS 'Self-reported coding round difficulty';
COMMENT ON COLUMN scraped_posts.system_design_difficulty IS 'Self-reported system design round difficulty';

COMMENT ON COLUMN scraped_posts.positive_interviewer_signals IS 'Positive signals from interviewer behavior';
COMMENT ON COLUMN scraped_posts.negative_interviewer_signals IS 'Negative signals from interviewer behavior';
COMMENT ON COLUMN scraped_posts.interviewer_engagement IS 'Overall interviewer engagement level';
COMMENT ON COLUMN scraped_posts.received_hints IS 'Whether candidate received hints during interview';

COMMENT ON COLUMN scraped_posts.base_salary IS 'Base salary offered (USD)';
COMMENT ON COLUMN scraped_posts.total_compensation IS 'Total compensation including equity and bonuses (USD)';
COMMENT ON COLUMN scraped_posts.is_referral IS 'Whether candidate applied through referral';
COMMENT ON COLUMN scraped_posts.has_competing_offers IS 'Whether candidate had competing offers';

COMMENT ON COLUMN scraped_posts.backfill_analyzed_at IS 'Timestamp of comprehensive backfill analysis (metadata + sentiment + Phase 1)';
