-- Migration 34: Usage Tracking for Tier-based Rate Limiting
-- Creates experience_analysis_history table to track user analysis usage

CREATE TABLE IF NOT EXISTS experience_analysis_history (
    id SERIAL PRIMARY KEY,
    experience_id INTEGER REFERENCES interview_experiences(id) ON DELETE SET NULL,
    analyzed_by_user_id INTEGER NOT NULL,  -- References users table in user-service (can't use FK across databases)
    workflow_id VARCHAR(255),
    analysis_type VARCHAR(50) NOT NULL,  -- 'single_analysis', 'batch_analysis', 'learning_map'
    analyzed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_user_date ON experience_analysis_history(analyzed_by_user_id, analyzed_at);
CREATE INDEX IF NOT EXISTS idx_analysis_type ON experience_analysis_history(analysis_type);
CREATE INDEX IF NOT EXISTS idx_analysis_date ON experience_analysis_history(analyzed_at);

-- Add comment
COMMENT ON TABLE experience_analysis_history IS 'Tracks user analysis usage for tier-based rate limiting';
