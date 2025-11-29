-- Phase 5.1: Enhanced Metadata for Comprehensive Job Hunting Data
-- Adds role types, levels, interview stages, and deep metadata extraction

-- ============================================
-- 1. Add Enhanced Metadata Columns
-- ============================================

ALTER TABLE scraped_posts
  -- Role Information
  ADD COLUMN IF NOT EXISTS role_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS role_full_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS role_category VARCHAR(50),

  -- Level/Seniority Information
  ADD COLUMN IF NOT EXISTS level VARCHAR(10),
  ADD COLUMN IF NOT EXISTS level_label VARCHAR(50),
  ADD COLUMN IF NOT EXISTS experience_years INTEGER,
  ADD COLUMN IF NOT EXISTS company_specific_level VARCHAR(50),

  -- Interview Details
  ADD COLUMN IF NOT EXISTS interview_stage VARCHAR(50),
  ADD COLUMN IF NOT EXISTS interview_round INTEGER,
  ADD COLUMN IF NOT EXISTS outcome VARCHAR(50),
  ADD COLUMN IF NOT EXISTS outcome_stage VARCHAR(50),

  -- Tech Stack (enhanced from basic metadata)
  ADD COLUMN IF NOT EXISTS tech_stack TEXT[],
  ADD COLUMN IF NOT EXISTS primary_language VARCHAR(50),
  ADD COLUMN IF NOT EXISTS frameworks TEXT[],
  ADD COLUMN IF NOT EXISTS tools TEXT[],

  -- Interview Topics (detailed breakdown)
  ADD COLUMN IF NOT EXISTS interview_topics JSONB DEFAULT '{}'::jsonb,

  -- Preparation Details
  ADD COLUMN IF NOT EXISTS preparation JSONB DEFAULT '{}'::jsonb,

  -- Compensation (if mentioned)
  ADD COLUMN IF NOT EXISTS compensation JSONB DEFAULT '{}'::jsonb,

  -- Location
  ADD COLUMN IF NOT EXISTS location JSONB DEFAULT '{}'::jsonb,

  -- Timeline
  ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '{}'::jsonb,

  -- Comments (for deep scraping)
  ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,

  -- Labeling (for human verification)
  ADD COLUMN IF NOT EXISTS labeling_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_outcome VARCHAR(20),
  ADD COLUMN IF NOT EXISTS labeled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS labeled_by INTEGER;

-- ============================================
-- 2. Create Performance Indexes
-- ============================================

-- Single-column indexes for common filters
CREATE INDEX IF NOT EXISTS idx_scraped_posts_role_type ON scraped_posts(role_type);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_level ON scraped_posts(level);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_role_category ON scraped_posts(role_category);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_interview_stage ON scraped_posts(interview_stage);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_outcome ON scraped_posts(outcome);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_labeling_status ON scraped_posts(labeling_status);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_experience ON scraped_posts(experience_years);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_scraped_posts_role_level ON scraped_posts(role_type, level);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_company_role ON scraped_posts((metadata->>'company'), role_type);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_stage_outcome ON scraped_posts(interview_stage, outcome);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_level_outcome ON scraped_posts(level, outcome);

-- GIN indexes for JSONB fields (efficient JSONB queries)
CREATE INDEX IF NOT EXISTS idx_scraped_posts_interview_topics ON scraped_posts USING GIN(interview_topics);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_preparation ON scraped_posts USING GIN(preparation);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_compensation ON scraped_posts USING GIN(compensation);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_location_gin ON scraped_posts USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_timeline ON scraped_posts USING GIN(timeline);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_comments ON scraped_posts USING GIN(comments);

-- Array indexes for tech stack
CREATE INDEX IF NOT EXISTS idx_scraped_posts_tech_stack ON scraped_posts USING GIN(tech_stack);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_frameworks ON scraped_posts USING GIN(frameworks);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_tools ON scraped_posts USING GIN(tools);

-- ============================================
-- 3. Create Lookup/Reference Tables
-- ============================================

