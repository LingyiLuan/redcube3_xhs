-- Migration: Add user_id column to batch_analysis_cache table
-- Date: 2025-11-30
-- Purpose: Enable user-based filtering for batch analysis history to prevent cross-user data access

\c redcube_content;

-- Add user_id column to batch_analysis_cache
ALTER TABLE batch_analysis_cache 
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Create index for user_id filtering
CREATE INDEX IF NOT EXISTS idx_batch_cache_user_id ON batch_analysis_cache(user_id);

-- Add comment
COMMENT ON COLUMN batch_analysis_cache.user_id IS 'User ID who created this batch analysis (for security filtering)';

-- Backfill user_id from batch_id format: batch_${userId}_${contentHash}
-- Extract userId from batch_id and update existing records
UPDATE batch_analysis_cache
SET user_id = CAST(SUBSTRING(batch_id FROM '^batch_(\d+)_') AS INTEGER)
WHERE user_id IS NULL 
  AND batch_id ~ '^batch_\d+_';

-- Log how many records were updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM batch_analysis_cache
  WHERE user_id IS NOT NULL;
  
  RAISE NOTICE 'Updated % batch_analysis_cache records with user_id', updated_count;
END $$;

