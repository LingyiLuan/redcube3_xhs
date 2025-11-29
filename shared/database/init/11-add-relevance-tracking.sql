/**
 * Phase 8: Add relevance tracking for ML classifier training
 *
 * Tracks whether posts are relevant interview experiences
 * Stores labels from rules, LLM, or manual review for future classifier training
 */

-- Add relevance tracking columns
ALTER TABLE scraped_posts ADD COLUMN IF NOT EXISTS is_relevant BOOLEAN DEFAULT TRUE;
ALTER TABLE scraped_posts ADD COLUMN IF NOT EXISTS relevance_source VARCHAR(20) DEFAULT 'rules';
ALTER TABLE scraped_posts ADD COLUMN IF NOT EXISTS relevance_score FLOAT DEFAULT NULL;
ALTER TABLE scraped_posts ADD COLUMN IF NOT EXISTS relevance_checked_at TIMESTAMP DEFAULT NOW();

-- Create index for filtering relevant posts
CREATE INDEX IF NOT EXISTS idx_scraped_posts_is_relevant ON scraped_posts(is_relevant);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_relevance_source ON scraped_posts(relevance_source);

-- Add comments for documentation
COMMENT ON COLUMN scraped_posts.is_relevant IS 'TRUE if post is a relevant interview experience, FALSE if filtered out';
COMMENT ON COLUMN scraped_posts.relevance_source IS 'Source of relevance label: rules, llm, classifier, manual';
COMMENT ON COLUMN scraped_posts.relevance_score IS 'Confidence score (0-100) from filtering system';
COMMENT ON COLUMN scraped_posts.relevance_checked_at IS 'When relevance was determined';

-- Update existing posts to is_relevant = TRUE (they were already filtered)
UPDATE scraped_posts
SET is_relevant = TRUE,
    relevance_source = 'rules',
    relevance_checked_at = NOW()
WHERE is_relevant IS NULL;
