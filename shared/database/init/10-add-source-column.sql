/**
 * Phase 7: Add proper 'source' column for multi-platform support
 *
 * Replaces the misuse of 'subreddit' column for non-Reddit sources
 * Now supports: reddit, hackernews, discord, blind, etc.
 */

-- Add source column to track platform origin
ALTER TABLE scraped_posts ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'reddit';

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_scraped_posts_source ON scraped_posts(source);

-- Update existing rows: keep 'subreddit' for Reddit data, use 'source' for platform
-- For Reddit posts, source='reddit' and subreddit contains the actual subreddit name
-- For HN posts, source='hackernews' and subreddit should be NULL
UPDATE scraped_posts
SET source = CASE
  WHEN subreddit = 'hackernews' THEN 'hackernews'
  ELSE 'reddit'
END
WHERE source IS NULL OR source = 'reddit';

-- Clean up: Set subreddit to NULL for non-Reddit sources
UPDATE scraped_posts SET subreddit = NULL WHERE source != 'reddit';

-- Add comment for documentation
COMMENT ON COLUMN scraped_posts.source IS 'Platform source: reddit, hackernews, discord, blind, etc.';
COMMENT ON COLUMN scraped_posts.subreddit IS 'Reddit subreddit name (NULL for non-Reddit sources)';
