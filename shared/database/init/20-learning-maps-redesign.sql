--
-- Learning Maps Redesign - Add Fields for 100% Real Data Architecture
-- Date: 2025-11-16
--

-- Add new columns for enhanced learning map data
ALTER TABLE learning_maps_history
ADD COLUMN IF NOT EXISTS source_report_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS foundation_posts INTEGER,
ADD COLUMN IF NOT EXISTS data_coverage VARCHAR(20),
ADD COLUMN IF NOT EXISTS avg_prep_weeks DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS company_tracks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS analytics JSONB DEFAULT '{}'::jsonb;

-- Create index for source_report_id lookups
CREATE INDEX IF NOT EXISTS idx_learning_maps_source_report
ON learning_maps_history(source_report_id);

-- Add comments
COMMENT ON COLUMN learning_maps_history.source_report_id IS 'Link to comprehensive analysis report (e.g., batch_1_abc123)';
COMMENT ON COLUMN learning_maps_history.foundation_posts IS 'Total foundation posts (seed + RAG) used for generation';
COMMENT ON COLUMN learning_maps_history.data_coverage IS 'Data quality: High/Medium/Low based on foundation size';
COMMENT ON COLUMN learning_maps_history.avg_prep_weeks IS 'Average preparation weeks from real posts';
COMMENT ON COLUMN learning_maps_history.company_tracks IS 'Company-specific learning tracks (JSON array)';
COMMENT ON COLUMN learning_maps_history.analytics IS 'Analytics data for visualization (JSON object)';
