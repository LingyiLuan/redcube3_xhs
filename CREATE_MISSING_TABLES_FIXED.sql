-- Create missing tables for redcube_content database
-- First enable pgvector extension if not already enabled

-- Enable pgvector extension (required for vector type)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Create analysis_results table (already created, but including for completeness)
CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    original_text TEXT NOT NULL,
    company VARCHAR(200),
    role VARCHAR(200),
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    interview_topics JSONB DEFAULT '[]',
    industry VARCHAR(100),
    experience_level VARCHAR(20) CHECK (experience_level IN ('intern', 'entry', 'mid', 'senior', 'executive')),
    preparation_materials JSONB DEFAULT '[]',
    key_insights JSONB DEFAULT '[]',
    user_id INTEGER,
    batch_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    interview_stages JSONB DEFAULT '[]',
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    timeline TEXT,
    outcome VARCHAR(20) CHECK (outcome IN ('passed', 'failed', 'pending', 'unknown')),
    analysis_version VARCHAR(10) DEFAULT '2.0',
    confidence_score DECIMAL(3,2),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    full_result JSONB
);

-- Indexes for analysis_results (only create if table was just created)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'analysis_results' AND indexname = 'idx_analysis_results_user_id') THEN
        CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'analysis_results' AND indexname = 'idx_analysis_results_batch_id') THEN
        CREATE INDEX idx_analysis_results_batch_id ON analysis_results(batch_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'analysis_results' AND indexname = 'idx_analysis_results_company') THEN
        CREATE INDEX idx_analysis_results_company ON analysis_results(company);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'analysis_results' AND indexname = 'idx_analysis_results_created_at') THEN
        CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at DESC);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'analysis_results' AND indexname = 'idx_analysis_results_full_result') THEN
        CREATE INDEX idx_analysis_results_full_result ON analysis_results USING gin (full_result);
    END IF;
END $$;

-- 2. Create interview_questions table (now that vector extension is enabled)
CREATE TABLE IF NOT EXISTS interview_questions (
  id SERIAL PRIMARY KEY,
  post_id VARCHAR(50),
  question_text TEXT NOT NULL,
  question_type VARCHAR(50),
  difficulty VARCHAR(20),
  category VARCHAR(100),
  embedding vector(1536),
  embedding_generated_at TIMESTAMP,
  role_type VARCHAR(50),
  level VARCHAR(10),
  company VARCHAR(100),
  interview_stage VARCHAR(50),
  extracted_from TEXT,
  extraction_confidence FLOAT,
  extracted_at TIMESTAMP DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  verified_by INTEGER,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  -- LLM-extracted fields (from migration 24)
  llm_difficulty VARCHAR(20) CHECK (llm_difficulty IN ('easy', 'medium', 'hard') OR llm_difficulty IS NULL),
  llm_category VARCHAR(100),
  estimated_time_minutes INTEGER,
  hints_given JSONB DEFAULT '[]'::jsonb,
  common_mistakes JSONB DEFAULT '[]'::jsonb,
  optimal_approach TEXT,
  follow_up_questions JSONB DEFAULT '[]'::jsonb,
  real_world_application TEXT,
  interviewer_focused_on JSONB DEFAULT '[]'::jsonb,
  candidate_struggled_with TEXT,
  preparation_resources JSONB DEFAULT '[]'::jsonb,
  success_rate_reported VARCHAR(50),
  llm_extracted_at TIMESTAMP
);

-- Indexes for interview_questions
CREATE INDEX IF NOT EXISTS idx_interview_questions_post_id ON interview_questions(post_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_type ON interview_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_interview_questions_difficulty ON interview_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_interview_questions_company ON interview_questions(company);
CREATE INDEX IF NOT EXISTS idx_interview_questions_role ON interview_questions(role_type, level);
CREATE INDEX IF NOT EXISTS idx_interview_questions_llm_difficulty ON interview_questions(llm_difficulty);
CREATE INDEX IF NOT EXISTS idx_interview_questions_llm_category ON interview_questions(llm_category);
