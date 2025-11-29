-- Create table to track backfill progress for Reddit scraping
-- This allows us to systematically scrape ALL posts from past year

CREATE TABLE IF NOT EXISTS scraping_backfill_progress (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,           -- 'reddit', 'devto', etc.
  source_identifier VARCHAR(100) NOT NULL, -- subreddit name, tag name, etc.

  -- Time window being scraped
  current_position_timestamp BIGINT,     -- Unix timestamp (Reddit uses this)
  end_timestamp BIGINT NOT NULL,         -- When to stop (e.g., 1 year ago)

  -- Progress tracking
  posts_scraped_total INTEGER DEFAULT 0,
  posts_saved_total INTEGER DEFAULT 0,
  last_post_id VARCHAR(100),             -- For pagination

  -- Status
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'paused'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  last_run_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(source, source_identifier)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_backfill_status ON scraping_backfill_progress(status);
CREATE INDEX IF NOT EXISTS idx_backfill_source ON scraping_backfill_progress(source, source_identifier);

-- Comments
COMMENT ON TABLE scraping_backfill_progress IS 'Tracks progress of backfill scraping to get ALL historical posts';
COMMENT ON COLUMN scraping_backfill_progress.current_position_timestamp IS 'Current position in time (going backwards)';
COMMENT ON COLUMN scraping_backfill_progress.end_timestamp IS 'Stop scraping when reaching this timestamp';
