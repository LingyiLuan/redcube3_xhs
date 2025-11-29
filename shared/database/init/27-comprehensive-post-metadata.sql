-- Migration 27: Comprehensive Post Metadata for Learning Maps
-- Purpose: Add 20+ metadata fields to scraped_posts for database-first learning map generation
-- Strategy: Extract once per post, reuse data for all learning maps
-- Author: Learning Map Redesign v4.0
-- Date: 2025-01-23

-- =============================================================================
-- STRUGGLE/FAILURE ANALYSIS FIELDS
-- Critical for Knowledge Gaps section
-- =============================================================================

ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS areas_struggled JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS failed_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mistakes_made JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS skills_tested JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS weak_areas TEXT[] DEFAULT '{}';

-- =============================================================================
-- SUCCESS FACTORS FIELDS
-- Critical for recommendations and best practices
-- =============================================================================

ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS success_factors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS helpful_resources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS preparation_time_days INTEGER,
ADD COLUMN IF NOT EXISTS practice_problem_count INTEGER;

-- =============================================================================
-- INTERVIEW EXPERIENCE DETAILS
-- Rich context for timeline and expectations
-- =============================================================================

ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS interview_rounds INTEGER,
ADD COLUMN IF NOT EXISTS interview_duration_hours DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS interviewer_feedback TEXT[],
ADD COLUMN IF NOT EXISTS rejection_reasons TEXT[],
ADD COLUMN IF NOT EXISTS offer_details JSONB DEFAULT '{}'::jsonb;

-- =============================================================================
-- TEMPORAL/CONTEXTUAL DATA
-- For trend analysis and market insights
-- =============================================================================

ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS interview_date DATE,
ADD COLUMN IF NOT EXISTS job_market_conditions VARCHAR(50),
ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- =============================================================================
-- RESOURCE EFFECTIVENESS TRACKING
-- For curated resources section
-- =============================================================================

ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS resources_used JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS study_approach VARCHAR(100),
ADD COLUMN IF NOT EXISTS mock_interviews_count INTEGER,
ADD COLUMN IF NOT EXISTS study_schedule TEXT;

-- =============================================================================
-- OUTCOME CORRELATION FIELDS
-- For expected outcomes and success probability
-- =============================================================================

ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS prep_to_interview_gap_days INTEGER,
ADD COLUMN IF NOT EXISTS previous_interview_count INTEGER,
ADD COLUMN IF NOT EXISTS improvement_areas TEXT[];

-- =============================================================================
-- PERFORMANCE INDEXES
-- Optimize JSONB queries and aggregations
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_scraped_posts_areas_struggled ON scraped_posts USING GIN (areas_struggled);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_skills_tested ON scraped_posts USING GIN (skills_tested);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_success_factors ON scraped_posts USING GIN (success_factors);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_resources_used ON scraped_posts USING GIN (resources_used);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_failed_questions ON scraped_posts USING GIN (failed_questions);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_mistakes_made ON scraped_posts USING GIN (mistakes_made);

-- Standard column indexes
CREATE INDEX IF NOT EXISTS idx_scraped_posts_prep_time ON scraped_posts(preparation_time_days);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_interview_date ON scraped_posts(interview_date);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_interview_rounds ON scraped_posts(interview_rounds);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_location ON scraped_posts(location);

-- =============================================================================
-- COLUMN COMMENTS (Documentation)
-- =============================================================================

-- Struggle/Failure Analysis
COMMENT ON COLUMN scraped_posts.areas_struggled IS 'LLM-extracted array of specific areas where candidate struggled. Format: [{"area": "System Design", "severity": "high", "details": "...", "interview_stage": "..."}]';
COMMENT ON COLUMN scraped_posts.failed_questions IS 'LLM-extracted array of questions that candidate failed. Format: [{"question": "...", "type": "...", "difficulty": "...", "reason_failed": "...", "interview_stage": "..."}]';
COMMENT ON COLUMN scraped_posts.mistakes_made IS 'LLM-extracted array of mistakes and their impact. Format: [{"mistake": "...", "impact": "rejection/warning", "stage": "...", "lesson": "..."}]';
COMMENT ON COLUMN scraped_posts.skills_tested IS 'LLM-extracted array of technical skills tested with pass/fail status. Format: [{"skill": "Binary Search", "category": "...", "passed": false, "difficulty": "...", "notes": "..."}]';
COMMENT ON COLUMN scraped_posts.weak_areas IS 'LLM-extracted array of general weak areas (simplified version of areas_struggled)';