-- Role Types Lookup
CREATE TABLE IF NOT EXISTS role_types (
  id SERIAL PRIMARY KEY,
  role_code VARCHAR(50) UNIQUE NOT NULL,
  role_name VARCHAR(200) NOT NULL,
  role_category VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert standard role types
INSERT INTO role_types (role_code, role_name, role_category, description) VALUES
  -- Engineering
  ('SWE', 'Software Engineer', 'Engineering', 'General software engineering role'),
  ('SDE', 'Software Development Engineer', 'Engineering', 'Amazon terminology for SWE'),
  ('Frontend', 'Frontend Engineer', 'Engineering', 'Client-side web development'),
  ('Backend', 'Backend Engineer', 'Engineering', 'Server-side development'),
  ('Fullstack', 'Full Stack Engineer', 'Engineering', 'Both frontend and backend'),
  ('Mobile', 'Mobile Engineer', 'Engineering', 'iOS/Android development'),

  -- ML/AI
  ('MLE', 'Machine Learning Engineer', 'ML/AI', 'ML infrastructure and deployment'),
  ('MLES', 'ML Engineer, Systems', 'ML/AI', 'ML systems engineering'),
  ('Research', 'Research Scientist', 'ML/AI', 'ML/AI research'),
  ('Applied Scientist', 'Applied Scientist', 'ML/AI', 'Applied ML research (Amazon term)'),
  ('LLM Engineer', 'Large Language Model Engineer', 'ML/AI', 'Specializes in LLMs'),
  ('Prompt Engineer', 'Prompt Engineer', 'ML/AI', 'LLM prompt optimization'),

  -- Data
  ('Data Engineer', 'Data Engineer', 'Data', 'Data pipelines and infrastructure'),
  ('Data Scientist', 'Data Scientist', 'Data', 'Data analysis and ML modeling'),
  ('Analytics Engineer', 'Analytics Engineer', 'Data', 'SQL and BI tools'),
  ('BI Engineer', 'Business Intelligence Engineer', 'Data', 'Business analytics'),

  -- Infrastructure
  ('DevOps', 'DevOps Engineer', 'Infrastructure', 'CI/CD and operations'),
  ('SRE', 'Site Reliability Engineer', 'Infrastructure', 'Production reliability'),
  ('Infrastructure', 'Infrastructure Engineer', 'Infrastructure', 'Cloud infrastructure'),
  ('Cloud Engineer', 'Cloud Engineer', 'Infrastructure', 'Cloud platform specialist'),

  -- Product & Design
  ('PM', 'Product Manager', 'Product', 'Product strategy and roadmap'),
  ('TPM', 'Technical Program Manager', 'Product', 'Cross-team technical coordination'),
  ('Designer', 'Product Designer', 'Design', 'UI/UX design'),
  ('UX', 'UX Designer', 'Design', 'User experience design'),

  -- Leadership
  ('EM', 'Engineering Manager', 'Leadership', 'People and team management'),
  ('TL', 'Tech Lead', 'Leadership', 'Technical leadership'),
  ('Staff+', 'Staff+ Engineer', 'Leadership', 'Senior IC leadership')
ON CONFLICT (role_code) DO NOTHING;

-- Level Mappings Lookup
CREATE TABLE IF NOT EXISTS level_mappings (
  id SERIAL PRIMARY KEY,
  standard_level VARCHAR(10) NOT NULL,
  level_label VARCHAR(50) NOT NULL,
  experience_years_min INTEGER,
  experience_years_max INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert standard levels
INSERT INTO level_mappings (standard_level, level_label, experience_years_min, experience_years_max, description) VALUES
  ('L1', 'Entry Level', 0, 0, 'Entry level position'),
  ('L2', 'Junior', 0, 1, 'Junior engineer with 0-1 years experience'),
  ('L3', 'Mid-Level', 1, 3, 'Mid-level engineer, often new grad'),
  ('L4', 'Senior', 3, 5, 'Senior engineer with proven track record'),
  ('L5', 'Staff', 5, 8, 'Staff engineer, technical leadership'),
  ('L6', 'Senior Staff', 8, 12, 'Senior staff, organization-wide impact'),
  ('L7', 'Principal', 12, 15, 'Principal engineer, strategy level'),
  ('L8', 'Distinguished', 15, NULL, 'Distinguished engineer, company-wide influence')
ON CONFLICT DO NOTHING;

-- Company-Specific Level Mappings
CREATE TABLE IF NOT EXISTS company_level_mappings (
  id SERIAL PRIMARY KEY,
  company VARCHAR(100) NOT NULL,
  standard_level VARCHAR(10) NOT NULL,
  company_level_code VARCHAR(50) NOT NULL,
  company_level_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company, standard_level)
);

-- Insert company-specific mappings
INSERT INTO company_level_mappings (company, standard_level, company_level_code, company_level_name) VALUES
  -- Google
  ('Google', 'L3', 'L3', 'Software Engineer I'),
  ('Google', 'L4', 'L4', 'Software Engineer II'),
  ('Google', 'L5', 'L5', 'Software Engineer III (Senior)'),
  ('Google', 'L6', 'L6', 'Staff Software Engineer'),
  ('Google', 'L7', 'L7', 'Senior Staff Software Engineer'),
  ('Google', 'L8', 'L8', 'Principal Software Engineer'),

  -- Amazon
  ('Amazon', 'L3', 'SDE 1', 'Software Development Engineer 1'),
  ('Amazon', 'L4', 'SDE 2', 'Software Development Engineer 2'),
  ('Amazon', 'L5', 'SDE 3', 'Software Development Engineer 3'),
  ('Amazon', 'L6', 'Principal', 'Principal Engineer'),
  ('Amazon', 'L7', 'Senior Principal', 'Senior Principal Engineer'),
  ('Amazon', 'L8', 'Distinguished', 'Distinguished Engineer'),

  -- Meta
  ('Meta', 'L3', 'E3', 'Software Engineer E3'),
  ('Meta', 'L4', 'E4', 'Software Engineer E4'),
  ('Meta', 'L5', 'E5', 'Software Engineer E5'),
  ('Meta', 'L6', 'E6', 'Software Engineer E6'),
  ('Meta', 'L7', 'E7', 'Software Engineer E7'),
  ('Meta', 'L8', 'E8', 'Software Engineer E8'),

  -- Microsoft
  ('Microsoft', 'L3', '59/60', 'Software Engineer 59/60'),
  ('Microsoft', 'L4', '61/62', 'Senior Software Engineer 61/62'),
  ('Microsoft', 'L5', '63/64', 'Principal Software Engineer 63/64'),
  ('Microsoft', 'L6', '65/66', 'Partner Software Engineer 65/66'),
  ('Microsoft', 'L7', '67', 'Partner Software Engineer 67'),
  ('Microsoft', 'L8', '68+', 'Technical Fellow 68+'),

  -- Apple
  ('Apple', 'L3', 'ICT2', 'Software Engineer ICT2'),
  ('Apple', 'L4', 'ICT3', 'Software Engineer ICT3'),
  ('Apple', 'L5', 'ICT4', 'Senior Software Engineer ICT4'),
  ('Apple', 'L6', 'ICT5', 'Staff Software Engineer ICT5'),
  ('Apple', 'L7', 'ICT6', 'Principal Software Engineer ICT6'),
  ('Apple', 'L8', 'ICT7', 'Distinguished Engineer ICT7')
ON CONFLICT (company, standard_level) DO NOTHING;

-- ============================================
-- 4. Create Helper Views
-- ============================================

-- View: Posts with normalized levels and roles
CREATE OR REPLACE VIEW v_posts_normalized AS
SELECT
  p.*,
  rt.role_name,
  rt.role_category,
  lm.level_label,
  lm.experience_years_min,
  lm.experience_years_max,
  clm.company_level_name,
  clm.company_level_code
FROM scraped_posts p
LEFT JOIN role_types rt ON p.role_type = rt.role_code
LEFT JOIN level_mappings lm ON p.level = lm.standard_level
LEFT JOIN company_level_mappings clm ON p.level = clm.standard_level
  AND (p.metadata->>'company') = clm.company;

-- View: Labeling queue (pending posts)
CREATE OR REPLACE VIEW v_labeling_queue AS
SELECT
  id,
  post_id,
  title,
  subreddit,
  potential_outcome,
  confidence_score,
  role_type,
  level,
  metadata->>'company' as company,
  created_at,
  scraped_at
FROM scraped_posts
WHERE labeling_status = 'pending'
ORDER BY confidence_score DESC, scraped_at DESC;

-- View: Interview statistics by level and role
CREATE OR REPLACE VIEW v_interview_stats AS
SELECT
  role_type,
  level,
  interview_stage,
  outcome,
  COUNT(*) as count,
  AVG(confidence_score) as avg_confidence,
  MIN(created_at) as oldest_post,
  MAX(created_at) as newest_post
FROM scraped_posts
WHERE outcome IS NOT NULL
GROUP BY role_type, level, interview_stage, outcome;

-- ============================================
-- 5. Create Utility Functions
-- ============================================

-- Function: Normalize company-specific level to standard level
CREATE OR REPLACE FUNCTION normalize_level(
  company_name VARCHAR,
  company_level VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
  std_level VARCHAR;
BEGIN
  SELECT standard_level INTO std_level
  FROM company_level_mappings
  WHERE company = company_name
    AND company_level_code = company_level
  LIMIT 1;

  RETURN COALESCE(std_level, 'L3'); -- Default to L3 if not found
END;
$$ LANGUAGE plpgsql;

-- Function: Get experience range for a level
CREATE OR REPLACE FUNCTION get_level_experience(level_code VARCHAR)
RETURNS TABLE(min_years INTEGER, max_years INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT experience_years_min, experience_years_max
  FROM level_mappings
  WHERE standard_level = level_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Add Comments for Documentation
-- ============================================

COMMENT ON COLUMN scraped_posts.role_type IS 'Standardized role code (e.g., SWE, MLE, SDE)';
COMMENT ON COLUMN scraped_posts.level IS 'Standardized level (L1-L8)';
COMMENT ON COLUMN scraped_posts.interview_stage IS 'Stage where post is focused: phone_screen, coding, system_design, behavioral, onsite';
COMMENT ON COLUMN scraped_posts.outcome IS 'Interview outcome: passed, rejected, pending, offer, accepted, declined';
COMMENT ON COLUMN scraped_posts.interview_topics IS 'JSON object with detailed topics by category';
COMMENT ON COLUMN scraped_posts.preparation IS 'JSON object with preparation details (duration, resources, practice)';
COMMENT ON COLUMN scraped_posts.compensation IS 'JSON object with salary/TC information if mentioned';
COMMENT ON COLUMN scraped_posts.location IS 'JSON object with location details';
COMMENT ON COLUMN scraped_posts.comments IS 'Array of top comments from the Reddit post';
COMMENT ON COLUMN scraped_posts.labeling_status IS 'Labeling workflow status: pending, verified, skipped, irrelevant';

COMMENT ON TABLE role_types IS 'Standardized role type taxonomy with categories';
COMMENT ON TABLE level_mappings IS 'Standard level definitions (L1-L8) with experience ranges';
COMMENT ON TABLE company_level_mappings IS 'Company-specific level codes mapped to standard levels';

COMMENT ON VIEW v_posts_normalized IS 'Posts with joined role and level metadata for easy querying';
COMMENT ON VIEW v_labeling_queue IS 'Posts awaiting human labeling, ordered by confidence score';
COMMENT ON VIEW v_interview_stats IS 'Aggregated statistics by role, level, stage, and outcome';

-- ============================================
-- 7. Migration Complete
-- ============================================

-- Update existing posts with default labeling status
UPDATE scraped_posts
SET labeling_status = 'pending'
WHERE labeling_status IS NULL;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Phase 5.1 Enhanced Metadata Migration Completed';
  RAISE NOTICE 'Added % new columns to scraped_posts', 30;
  RAISE NOTICE 'Created 3 lookup tables: role_types, level_mappings, company_level_mappings';
  RAISE NOTICE 'Created 3 helper views for analytics and labeling';
  RAISE NOTICE 'Created 15+ indexes for performance optimization';
END $$;
