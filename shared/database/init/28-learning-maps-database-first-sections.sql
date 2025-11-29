--
-- Learning Maps Database-First Sections
-- Date: 2025-11-24
-- Adds fields for Common Pitfalls, Readiness Checklist, Success Factors, Database Resources, and Timeline Statistics
--

-- Add new JSONB columns for database-first sections
ALTER TABLE learning_maps_history
ADD COLUMN IF NOT EXISTS common_pitfalls JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS readiness_checklist JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS success_factors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS database_resources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS timeline_statistics JSONB DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN learning_maps_history.common_pitfalls IS 'Common pitfalls aggregated from mistakes_made and rejection_reasons fields (object with pitfalls array and evidence_quality)';
COMMENT ON COLUMN learning_maps_history.readiness_checklist IS 'Interview readiness checklist from success_factors and improvement_areas (object with checklist_items array and evidence_quality)';
COMMENT ON COLUMN learning_maps_history.success_factors IS 'Success factors from post metadata (array of objects)';
COMMENT ON COLUMN learning_maps_history.database_resources IS 'Curated resources from post metadata (array of objects)';
COMMENT ON COLUMN learning_maps_history.timeline_statistics IS 'Timeline statistics aggregated from post metadata (object with weeks_to_offer, weeks_studying, etc)';
