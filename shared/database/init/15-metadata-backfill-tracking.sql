-- Migration: Add metadata backfill tracking column
-- Tracks which posts have been processed for metadata extraction

-- Add metadata_analyzed_at column
ALTER TABLE scraped_posts
  ADD COLUMN IF NOT EXISTS metadata_analyzed_at TIMESTAMP;

-- Index for finding unanalyzed posts (for backfill queries)
CREATE INDEX IF NOT EXISTS idx_metadata_unanalyzed
  ON scraped_posts(metadata_analyzed_at)
  WHERE metadata_analyzed_at IS NULL
    AND is_relevant = true
    AND body_text IS NOT NULL
    AND LENGTH(body_text) > 100;

-- Composite index for backfill priority queue (company + analyzed status)
CREATE INDEX IF NOT EXISTS idx_metadata_backfill_queue
  ON scraped_posts((metadata->>'company'), metadata_analyzed_at, created_at DESC)
  WHERE is_relevant = true
    AND metadata_analyzed_at IS NULL;
