-- ============================================
-- Phase 20: Benchmark Cache Tables
-- ============================================
-- Purpose: Pre-compute expensive benchmark queries
-- for Role Intelligence and Stage Analysis sections
-- to avoid 504 timeouts during batch analysis
-- ============================================

-- Benchmark metadata table
-- Tracks when benchmark cache was last refreshed
CREATE TABLE IF NOT EXISTS benchmark_metadata (
  id SERIAL PRIMARY KEY,
  cache_type VARCHAR(100) NOT NULL UNIQUE,
  last_computed TIMESTAMP NOT NULL DEFAULT NOW(),
  total_posts_analyzed INTEGER NOT NULL DEFAULT 0,
  computation_duration_ms INTEGER, -- How long the computation took
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE benchmark_metadata IS 'Tracks benchmark cache freshness and statistics';

-- Benchmark: Role Intelligence
-- Stores pre-computed role statistics from ALL relevant posts
CREATE TABLE IF NOT EXISTS benchmark_role_intelligence (
  id SERIAL PRIMARY KEY,
  role_type VARCHAR(255) NOT NULL UNIQUE,
  total_posts INTEGER NOT NULL,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(5,2), -- Percentage
  top_skills JSONB, -- Array of {skill, count, percentage}
  avg_salary_range VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE benchmark_role_intelligence IS 'Pre-computed role statistics from all relevant posts';
CREATE INDEX idx_benchmark_role_type ON benchmark_role_intelligence(role_type);
CREATE INDEX idx_benchmark_role_total_posts ON benchmark_role_intelligence(total_posts DESC);

-- Benchmark: Interview Stage Success Rates
-- Stores pre-computed stage success rates by company
CREATE TABLE IF NOT EXISTS benchmark_stage_success (
  id SERIAL PRIMARY KEY,
  company VARCHAR(255) NOT NULL,
  interview_stage VARCHAR(255) NOT NULL,
  total_posts INTEGER NOT NULL,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(5,2), -- Percentage
  avg_duration_days INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company, interview_stage)
);

COMMENT ON TABLE benchmark_stage_success IS 'Pre-computed interview stage success rates by company';
CREATE INDEX idx_benchmark_stage_company ON benchmark_stage_success(company);
CREATE INDEX idx_benchmark_stage_stage ON benchmark_stage_success(interview_stage);
CREATE INDEX idx_benchmark_stage_success_rate ON benchmark_stage_success(success_rate DESC);

-- Seed Post Tracking
-- Tracks which companies/roles come from user's seed posts
-- This enables highlighting in benchmark data
CREATE TABLE IF NOT EXISTS seed_post_markers (
  id SERIAL PRIMARY KEY,
  batch_id VARCHAR(255), -- Links to specific batch analysis
  entity_type VARCHAR(50) NOT NULL, -- 'company' or 'role'
  entity_value VARCHAR(255) NOT NULL, -- 'Google' or 'Software Engineer'
  seed_post_count INTEGER NOT NULL DEFAULT 1, -- How many seed posts mention this entity
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(batch_id, entity_type, entity_value)
);

COMMENT ON TABLE seed_post_markers IS 'Tracks companies/roles from seed posts for highlighting';
CREATE INDEX idx_seed_markers_batch ON seed_post_markers(batch_id);
CREATE INDEX idx_seed_markers_entity ON seed_post_markers(entity_type, entity_value);

-- Insert initial metadata records
INSERT INTO benchmark_metadata (cache_type, last_computed, total_posts_analyzed)
VALUES
  ('role_intelligence', NOW(), 0),
  ('stage_success', NOW(), 0)
ON CONFLICT (cache_type) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON benchmark_metadata TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON benchmark_role_intelligence TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON benchmark_stage_success TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON seed_post_markers TO postgres;
GRANT USAGE, SELECT ON SEQUENCE benchmark_metadata_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE benchmark_role_intelligence_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE benchmark_stage_success_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE seed_post_markers_id_seq TO postgres;
