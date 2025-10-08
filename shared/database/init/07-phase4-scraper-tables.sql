-- Phase 4: Autonomous Data Engine - Database Schema
-- Tables for storing scraped Reddit posts and user briefings

-- Table: scraped_posts
-- Stores raw data collected by the Apify scraper
CREATE TABLE IF NOT EXISTS scraped_posts (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(100) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author VARCHAR(100),
    created_at TIMESTAMP,
    url TEXT NOT NULL,
    body_text TEXT,
    potential_outcome VARCHAR(20) CHECK (potential_outcome IN ('positive', 'negative', 'unknown')),
    confidence_score DECIMAL(3, 2),
    subreddit VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    word_count INTEGER,
    scraped_at TIMESTAMP DEFAULT NOW(),
    created_at_db TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraped_posts_outcome ON scraped_posts(potential_outcome);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_subreddit ON scraped_posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_confidence ON scraped_posts(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_scraped_at ON scraped_posts(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_metadata ON scraped_posts USING GIN(metadata);

-- Table: user_goals
-- Stores user career goals for personalized briefings
CREATE TABLE IF NOT EXISTS user_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    target_role VARCHAR(200),
    target_companies TEXT[], -- Array of company names
    desired_skills TEXT[], -- Array of skills
    timeline_months INTEGER,
    location_preference VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_active ON user_goals(is_active);

-- Table: user_briefings
-- Stores generated weekly briefings for users
CREATE TABLE IF NOT EXISTS user_briefings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    period VARCHAR(20) DEFAULT 'weekly', -- 'weekly' or 'monthly'
    user_goals JSONB DEFAULT '{}'::jsonb,
    insights JSONB DEFAULT '{}'::jsonb,
    relevant_posts_count INTEGER DEFAULT 0,
    total_posts_scraped INTEGER DEFAULT 0,
    generated_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_briefings_user_id ON user_briefings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_briefings_generated_at ON user_briefings(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_briefings_is_read ON user_briefings(is_read);

-- Table: scraper_runs
-- Tracks each scraper execution for monitoring
CREATE TABLE IF NOT EXISTS scraper_runs (
    id SERIAL PRIMARY KEY,
    actor_run_id VARCHAR(100),
    subreddit VARCHAR(100),
    posts_requested INTEGER,
    posts_scraped INTEGER,
    posts_saved INTEGER,
    success_rate DECIMAL(5, 2),
    status VARCHAR(50) CHECK (status IN ('success', 'failed', 'partial')),
    error_message TEXT,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_runs_status ON scraper_runs(status);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_finished_at ON scraper_runs(finished_at DESC);

-- Function: Update timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers: Auto-update updated_at column
DROP TRIGGER IF EXISTS update_scraped_posts_updated_at ON scraped_posts;
CREATE TRIGGER update_scraped_posts_updated_at
    BEFORE UPDATE ON scraped_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_goals_updated_at ON user_goals;
CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion (for testing)
-- Uncomment to add test data
/*
INSERT INTO user_goals (user_id, target_role, target_companies, desired_skills, timeline_months)
VALUES
    (1, 'Software Engineer', ARRAY['Google', 'Meta', 'Amazon'], ARRAY['Python', 'React', 'AWS'], 6),
    (2, 'Data Scientist', ARRAY['Microsoft', 'Netflix'], ARRAY['Machine Learning', 'SQL', 'Python'], 3);
*/

COMMENT ON TABLE scraped_posts IS 'Stores raw interview experience posts collected from Reddit via Apify scraper';
COMMENT ON TABLE user_goals IS 'Stores user career goals for personalized job search and briefings';
COMMENT ON TABLE user_briefings IS 'Stores generated weekly career intelligence briefings for users';
COMMENT ON TABLE scraper_runs IS 'Tracks execution history and performance of the Apify scraper';

COMMENT ON COLUMN scraped_posts.potential_outcome IS 'AI-detected interview outcome: positive (success), negative (rejection), or unknown';
COMMENT ON COLUMN scraped_posts.confidence_score IS 'Confidence in the outcome prediction (0.0-1.0)';
COMMENT ON COLUMN scraped_posts.metadata IS 'JSON object containing extracted companies, roles, and technologies';

-- Grant permissions (adjust based on your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;
