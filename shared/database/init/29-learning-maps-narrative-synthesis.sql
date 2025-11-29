--
-- Learning Maps Narrative Synthesis Fields
-- Date: 2025-11-24
-- Adds fields for LLM-synthesized narrative insights from database-first aggregations
--

-- Add new JSONB columns for synthesized narrative fields
ALTER TABLE learning_maps_history
ADD COLUMN IF NOT EXISTS pitfalls_narrative JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS improvement_areas JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS resource_recommendations JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preparation_expectations JSONB DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN learning_maps_history.pitfalls_narrative IS 'LLM-synthesized narrative insights from common_pitfalls (object with summary, top_pitfalls array with explanations and how_to_avoid)';
COMMENT ON COLUMN learning_maps_history.improvement_areas IS 'LLM-synthesized improvement recommendations from readiness_checklist (object with summary, priority_skills array with action_plan)';
COMMENT ON COLUMN learning_maps_history.resource_recommendations IS 'LLM-synthesized resource guidance from database_resources (object with summary, ranked_resources with when_to_use and how_to_use)';
COMMENT ON COLUMN learning_maps_history.preparation_expectations IS 'LLM-synthesized preparation expectations from timeline_statistics (object with realistic_timeline, success_indicators, common_mistakes)';

-- Create GIN indexes for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_learning_maps_pitfalls_narrative ON learning_maps_history USING GIN (pitfalls_narrative);
CREATE INDEX IF NOT EXISTS idx_learning_maps_improvement_areas ON learning_maps_history USING GIN (improvement_areas);
