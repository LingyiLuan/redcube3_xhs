-- Connect to users database
\c redcube_users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'candidate',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    skills TEXT[],
    experience_level VARCHAR(50),
    resume_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Connect to interviews database
\c redcube_interviews;

CREATE TABLE interviews (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL,
    interviewer_id INTEGER NOT NULL,
    position VARCHAR(200) NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    interview_type VARCHAR(50) NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meeting_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interview_questions (
    id SERIAL PRIMARY KEY,
    interview_id INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(100),
    answer TEXT,
    score INTEGER CHECK (score >= 0 AND score <= 10),
    feedback TEXT,
    time_spent_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interview_feedback (
    id SERIAL PRIMARY KEY,
    interview_id INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 10),
    technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 10),
    communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 10),
    problem_solving_score INTEGER CHECK (problem_solving_score >= 0 AND problem_solving_score <= 10),
    comments TEXT,
    recommendation VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Connect to content database
\c redcube_content;

CREATE TABLE question_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES question_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES question_categories(id),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER NOT NULL,
    solution TEXT,
    hints TEXT[],
    time_limit_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE question_resources (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    resource_url VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- XHS Post Analysis Results Table (designed for future scalability)
CREATE TABLE analysis_results (
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

    -- Phase 2 additions
    interview_stages JSONB DEFAULT '[]',
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    timeline TEXT,
    outcome VARCHAR(20) CHECK (outcome IN ('passed', 'failed', 'pending', 'unknown')),

    -- Future scalability fields
    analysis_version VARCHAR(10) DEFAULT '2.0',
    confidence_score DECIMAL(3,2),
    tags TEXT[],
    metadata JSONB DEFAULT '{}'
);

-- Phase 2: Analysis Connections Table
CREATE TABLE analysis_connections (
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
CREATE TABLE user_goals (
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

-- Future tables for advanced features (commented out for MVP)
-- CREATE TABLE post_connections (
--     id SERIAL PRIMARY KEY,
--     analysis_id_1 INTEGER REFERENCES analysis_results(id),
--     analysis_id_2 INTEGER REFERENCES analysis_results(id),
--     connection_type VARCHAR(50), -- 'same_company', 'similar_role', 'related_topic'
--     similarity_score DECIMAL(3,2),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE learning_paths (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL,
--     target_company VARCHAR(200),
--     target_role VARCHAR(200),
--     path_data JSONB, -- structured learning recommendations
--     progress JSONB DEFAULT '{}',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Connect to notifications database
\c redcube_notifications;

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    interview_reminders BOOLEAN DEFAULT true,
    feedback_notifications BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
\c redcube_users;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

\c redcube_interviews;
CREATE INDEX idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX idx_interviews_interviewer_id ON interviews(interviewer_id);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX idx_interview_questions_interview_id ON interview_questions(interview_id);
CREATE INDEX idx_interview_feedback_interview_id ON interview_feedback(interview_id);

\c redcube_content;
CREATE INDEX idx_questions_category_id ON questions(category_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_is_active ON questions(is_active);
CREATE INDEX idx_question_resources_question_id ON question_resources(question_id);

-- Analysis results indexes for performance
CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_results_company ON analysis_results(company);
CREATE INDEX idx_analysis_results_role ON analysis_results(role);
CREATE INDEX idx_analysis_results_sentiment ON analysis_results(sentiment);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at);
CREATE INDEX idx_analysis_results_experience_level ON analysis_results(experience_level);
CREATE INDEX idx_analysis_results_batch_id ON analysis_results(batch_id);
CREATE INDEX idx_analysis_results_outcome ON analysis_results(outcome);

-- GIN indexes for JSONB fields (for future complex queries)
CREATE INDEX idx_analysis_results_interview_topics ON analysis_results USING GIN(interview_topics);
CREATE INDEX idx_analysis_results_preparation_materials ON analysis_results USING GIN(preparation_materials);
CREATE INDEX idx_analysis_results_key_insights ON analysis_results USING GIN(key_insights);
CREATE INDEX idx_analysis_results_interview_stages ON analysis_results USING GIN(interview_stages);
CREATE INDEX idx_analysis_results_metadata ON analysis_results USING GIN(metadata);

-- Phase 2: Analysis connections indexes
CREATE INDEX idx_connections_post1_id ON analysis_connections(post1_id);
CREATE INDEX idx_connections_post2_id ON analysis_connections(post2_id);
CREATE INDEX idx_connections_type ON analysis_connections(connection_type);
CREATE INDEX idx_connections_strength ON analysis_connections(strength);
CREATE INDEX idx_connections_created_at ON analysis_connections(created_at);

-- Phase 2: User goals indexes
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_active ON user_goals(is_active);
CREATE INDEX idx_user_goals_target_companies ON user_goals USING GIN(target_companies);
CREATE INDEX idx_user_goals_focus_areas ON user_goals USING GIN(focus_areas);

\c redcube_notifications;
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);