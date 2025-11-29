-- ===================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- Phase 1: Quick Wins for Batch Analysis
-- ===================================================

-- Create indexes for faster queries on analysis_results table
CREATE INDEX IF NOT EXISTS idx_analysis_results_batch_id ON analysis_results(batch_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_created ON analysis_results(user_id, created_at DESC);

-- Create indexes for posts table (RAG queries)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_company ON posts(company);
CREATE INDEX IF NOT EXISTS idx_posts_role_type ON posts(role_type);

-- Optimize pgvector similarity search with HNSW index
-- HNSW (Hierarchical Navigable Small World) is much faster than default IVFFlat
-- Note: Requires pgvector extension
CREATE INDEX IF NOT EXISTS idx_posts_embedding_hnsw
ON posts USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_posts_company_role ON posts(company, role_type);

-- Add index on analysis_connections table
CREATE INDEX IF NOT EXISTS idx_analysis_connections_post1 ON analysis_connections(post1_id);
CREATE INDEX IF NOT EXISTS idx_analysis_connections_post2 ON analysis_connections(post2_id);

-- Add index on learning_maps_history table
CREATE INDEX IF NOT EXISTS idx_learning_maps_user_id ON learning_maps_history(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_maps_created_at ON learning_maps_history(created_at DESC);

-- Add index on scraped_posts table
CREATE INDEX IF NOT EXISTS idx_scraped_posts_created_at ON scraped_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_company ON scraped_posts(company);

ANALYZE analysis_results;
ANALYZE scraped_posts;
ANALYZE analysis_connections;
ANALYZE learning_maps_history;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Performance indexes created successfully!';
END $$;
