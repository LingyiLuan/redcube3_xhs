-- Migration 31: Citation Tracking for Interview Experiences
-- This migration adds citation tracking to measure how often experiences are used as seed posts in analyses

-- Add citation tracking columns to interview_experiences table
ALTER TABLE interview_experiences
ADD COLUMN IF NOT EXISTS analysis_usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP;

-- Create experience_analysis_history table to track detailed usage history
CREATE TABLE IF NOT EXISTS experience_analysis_history (
  id SERIAL PRIMARY KEY,
  experience_id INTEGER NOT NULL REFERENCES interview_experiences(id) ON DELETE CASCADE,
  analyzed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  workflow_id VARCHAR(255),
  analysis_type VARCHAR(100),
  analyzed_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_experience_analysis_history_experience_id
  ON experience_analysis_history(experience_id);

CREATE INDEX IF NOT EXISTS idx_experience_analysis_history_user_id
  ON experience_analysis_history(analyzed_by_user_id);

CREATE INDEX IF NOT EXISTS idx_experience_analysis_history_analyzed_at
  ON experience_analysis_history(analyzed_at);

-- Create index on interview_experiences for sorting by citation count
CREATE INDEX IF NOT EXISTS idx_interview_experiences_analysis_usage_count
  ON interview_experiences(analysis_usage_count DESC);

-- Add comment for documentation
COMMENT ON TABLE experience_analysis_history IS 'Tracks when and how interview experiences are used in workflow analyses';
COMMENT ON COLUMN interview_experiences.analysis_usage_count IS 'Number of times this experience has been used as a seed post in analyses';
COMMENT ON COLUMN interview_experiences.last_analyzed_at IS 'Timestamp of the most recent analysis using this experience';
