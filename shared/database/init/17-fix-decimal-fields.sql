-- Migration: Fix Decimal Values in Integer Fields
-- Changes INTEGER to NUMERIC for fields that naturally have decimal values
-- Date: 2025-11-11

-- ============================================================================
-- CHANGE INTEGER TO NUMERIC FOR EXPERIENCE FIELDS
-- ============================================================================

-- years_of_experience: People often say "2.5 years experience", "3.5 years", etc.
-- This is a valid representation and should be stored accurately
ALTER TABLE scraped_posts
  ALTER COLUMN years_of_experience TYPE NUMERIC(4,1);

COMMENT ON COLUMN scraped_posts.years_of_experience IS 'Candidate years of professional experience (allows decimals like 2.5)';

-- prep_duration_weeks: People may prep for "1.5 weeks", "2.5 weeks"
ALTER TABLE scraped_posts
  ALTER COLUMN prep_duration_weeks TYPE NUMERIC(5,1);

COMMENT ON COLUMN scraped_posts.prep_duration_weeks IS 'Interview preparation duration in weeks (allows decimals like 1.5)';

-- ============================================================================
-- UPDATE CONSTRAINTS TO MATCH NEW TYPES
-- ============================================================================

-- Drop old integer-based constraints
ALTER TABLE scraped_posts
  DROP CONSTRAINT IF EXISTS check_years_experience_range;

ALTER TABLE scraped_posts
  DROP CONSTRAINT IF EXISTS check_prep_duration_range;

-- Add new constraints for NUMERIC types
ALTER TABLE scraped_posts
  ADD CONSTRAINT check_years_experience_range
    CHECK (years_of_experience IS NULL OR (years_of_experience >= 0 AND years_of_experience <= 50.0));

ALTER TABLE scraped_posts
  ADD CONSTRAINT check_prep_duration_range
    CHECK (prep_duration_weeks IS NULL OR (prep_duration_weeks >= 0 AND prep_duration_weeks <= 104.0));

-- ============================================================================
-- KEEP OTHER FIELDS AS INTEGER (whole numbers make sense)
-- ============================================================================

-- leetcode_problems_solved: Always whole numbers (can't solve 2.5 problems)
-- mock_interviews_count: Always whole numbers (can't do 3.5 interviews)
-- prior_interview_attempts: Always whole numbers (can't attempt 1.5 times)

COMMENT ON COLUMN scraped_posts.leetcode_problems_solved IS 'Number of LeetCode problems solved (integer only)';
COMMENT ON COLUMN scraped_posts.mock_interviews_count IS 'Number of mock interviews practiced (integer only)';
COMMENT ON COLUMN scraped_posts.prior_interview_attempts IS 'Number of previous interview attempts at same company (integer only)';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

-- To revert this migration, run:
--
-- ALTER TABLE scraped_posts
--   ALTER COLUMN years_of_experience TYPE INTEGER USING ROUND(years_of_experience);
--
-- ALTER TABLE scraped_posts
--   ALTER COLUMN prep_duration_weeks TYPE INTEGER USING ROUND(prep_duration_weeks);
--
-- Note: This will round existing decimal values and lose precision
