-- Migration: Increase VARCHAR(50) to VARCHAR(100) for AI-populated fields
-- Prevents "value too long" errors when AI extracts long role names or levels
-- Date: 2025-11-11

-- ============================================================================
-- SAVE VIEW DEFINITIONS (Drop and recreate after ALTER)
-- ============================================================================

-- Save v_labeling_queue definition
CREATE OR REPLACE VIEW v_labeling_queue_temp AS
SELECT * FROM v_labeling_queue LIMIT 0;

-- Save v_interview_stats definition
CREATE OR REPLACE VIEW v_interview_stats_temp AS
SELECT * FROM v_interview_stats LIMIT 0;

-- Drop views temporarily
DROP VIEW IF EXISTS v_labeling_queue CASCADE;
DROP VIEW IF EXISTS v_interview_stats CASCADE;

-- ============================================================================
-- INCREASE VARCHAR LIMITS FOR AI-POPULATED FIELDS
-- ============================================================================

-- role_type: Can be long like "Senior Software Engineer - Machine Learning"
ALTER TABLE scraped_posts
  ALTER COLUMN role_type TYPE VARCHAR(100);

COMMENT ON COLUMN scraped_posts.role_type IS 'Job role/title extracted from post (max 100 chars)';

-- role_category: Broader role category
ALTER TABLE scraped_posts
  ALTER COLUMN role_category TYPE VARCHAR(100);

COMMENT ON COLUMN scraped_posts.role_category IS 'Role category (e.g., Engineering, Product) (max 100 chars)';

-- level_label: Experience level can be verbose
ALTER TABLE scraped_posts
  ALTER COLUMN level_label TYPE VARCHAR(100);

COMMENT ON COLUMN scraped_posts.level_label IS 'Experience level label (e.g., Senior, Staff) (max 100 chars)';

-- company_specific_level: Often long like "Staff Software Engineer Level 6"
ALTER TABLE scraped_posts
  ALTER COLUMN company_specific_level TYPE VARCHAR(100);

COMMENT ON COLUMN scraped_posts.company_specific_level IS 'Company-specific level designation (max 100 chars)';

-- interview_stage: Can be descriptive like "Final Round - System Design + Behavioral"
ALTER TABLE scraped_posts
  ALTER COLUMN interview_stage TYPE VARCHAR(100);

COMMENT ON COLUMN scraped_posts.interview_stage IS 'Interview stage/round description (max 100 chars)';

-- outcome_stage: Where in process outcome occurred
ALTER TABLE scraped_posts
  ALTER COLUMN outcome_stage TYPE VARCHAR(100);

COMMENT ON COLUMN scraped_posts.outcome_stage IS 'Stage where outcome occurred (max 100 chars)';

-- ============================================================================
-- KEEP SHORTER LIMITS FOR CONTROLLED FIELDS
-- ============================================================================

-- outcome: Should be short enum-like values ("passed", "failed", "pending", "unknown")
-- Keep at VARCHAR(50) - no change needed

-- primary_language: Programming language names are short ("Python", "JavaScript")
-- Keep at VARCHAR(50) - no change needed

-- source: Enum-like field ("reddit", "hackernews", "devto", "medium")
-- Keep at VARCHAR(50) - no change needed

COMMENT ON COLUMN scraped_posts.outcome IS 'Interview outcome: passed/failed/pending/unknown (max 50 chars)';
COMMENT ON COLUMN scraped_posts.primary_language IS 'Primary programming language (max 50 chars)';
COMMENT ON COLUMN scraped_posts.source IS 'Data source platform (max 50 chars)';

-- ============================================================================
-- RECREATE VIEWS WITH UPDATED COLUMN TYPES
-- ============================================================================

-- Recreate v_labeling_queue view
CREATE OR REPLACE VIEW v_labeling_queue AS
SELECT id, post_id, title, subreddit, potential_outcome, confidence_score,
       role_type, level, metadata ->> 'company' AS company,
       created_at, scraped_at
FROM scraped_posts
WHERE labeling_status = 'pending'
ORDER BY confidence_score DESC, scraped_at DESC;

-- Recreate v_interview_stats view
CREATE OR REPLACE VIEW v_interview_stats AS
SELECT role_type, level, interview_stage, outcome,
       count(*) AS count,
       avg(confidence_score) AS avg_confidence,
       min(created_at) AS oldest_post,
       max(created_at) AS newest_post
FROM scraped_posts
WHERE outcome IS NOT NULL
GROUP BY role_type, level, interview_stage, outcome;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

-- To revert this migration, run:
--
-- ALTER TABLE scraped_posts
--   ALTER COLUMN role_type TYPE VARCHAR(50);
--
-- ALTER TABLE scraped_posts
--   ALTER COLUMN role_category TYPE VARCHAR(50);
--
-- ALTER TABLE scraped_posts
--   ALTER COLUMN level_label TYPE VARCHAR(50);
--
-- ALTER TABLE scraped_posts
--   ALTER COLUMN company_specific_level TYPE VARCHAR(50);
--
-- ALTER TABLE scraped_posts
--   ALTER COLUMN interview_stage TYPE VARCHAR(50);
--
-- ALTER TABLE scraped_posts
--   ALTER COLUMN outcome_stage TYPE VARCHAR(50);
--
-- Note: This will fail if any existing data exceeds 50 characters
-- You would need to truncate data first:
-- UPDATE scraped_posts SET role_type = LEFT(role_type, 50) WHERE LENGTH(role_type) > 50;