-- Success Factors
COMMENT ON COLUMN scraped_posts.success_factors IS 'LLM-extracted factors that contributed to success. Format: [{"factor": "Practiced 200 LC problems", "impact": "high", "category": "preparation"}]';
COMMENT ON COLUMN scraped_posts.helpful_resources IS 'LLM-extracted resources that helped (simplified version of resources_used)';
COMMENT ON COLUMN scraped_posts.preparation_time_days IS 'LLM-extracted: Number of days spent preparing for interview';
COMMENT ON COLUMN scraped_posts.practice_problem_count IS 'LLM-extracted: Number of practice problems solved during preparation';

-- Interview Experience Details
COMMENT ON COLUMN scraped_posts.interview_rounds IS 'LLM-extracted: Total number of interview rounds (e.g., 5)';
COMMENT ON COLUMN scraped_posts.interview_duration_hours IS 'LLM-extracted: Total interview duration in hours (e.g., 4.5)';
COMMENT ON COLUMN scraped_posts.interviewer_feedback IS 'LLM-extracted: Array of feedback quotes from interviewers';
COMMENT ON COLUMN scraped_posts.rejection_reasons IS 'LLM-extracted: Array of reasons for rejection if mentioned';
COMMENT ON COLUMN scraped_posts.offer_details IS 'LLM-extracted: Offer details if passed. Format: {"level": "L4", "tc": 250000, "team": "...", "location": "..."}';

-- Temporal/Contextual
COMMENT ON COLUMN scraped_posts.interview_date IS 'LLM-extracted: Date when interview occurred (not post date)';
COMMENT ON COLUMN scraped_posts.job_market_conditions IS 'LLM-extracted: Market conditions mentioned (e.g., "hiring freeze", "competitive")';
COMMENT ON COLUMN scraped_posts.location IS 'LLM-extracted: Office location or "remote"';

-- Resource Effectiveness
COMMENT ON COLUMN scraped_posts.resources_used IS 'LLM-extracted: Detailed breakdown of all prep materials. Format: [{"resource": "LeetCode Premium", "type": "platform", "duration_weeks": 8, "effectiveness": "high", "cost": "..."}]';
COMMENT ON COLUMN scraped_posts.study_approach IS 'LLM-extracted: Study strategy (e.g., "self-study", "bootcamp", "tutor")';
COMMENT ON COLUMN scraped_posts.mock_interviews_count IS 'LLM-extracted: Number of mock interviews practiced';
COMMENT ON COLUMN scraped_posts.study_schedule IS 'LLM-extracted: Study schedule description (e.g., "2 hours/day", "weekends only")';

-- Outcome Correlation
COMMENT ON COLUMN scraped_posts.prep_to_interview_gap_days IS 'LLM-extracted: Days between end of prep and interview date';
COMMENT ON COLUMN scraped_posts.previous_interview_count IS 'LLM-extracted: Number of times interviewed at this company before';
COMMENT ON COLUMN scraped_posts.improvement_areas IS 'LLM-extracted: What candidate wishes they had done differently';

-- =============================================================================
-- VERIFICATION QUERIES (Run after migration to verify)
-- =============================================================================

-- Check that all columns exist
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'scraped_posts'
-- AND column_name IN (
--   'areas_struggled', 'failed_questions', 'mistakes_made', 'skills_tested',
--   'success_factors', 'resources_used', 'preparation_time_days',
--   'interview_rounds', 'interview_date', 'location'
-- )
-- ORDER BY column_name;

-- Check indexes created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'scraped_posts'
-- AND indexname LIKE '%areas_struggled%'
--    OR indexname LIKE '%skills_tested%'
--    OR indexname LIKE '%success_factors%';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Total new fields added: 22
-- Total new indexes added: 10
-- Next steps:
-- 1. Update aiService.analyzeText() to extract these fields
-- 2. Update comprehensiveLLMBackfillService.js to save these fields
-- 3. Create aggregation functions in learningMapGeneratorService.js
