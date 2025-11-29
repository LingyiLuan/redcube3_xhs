-- Migration 25: Add Enhanced Intelligence to Batch Analysis Cache
-- Purpose: Store enhanced intelligence report (21 LLM fields aggregated)
-- Generated from: Phase 2 - API Integration

-- Add enhanced_intelligence field to batch_analysis_cache
ALTER TABLE batch_analysis_cache
ADD COLUMN IF NOT EXISTS enhanced_intelligence JSONB DEFAULT '{}'::jsonb;

-- Add index for querying enhanced intelligence
CREATE INDEX IF NOT EXISTS idx_batch_cache_enhanced
ON batch_analysis_cache USING gin (enhanced_intelligence);

-- Add metadata columns for tracking
ALTER TABLE batch_analysis_cache
ADD COLUMN IF NOT EXISTS foundation_pool_size INTEGER,
ADD COLUMN IF NOT EXISTS user_posts_count INTEGER,
ADD COLUMN IF NOT EXISTS rag_similar_posts_count INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN batch_analysis_cache.enhanced_intelligence IS
  'Enhanced intelligence from 21 LLM fields: hiring process, rejections, question metadata, timelines, experience levels';

COMMENT ON COLUMN batch_analysis_cache.foundation_pool_size IS
  'Total foundation pool size (user posts + RAG similar posts)';

COMMENT ON COLUMN batch_analysis_cache.user_posts_count IS
  'Number of user-submitted posts in this batch';

COMMENT ON COLUMN batch_analysis_cache.rag_similar_posts_count IS
  'Number of RAG similar posts used for enhanced intelligence';

-- Create index on foundation pool size for analytics
CREATE INDEX IF NOT EXISTS idx_batch_cache_foundation_pool_size
ON batch_analysis_cache(foundation_pool_size);
