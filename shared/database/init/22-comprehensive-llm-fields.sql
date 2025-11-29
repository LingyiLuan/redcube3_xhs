-- Migration 22: Add Comprehensive LLM-Extracted Fields
-- Purpose: Save ALL fields extracted by LLM aiService.analyzeText()
-- Previously only 3/13 fields were saved (interview_topics, interview_questions, leetcode_problems)
-- This migration adds the 10 missing fields for complete data capture

-- Add LLM-extracted fields to scraped_posts table
ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS sentiment_category VARCHAR(20) CHECK (sentiment_category IN ('positive', 'negative', 'neutral') OR sentiment_category IS NULL),
ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard') OR difficulty_level IS NULL),
ADD COLUMN IF NOT EXISTS timeline TEXT,
ADD COLUMN IF NOT EXISTS llm_industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS preparation_materials JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS key_insights JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS llm_company VARCHAR(100),
ADD COLUMN IF NOT EXISTS llm_role VARCHAR(100),
ADD COLUMN IF NOT EXISTS llm_outcome VARCHAR(50) CHECK (llm_outcome IN ('passed', 'failed', 'pending', 'unknown') OR llm_outcome IS NULL),
ADD COLUMN IF NOT EXISTS llm_experience_level VARCHAR(50) CHECK (llm_experience_level IN ('intern', 'entry', 'mid', 'senior', 'executive') OR llm_experience_level IS NULL),
ADD COLUMN IF NOT EXISTS llm_interview_stages JSONB DEFAULT '[]'::jsonb;

-- Add indexes for frequently queried LLM fields
CREATE INDEX IF NOT EXISTS idx_scraped_posts_sentiment_category ON scraped_posts(sentiment_category);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_difficulty_level ON scraped_posts(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_llm_industry ON scraped_posts(llm_industry);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_llm_company ON scraped_posts(llm_company);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_llm_outcome ON scraped_posts(llm_outcome);

-- Add comments documenting hybrid extraction strategy
COMMENT ON COLUMN scraped_posts.sentiment_category IS 'LLM-extracted sentiment (positive/negative/neutral)';
COMMENT ON COLUMN scraped_posts.difficulty_level IS 'LLM-extracted interview difficulty (easy/medium/hard)';
COMMENT ON COLUMN scraped_posts.timeline IS 'LLM-extracted interview process timeline description';
COMMENT ON COLUMN scraped_posts.llm_industry IS 'LLM-extracted industry (tech, finance, healthcare, etc.)';
COMMENT ON COLUMN scraped_posts.preparation_materials IS 'LLM-extracted array of preparation materials mentioned';
COMMENT ON COLUMN scraped_posts.key_insights IS 'LLM-extracted array of key insights from the interview experience';
COMMENT ON COLUMN scraped_posts.llm_company IS 'LLM-extracted company name (hybrid: LLM primary, rules fallback)';
COMMENT ON COLUMN scraped_posts.llm_role IS 'LLM-extracted role title (hybrid: LLM primary, rules fallback)';
COMMENT ON COLUMN scraped_posts.llm_outcome IS 'LLM-extracted outcome (passed/failed/pending/unknown)';
COMMENT ON COLUMN scraped_posts.llm_experience_level IS 'LLM-extracted experience level (intern/entry/mid/senior/executive)';
COMMENT ON COLUMN scraped_posts.llm_interview_stages IS 'LLM-extracted array of interview stages mentioned';

-- Add tracking field for when LLM extraction was performed
ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS llm_extracted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_scraped_posts_llm_extracted_at ON scraped_posts(llm_extracted_at);

COMMENT ON COLUMN scraped_posts.llm_extracted_at IS 'Timestamp when comprehensive LLM extraction was performed';
