-- Migration 40: Store full single analysis payloads
-- Adds JSONB column to analysis_results so we can persist the entire analysis response

ALTER TABLE analysis_results
  ADD COLUMN IF NOT EXISTS full_result JSONB;

-- Optional index for faster retrieval/querying of JSON content
CREATE INDEX IF NOT EXISTS idx_analysis_results_full_result
  ON analysis_results
  USING gin (full_result);


