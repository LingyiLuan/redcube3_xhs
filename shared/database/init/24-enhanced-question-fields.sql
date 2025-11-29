-- Migration 24: Enhanced Question Fields for Interview Intelligence
-- Purpose: Add 12 strategic LLM-extracted fields for comprehensive question analysis
-- Replaces rule-based extraction with high-accuracy LLM extraction

-- Add LLM-extracted question metadata fields
ALTER TABLE interview_questions
ADD COLUMN IF NOT EXISTS llm_difficulty VARCHAR(20) CHECK (llm_difficulty IN ('easy', 'medium', 'hard') OR llm_difficulty IS NULL),
ADD COLUMN IF NOT EXISTS llm_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS hints_given JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS common_mistakes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS optimal_approach TEXT,
ADD COLUMN IF NOT EXISTS follow_up_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS real_world_application TEXT,
ADD COLUMN IF NOT EXISTS interviewer_focused_on JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS candidate_struggled_with TEXT,
ADD COLUMN IF NOT EXISTS preparation_resources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS success_rate_reported VARCHAR(50),
ADD COLUMN IF NOT EXISTS llm_extracted_at TIMESTAMP;

-- Add indexes for LLM fields
CREATE INDEX IF NOT EXISTS idx_interview_questions_llm_difficulty ON interview_questions(llm_difficulty);
CREATE INDEX IF NOT EXISTS idx_interview_questions_llm_category ON interview_questions(llm_category);
CREATE INDEX IF NOT EXISTS idx_interview_questions_estimated_time ON interview_questions(estimated_time_minutes);
CREATE INDEX IF NOT EXISTS idx_interview_questions_llm_extracted_at ON interview_questions(llm_extracted_at);

-- Add comments for documentation
COMMENT ON COLUMN interview_questions.llm_difficulty IS 'LLM-extracted difficulty (more accurate than rule-based): easy/medium/hard';
COMMENT ON COLUMN interview_questions.llm_category IS 'LLM-extracted question category (better than rule-based)';
COMMENT ON COLUMN interview_questions.estimated_time_minutes IS 'Time given to solve this question (LLM extracted)';
COMMENT ON COLUMN interview_questions.hints_given IS 'Array of hints interviewer provided (LLM extracted)';
COMMENT ON COLUMN interview_questions.common_mistakes IS 'Array of common mistakes to avoid (LLM extracted)';
COMMENT ON COLUMN interview_questions.optimal_approach IS 'Best approach/technique to solve (LLM extracted)';
COMMENT ON COLUMN interview_questions.follow_up_questions IS 'Array of follow-up questions asked (LLM extracted)';
COMMENT ON COLUMN interview_questions.real_world_application IS 'Real-world use case for this question (LLM extracted)';
COMMENT ON COLUMN interview_questions.interviewer_focused_on IS 'Array of what interviewer cared about most (LLM extracted)';
COMMENT ON COLUMN interview_questions.candidate_struggled_with IS 'What candidate found difficult (LLM extracted)';
COMMENT ON COLUMN interview_questions.preparation_resources IS 'Array of recommended prep resources (LLM extracted)';
COMMENT ON COLUMN interview_questions.success_rate_reported IS 'Pass rate if mentioned (LLM extracted)';
COMMENT ON COLUMN interview_questions.llm_extracted_at IS 'Timestamp when LLM extraction was performed';
