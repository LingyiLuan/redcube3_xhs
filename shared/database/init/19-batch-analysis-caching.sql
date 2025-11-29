-- Migration: Add caching columns for batch analysis determinism
-- Date: 2025-11-12
-- Purpose: Cache user post embeddings and pattern_analysis results to ensure deterministic reports

\c redcube_content;

-- Add batch analysis caching table
-- This stores cached data per batch_id to ensure reports are deterministic
CREATE TABLE IF NOT EXISTS batch_analysis_cache (
  id SERIAL PRIMARY KEY,
  batch_id VARCHAR(100) UNIQUE NOT NULL,

  -- Cached embeddings for user posts (array of vector arrays)
  -- Format: [{"text": "...", "embedding": [0.1, 0.2, ...]}, ...]
  user_post_embeddings JSONB,

  -- Cached pattern_analysis result (entire object)
  pattern_analysis JSONB,

  -- Metadata
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  embedding_model VARCHAR(100),

  -- Track cache hits for monitoring
  cache_hits INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_cache_batch_id ON batch_analysis_cache(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_cache_cached_at ON batch_analysis_cache(cached_at DESC);

-- Add comment
COMMENT ON TABLE batch_analysis_cache IS 'Caches user post embeddings and pattern_analysis results to ensure deterministic batch reports';
COMMENT ON COLUMN batch_analysis_cache.user_post_embeddings IS 'Array of {text, embedding} objects for user posts';
COMMENT ON COLUMN batch_analysis_cache.pattern_analysis IS 'Full pattern_analysis result object (skills, companies, roles, etc)';
COMMENT ON COLUMN batch_analysis_cache.cache_hits IS 'Number of times this cache entry was used (for monitoring)';
