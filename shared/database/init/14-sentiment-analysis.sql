-- ============================================================================
-- Migration: 14-sentiment-analysis.sql
-- Purpose: Add sentiment analysis columns to scraped_posts table
-- Date: 2025-11-10
-- ============================================================================

\c redcube_content;

-- Add sentiment analysis columns
ALTER TABLE scraped_posts
  ADD COLUMN IF NOT EXISTS sentiment_category VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS sentiment_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS sentiment_key_phrases JSONB,
  ADD COLUMN IF NOT EXISTS sentiment_confidence DECIMAL(3,2) DEFAULT 0.85,
  ADD COLUMN IF NOT EXISTS sentiment_analyzed_at TIMESTAMP;

-- Add check constraint for sentiment_score range
ALTER TABLE scraped_posts
  DROP CONSTRAINT IF EXISTS sentiment_score_range;

ALTER TABLE scraped_posts
  ADD CONSTRAINT sentiment_score_range
  CHECK (sentiment_score IS NULL OR (sentiment_score >= 1.0 AND sentiment_score <= 5.0));

-- Add check constraint for sentiment_confidence range
ALTER TABLE scraped_posts
  DROP CONSTRAINT IF EXISTS sentiment_confidence_range;

ALTER TABLE scraped_posts
  ADD CONSTRAINT sentiment_confidence_range
  CHECK (sentiment_confidence IS NULL OR (sentiment_confidence >= 0.0 AND sentiment_confidence <= 1.0));

-- Add check constraint for valid sentiment categories
ALTER TABLE scraped_posts
  DROP CONSTRAINT IF EXISTS sentiment_category_valid;

ALTER TABLE scraped_posts
  ADD CONSTRAINT sentiment_category_valid
  CHECK (sentiment_category IS NULL OR sentiment_category IN (
    'CONFIDENT', 'ANXIOUS', 'FRUSTRATED', 'RELIEVED', 'DISAPPOINTED', 'NEUTRAL', 'MIXED'
  ));

-- Performance indexes
-- Index for filtering by sentiment category
CREATE INDEX IF NOT EXISTS idx_sentiment_category
  ON scraped_posts(sentiment_category)
  WHERE sentiment_category IS NOT NULL;

-- Index for filtering by sentiment score
CREATE INDEX IF NOT EXISTS idx_sentiment_score
  ON scraped_posts(sentiment_score)
  WHERE sentiment_score IS NOT NULL;

-- Index for finding unanalyzed posts
CREATE INDEX IF NOT EXISTS idx_sentiment_analyzed
  ON scraped_posts(sentiment_analyzed_at)
  WHERE sentiment_analyzed_at IS NOT NULL;

-- Composite index for common queries (company + sentiment)
CREATE INDEX IF NOT EXISTS idx_company_sentiment
  ON scraped_posts((metadata->>'company'), sentiment_category, sentiment_score)
  WHERE sentiment_category IS NOT NULL;

-- Composite index for backfill queries (find posts needing analysis)
CREATE INDEX IF NOT EXISTS idx_unanalyzed_posts
  ON scraped_posts(created_at DESC)
  WHERE sentiment_category IS NULL
    AND body_text IS NOT NULL
    AND LENGTH(body_text) > 100;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 14-sentiment-analysis.sql completed successfully';
  RAISE NOTICE '   - Added 6 sentiment columns to scraped_posts';
  RAISE NOTICE '   - Added 3 check constraints for data validation';
  RAISE NOTICE '   - Created 5 indexes for query performance';
END $$;
