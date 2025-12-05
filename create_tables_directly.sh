#!/bin/bash
# Create tables directly using Railway CLI (no port forwarding needed)

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "🔧 Creating tables directly using Railway CLI..."
echo ""

# Create tables using Railway CLI - this works from the connected session
echo "📦 Creating scraped_posts table..."
railway connect postgres << 'SQL'
\c redcube_content
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
CREATE INDEX IF NOT EXISTS idx_scraped_posts_outcome ON scraped_posts(potential_outcome);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_subreddit ON scraped_posts(subreddit);
\dt
\q
SQL

echo ""
echo "✅ Done! Check output above to see if table was created."
