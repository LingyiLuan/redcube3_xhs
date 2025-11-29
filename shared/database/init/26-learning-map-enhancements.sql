/**
 * Migration 26: Learning Map Enhancements
 *
 * Add JSONB columns to store LLM-generated content that was previously discarded:
 * - skills_roadmap: Module-based skills progression
 * - knowledge_gaps: Identified gaps from failure patterns
 * - curated_resources: Resources with effectiveness ratings
 * - timeline: Week-by-week breakdown with narratives
 * - expected_outcomes: Expected learning outcomes
 */

-- Add new JSONB columns to learning_maps_history table
ALTER TABLE learning_maps_history
  ADD COLUMN IF NOT EXISTS skills_roadmap JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS knowledge_gaps JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS curated_resources JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS expected_outcomes JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the schema
COMMENT ON COLUMN learning_maps_history.skills_roadmap IS 'LLM-generated skills roadmap with modules, each containing skills, topics, and resources';
COMMENT ON COLUMN learning_maps_history.knowledge_gaps IS 'Identified knowledge gaps from failure patterns with gap descriptions and practice recommendations';
COMMENT ON COLUMN learning_maps_history.curated_resources IS 'Curated learning resources with titles, URLs, types, relevance scores, and effectiveness ratings';
COMMENT ON COLUMN learning_maps_history.timeline IS 'Week-by-week learning timeline with LLM-generated narratives, focus areas, and milestones';
COMMENT ON COLUMN learning_maps_history.expected_outcomes IS 'Expected learning outcomes and skill achievements';

-- Create index for better performance on timeline queries
CREATE INDEX IF NOT EXISTS idx_learning_maps_timeline ON learning_maps_history USING GIN (timeline);

-- Create index for knowledge gaps queries
CREATE INDEX IF NOT EXISTS idx_learning_maps_knowledge_gaps ON learning_maps_history USING GIN (knowledge_gaps);

-- Create index for skills roadmap queries
CREATE INDEX IF NOT EXISTS idx_learning_maps_skills_roadmap ON learning_maps_history USING GIN (skills_roadmap);
