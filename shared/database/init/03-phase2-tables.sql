-- Phase 2: Analysis Connections Table
\c redcube_content;

CREATE TABLE IF NOT EXISTS analysis_connections (
    id SERIAL PRIMARY KEY,
    post1_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
    post2_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
    connection_type VARCHAR(50) NOT NULL, -- 'same_company', 'similar_role', 'topic_overlap', 'career_progression', 'same_industry'
    strength DECIMAL(3,2) NOT NULL CHECK (strength >= 0.0 AND strength <= 1.0), -- 0.0 to 1.0 confidence score
    insights TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure we don't duplicate connections
    UNIQUE(post1_id, post2_id)
);

-- Phase 2: User Goals for Autonomous Intelligence
CREATE TABLE IF NOT EXISTS user_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    target_role VARCHAR(200),
    target_companies TEXT[],
    timeline_months INTEGER,
    focus_areas TEXT[],
    current_level VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    progress_tracking JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phase 2: Analysis connections indexes
CREATE INDEX IF NOT EXISTS idx_connections_post1_id ON analysis_connections(post1_id);
CREATE INDEX IF NOT EXISTS idx_connections_post2_id ON analysis_connections(post2_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON analysis_connections(connection_type);
CREATE INDEX IF NOT EXISTS idx_connections_strength ON analysis_connections(strength);
CREATE INDEX IF NOT EXISTS idx_connections_created_at ON analysis_connections(created_at);

-- Phase 2: User goals indexes
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_active ON user_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_user_goals_target_companies ON user_goals USING GIN(target_companies);
CREATE INDEX IF NOT EXISTS idx_user_goals_focus_areas ON user_goals USING GIN(focus_areas);