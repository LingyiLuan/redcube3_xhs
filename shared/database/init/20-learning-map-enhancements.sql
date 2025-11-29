-- =====================================================
-- Phase 6: Learning Map Enhancements
-- Migration for Learning Map Redesign - Data-Driven Preparation Plans
-- =====================================================

-- 1. Add new fields to scraped_posts for resource tracking
ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS resources_used JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS interview_date DATE,
ADD COLUMN IF NOT EXISTS study_hours_per_week INTEGER;

-- Add comments for new fields
COMMENT ON COLUMN scraped_posts.resources_used IS 'Array of resources mentioned by the candidate (e.g., [{name: "LeetCode", type: "platform"}, {name: "CTCI", type: "book"}])';
COMMENT ON COLUMN scraped_posts.interview_date IS 'Date when the interview took place (extracted from post)';
COMMENT ON COLUMN scraped_posts.study_hours_per_week IS 'How many hours per week the candidate studied (extracted from post)';

-- 2. Create learning_map_resources table for resource intelligence
CREATE TABLE IF NOT EXISTS learning_map_resources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL, -- 'book', 'course', 'platform', 'website', 'video', 'tool'
  url TEXT,
  mention_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2), -- % of successful candidates who mentioned this resource
  avg_usefulness_rating DECIMAL(3,2), -- if available from posts
  skills TEXT[] DEFAULT '{}', -- which skills this resource helps with
  companies TEXT[] DEFAULT '{}', -- which companies this resource is mentioned for
  roles TEXT[] DEFAULT '{}', -- which roles this resource is mentioned for
  difficulty_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
  source_posts JSONB DEFAULT '[]'::jsonb, -- array of {post_id, company, outcome}
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- additional metadata (author, publication year, etc.)
);

-- Index for resource lookups
CREATE INDEX IF NOT EXISTS idx_learning_resources_name ON learning_map_resources(name);
CREATE INDEX IF NOT EXISTS idx_learning_resources_type ON learning_map_resources(type);
CREATE INDEX IF NOT EXISTS idx_learning_resources_success_rate ON learning_map_resources(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_learning_resources_skills ON learning_map_resources USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_learning_resources_companies ON learning_map_resources USING GIN(companies);

-- 3. Create learning_map_generation_cache table for caching generated plans
CREATE TABLE IF NOT EXISTS learning_map_generation_cache (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES batch_analyses(id) ON DELETE CASCADE,
  target_company VARCHAR(255),
  target_role VARCHAR(255),
  timeline_weeks INTEGER,
  user_experience_level VARCHAR(50),
  generated_plan JSONB NOT NULL,
  source_data_hash VARCHAR(64) NOT NULL, -- hash of input data to detect when regeneration is needed
  generated_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_learning_map_cache_batch ON learning_map_generation_cache(batch_id);
CREATE INDEX IF NOT EXISTS idx_learning_map_cache_company ON learning_map_generation_cache(target_company);
CREATE INDEX IF NOT EXISTS idx_learning_map_cache_hash ON learning_map_generation_cache(source_data_hash);

-- 4. Create interview_question_metadata table for enhanced question intelligence
CREATE TABLE IF NOT EXISTS interview_question_metadata (
  question_id INTEGER PRIMARY KEY REFERENCES interview_questions(id) ON DELETE CASCADE,
  leetcode_number INTEGER,
  leetcode_title VARCHAR(255),
  leetcode_difficulty VARCHAR(20), -- 'Easy', 'Medium', 'Hard'
  leetcode_url TEXT,
  hackerrank_url TEXT,
  similar_questions JSONB DEFAULT '[]'::jsonb, -- array of related question IDs
  topic_tags TEXT[] DEFAULT '{}', -- ['Arrays', 'Dynamic Programming', etc.]
  company_frequency JSONB DEFAULT '{}'::jsonb, -- {company_name: frequency_count}
  success_patterns JSONB DEFAULT '{}'::jsonb, -- patterns from successful candidates
  common_mistakes JSONB DEFAULT '[]'::jsonb, -- array of common pitfalls
  preparation_resources JSONB DEFAULT '[]'::jsonb, -- recommended resources for this question
  last_updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for question metadata lookups
CREATE INDEX IF NOT EXISTS idx_question_metadata_leetcode ON interview_question_metadata(leetcode_number);
CREATE INDEX IF NOT EXISTS idx_question_metadata_difficulty ON interview_question_metadata(leetcode_difficulty);
CREATE INDEX IF NOT EXISTS idx_question_metadata_tags ON interview_question_metadata USING GIN(topic_tags);

-- 5. Add indexes for learning map queries on existing tables
CREATE INDEX IF NOT EXISTS idx_scraped_posts_outcome ON scraped_posts(outcome) WHERE is_relevant = true;
CREATE INDEX IF NOT EXISTS idx_scraped_posts_interview_date ON scraped_posts(interview_date) WHERE is_relevant = true;
CREATE INDEX IF NOT EXISTS idx_interview_questions_company ON interview_questions(company_extracted);

-- 6. Create view for learning map analytics
CREATE OR REPLACE VIEW learning_map_analytics AS
SELECT
  sp.company,
  sp.role,
  sp.outcome,
  COUNT(DISTINCT sp.id) as post_count,
  COUNT(DISTINCT iq.id) as question_count,
  AVG(sp.prep_duration_weeks) as avg_prep_weeks,
  AVG(sp.study_hours_per_week) as avg_study_hours,
  ROUND(AVG(sp.sentiment_score), 2) as avg_sentiment,
  JSONB_AGG(DISTINCT sp.resources_used) FILTER (WHERE sp.resources_used IS NOT NULL AND sp.resources_used != '[]'::jsonb) as all_resources,
  ARRAY_AGG(DISTINCT sp.tech_stack) FILTER (WHERE sp.tech_stack IS NOT NULL) as all_tech_stacks
FROM scraped_posts sp
LEFT JOIN interview_questions iq ON iq.post_id = sp.id
WHERE sp.is_relevant = true
GROUP BY sp.company, sp.role, sp.outcome;

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE ON learning_map_resources TO postgres;
GRANT SELECT, INSERT, UPDATE ON learning_map_generation_cache TO postgres;
GRANT SELECT, INSERT, UPDATE ON interview_question_metadata TO postgres;
GRANT SELECT ON learning_map_analytics TO postgres;
GRANT USAGE, SELECT ON SEQUENCE learning_map_resources_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE learning_map_generation_cache_id_seq TO postgres;

-- Migration complete
SELECT 'Learning Map Enhancement Migration Completed' as status;
