-- ============================================================================
-- Phase 1: Curated LeetCode Problems Database Schema
-- ============================================================================
-- This migration creates tables for curated problem lists (Blind 75, NeetCode 150)
-- and enables matching extracted questions to industry-standard problems

-- Curated Problems Table
-- Stores pre-validated LeetCode problems from curated lists
CREATE TABLE IF NOT EXISTS curated_problems (
    id SERIAL PRIMARY KEY,
    problem_name VARCHAR(200) NOT NULL,
    leetcode_number INTEGER UNIQUE,
    leetcode_slug VARCHAR(200) UNIQUE,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    category VARCHAR(100) NOT NULL, -- 'Arrays & Hashing', 'Two Pointers', 'Trees', etc.
    subcategory VARCHAR(100), -- More specific: 'Binary Search', 'Sliding Window', etc.
    topics TEXT[], -- ['array', 'hash-table', 'two-pointers']
    url TEXT NOT NULL,
    problem_list VARCHAR(50) NOT NULL, -- 'Blind 75', 'NeetCode 150', 'Grind 169'
    company_frequency JSONB, -- {"Google": 45, "Meta": 32, "Amazon": 28}
    acceptance_rate DECIMAL(5,2), -- 42.3 (%)
    premium_only BOOLEAN DEFAULT false,
    estimated_time_minutes INTEGER, -- Estimated solve time for medium difficulty
    notes TEXT, -- Any special notes about the problem
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_curated_difficulty ON curated_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_curated_category ON curated_problems(category);
CREATE INDEX IF NOT EXISTS idx_curated_list ON curated_problems(problem_list);
CREATE INDEX IF NOT EXISTS idx_curated_topics ON curated_problems USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_curated_leetcode_num ON curated_problems(leetcode_number);

-- Topic Taxonomy Table
-- Defines learning topic sequencing for pedagogical curriculum
CREATE TABLE IF NOT EXISTS topic_taxonomy (
    id SERIAL PRIMARY KEY,
    topic_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- 'fundamentals', 'intermediate', 'advanced'
    sequence_order INTEGER NOT NULL, -- Week order in 12-week curriculum
    estimated_hours INTEGER NOT NULL,
    prerequisites TEXT[], -- ['Arrays', 'Hash Tables']
    description TEXT,
    learning_objectives TEXT[],
    difficulty_distribution JSONB, -- {"Easy": 4, "Medium": 6, "Hard": 2}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_topic_sequence ON topic_taxonomy(sequence_order);
CREATE INDEX IF NOT EXISTS idx_topic_category ON topic_taxonomy(category);

-- Curriculum Templates Table
-- Pre-built curriculum templates by company/role
CREATE TABLE IF NOT EXISTS curriculum_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    company VARCHAR(100), -- 'Google', 'Meta', NULL for generic
    role VARCHAR(100), -- 'SWE', 'Senior SWE', 'Staff'
    level VARCHAR(50), -- 'L3', 'L4', 'L5'
    total_weeks INTEGER NOT NULL DEFAULT 12,
    difficulty_distribution JSONB, -- {"Easy": 30, "Medium": 50, "Hard": 20}
    topic_coverage JSONB, -- {"Arrays & Hashing": 2, "Trees": 2, "DP": 3}
    problem_count_per_week INTEGER DEFAULT 8,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_template_company ON curriculum_templates(company);
CREATE INDEX IF NOT EXISTS idx_template_role ON curriculum_templates(role);

COMMENT ON TABLE curated_problems IS 'Industry-standard curated LeetCode problems from Blind 75, NeetCode 150, etc.';
COMMENT ON TABLE topic_taxonomy IS 'Pedagogical sequencing of topics for structured learning';
COMMENT ON TABLE curriculum_templates IS 'Pre-built curriculum templates optimized by company and role';
