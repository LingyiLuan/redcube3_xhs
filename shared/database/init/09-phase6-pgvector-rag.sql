-- Phase 6: RAG Database with pgvector for Embeddings
-- Adds vector embeddings support for semantic search and AI analysis

-- ============================================
-- 1. Enable pgvector Extension
-- ============================================

-- Create pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is loaded
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'pgvector extension not available. Install with: apt-get install postgresql-15-pgvector';
  ELSE
    RAISE NOTICE 'pgvector extension enabled successfully';
  END IF;
END $$;

-- ============================================
-- 2. Add Embedding Columns to scraped_posts
-- ============================================

-- Add embedding column (OpenAI text-embedding-3-small = 1536 dimensions)
ALTER TABLE scraped_posts
  ADD COLUMN IF NOT EXISTS embedding vector(1536),
  ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
  ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS embedding_version INTEGER DEFAULT 1;

-- Add embedding for title only (for faster retrieval)
ALTER TABLE scraped_posts
  ADD COLUMN IF NOT EXISTS title_embedding vector(1536),
  ADD COLUMN IF NOT EXISTS title_embedding_generated_at TIMESTAMP;

-- Add metadata for embedding pipeline
ALTER TABLE scraped_posts
  ADD COLUMN IF NOT EXISTS embedding_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS embedding_error TEXT,
  ADD COLUMN IF NOT EXISTS embedding_retry_count INTEGER DEFAULT 0;

COMMENT ON COLUMN scraped_posts.embedding IS 'Full text embedding (title + body + comments combined)';
COMMENT ON COLUMN scraped_posts.title_embedding IS 'Title-only embedding for quick matching';
COMMENT ON COLUMN scraped_posts.embedding_status IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN scraped_posts.embedding_model IS 'OpenAI model used: text-embedding-3-small or text-embedding-3-large';

-- ============================================
-- 3. Create Vector Similarity Indexes
-- ============================================

-- IVFFlat index for fast approximate nearest neighbor search
-- Lists = sqrt(total_rows) is a good starting point, we'll use 100 for ~10K rows
CREATE INDEX IF NOT EXISTS idx_scraped_posts_embedding_ivfflat
  ON scraped_posts
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Title embedding index (for quick title-based search)
CREATE INDEX IF NOT EXISTS idx_scraped_posts_title_embedding_ivfflat
  ON scraped_posts
  USING ivfflat (title_embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for embedding pipeline status tracking
CREATE INDEX IF NOT EXISTS idx_scraped_posts_embedding_status
  ON scraped_posts(embedding_status)
  WHERE embedding_status != 'completed';

COMMENT ON INDEX idx_scraped_posts_embedding_ivfflat IS 'IVFFlat index for fast cosine similarity search on embeddings';

-- ============================================
-- 4. Create Embedding Generation Queue View
-- ============================================

-- View: Posts pending embedding generation
CREATE OR REPLACE VIEW v_embedding_queue AS
SELECT
  id,
  post_id,
  title,
  body_text,
  word_count,
  comments,
  comment_count,
  embedding_status,
  embedding_retry_count,
  scraped_at,
  -- Calculate priority score (newer posts with more engagement)
  (score + comment_count * 2) *
    EXTRACT(EPOCH FROM (NOW() - scraped_at)) / 86400 as priority_score
FROM scraped_posts
WHERE embedding_status IN ('pending', 'failed')
  AND embedding_retry_count < 3
ORDER BY priority_score DESC;

COMMENT ON VIEW v_embedding_queue IS 'Posts needing embeddings, prioritized by recency and engagement';

-- ============================================
-- 5. Create Semantic Search Functions
-- ============================================

-- Function: Find similar posts using cosine similarity
CREATE OR REPLACE FUNCTION find_similar_posts(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 10,
  filter_role VARCHAR DEFAULT NULL,
  filter_level VARCHAR DEFAULT NULL,
  filter_outcome VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  post_id VARCHAR,
  title TEXT,
  similarity FLOAT,
  role_type VARCHAR,
  level VARCHAR,
  outcome VARCHAR,
  company VARCHAR,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.post_id,
    p.title,
    1 - (p.embedding <=> query_embedding) as similarity,
    p.role_type,
    p.level,
    p.outcome,
    p.metadata->>'company' as company,
    p.created_at
  FROM scraped_posts p
  WHERE p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
    AND (filter_role IS NULL OR p.role_type = filter_role)
    AND (filter_level IS NULL OR p.level = filter_level)
    AND (filter_outcome IS NULL OR p.outcome = filter_outcome)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_similar_posts IS 'Semantic search using cosine similarity with optional filters';

-- Function: Hybrid search (combines vector similarity + keyword match)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding vector(1536),
  query_text TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id INTEGER,
  post_id VARCHAR,
  title TEXT,
  similarity FLOAT,
  keyword_rank FLOAT,
  hybrid_score FLOAT,
  role_type VARCHAR,
  level VARCHAR,
  company VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT
      p.id,
      p.post_id,
      p.title,
      1 - (p.embedding <=> query_embedding) as similarity,
      p.role_type,
      p.level,
      p.metadata->>'company' as company
    FROM scraped_posts p
    WHERE p.embedding IS NOT NULL
      AND 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword_search AS (
    SELECT
      p.id,
      ts_rank(
        to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.body_text, '')),
        plainto_tsquery('english', query_text)
      ) as rank
    FROM scraped_posts p
    WHERE to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.body_text, ''))
      @@ plainto_tsquery('english', query_text)
  )
  SELECT
    v.id,
    v.post_id,
    v.title,
    v.similarity,
    COALESCE(k.rank, 0) as keyword_rank,
    (v.similarity * 0.7 + COALESCE(k.rank, 0) * 0.3) as hybrid_score,
    v.role_type,
    v.level,
    v.company
  FROM vector_search v
  LEFT JOIN keyword_search k ON v.id = k.id
  ORDER BY hybrid_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION hybrid_search IS 'Combines vector similarity (70%) and keyword matching (30%)';

-- ============================================
-- 6. Create Embedding Statistics View
-- ============================================

CREATE OR REPLACE VIEW v_embedding_stats AS
SELECT
  COUNT(*) as total_posts,
  COUNT(embedding) as posts_with_embeddings,
  COUNT(*) FILTER (WHERE embedding_status = 'pending') as pending_embeddings,
  COUNT(*) FILTER (WHERE embedding_status = 'processing') as processing_embeddings,
  COUNT(*) FILTER (WHERE embedding_status = 'failed') as failed_embeddings,
  COUNT(*) FILTER (WHERE embedding_status = 'completed') as completed_embeddings,
  ROUND(100.0 * COUNT(embedding) / NULLIF(COUNT(*), 0), 2) as embedding_coverage_pct,
  MAX(embedding_generated_at) as last_embedding_generated,
  AVG(EXTRACT(EPOCH FROM (embedding_generated_at - scraped_at))) as avg_embedding_delay_seconds
FROM scraped_posts;

COMMENT ON VIEW v_embedding_stats IS 'Real-time statistics on embedding generation coverage';

-- ============================================
-- 7. Create Interview Question Embeddings Table
-- ============================================

-- Separate table for extracted interview questions with embeddings
CREATE TABLE IF NOT EXISTS interview_questions (
  id SERIAL PRIMARY KEY,
  post_id VARCHAR(50) REFERENCES scraped_posts(post_id),
  question_text TEXT NOT NULL,
  question_type VARCHAR(50), -- coding, system_design, behavioral, trivia
  difficulty VARCHAR(20), -- easy, medium, hard
  category VARCHAR(100), -- algorithms, databases, distributed_systems, etc.

  -- Embedding
  embedding vector(1536),
  embedding_generated_at TIMESTAMP,

  -- Metadata
  role_type VARCHAR(50),
  level VARCHAR(10),
  company VARCHAR(100),
  interview_stage VARCHAR(50),

  -- Source tracking
  extracted_from TEXT, -- 'title', 'body', 'comments'
  extraction_confidence FLOAT,
  extracted_at TIMESTAMP DEFAULT NOW(),

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_by INTEGER,
  verified_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for interview_questions
CREATE INDEX IF NOT EXISTS idx_interview_questions_post_id ON interview_questions(post_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_type ON interview_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_interview_questions_difficulty ON interview_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_interview_questions_company ON interview_questions(company);
CREATE INDEX IF NOT EXISTS idx_interview_questions_role ON interview_questions(role_type, level);

-- Vector index for question similarity search
CREATE INDEX IF NOT EXISTS idx_interview_questions_embedding_ivfflat
  ON interview_questions
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

COMMENT ON TABLE interview_questions IS 'Extracted interview questions with embeddings for semantic search';

-- ============================================
-- 8. Create Learning Path Embeddings Table
-- ============================================

-- For AI-generated learning maps with embeddings
CREATE TABLE IF NOT EXISTS learning_topics (
  id SERIAL PRIMARY KEY,
  topic_name VARCHAR(200) NOT NULL UNIQUE,
  topic_category VARCHAR(100),
  description TEXT,

  -- Embedding for topic matching
  embedding vector(1536),
  embedding_generated_at TIMESTAMP,

  -- Metadata
  difficulty_level VARCHAR(20),
  estimated_hours INTEGER,
  prerequisites TEXT[],
  related_topics TEXT[],

  -- Statistics from interview data
  mention_count INTEGER DEFAULT 0,
  roles TEXT[], -- which roles need this topic
  companies TEXT[], -- which companies ask about it

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for learning_topics
CREATE INDEX IF NOT EXISTS idx_learning_topics_category ON learning_topics(topic_category);
CREATE INDEX IF NOT EXISTS idx_learning_topics_difficulty ON learning_topics(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_topics_embedding_ivfflat
  ON learning_topics
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

COMMENT ON TABLE learning_topics IS 'Hierarchical learning topics extracted from interview data';

-- ============================================
-- 9. Helper Functions for Embedding Pipeline
-- ============================================

-- Function: Mark embedding generation started
CREATE OR REPLACE FUNCTION start_embedding_generation(p_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE scraped_posts
  SET
    embedding_status = 'processing',
    updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark embedding generation completed
CREATE OR REPLACE FUNCTION complete_embedding_generation(
  p_id INTEGER,
  p_embedding vector(1536),
  p_title_embedding vector(1536),
  p_model VARCHAR DEFAULT 'text-embedding-3-small'
)
RETURNS VOID AS $$
BEGIN
  UPDATE scraped_posts
  SET
    embedding = p_embedding,
    title_embedding = p_title_embedding,
    embedding_model = p_model,
    embedding_status = 'completed',
    embedding_generated_at = NOW(),
    embedding_error = NULL,
    updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark embedding generation failed
CREATE OR REPLACE FUNCTION fail_embedding_generation(
  p_id INTEGER,
  p_error TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE scraped_posts
  SET
    embedding_status = 'failed',
    embedding_error = p_error,
    embedding_retry_count = embedding_retry_count + 1,
    updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. Create RAG Context Building Function
-- ============================================

-- Function: Build RAG context for a query
CREATE OR REPLACE FUNCTION build_rag_context(
  query_embedding vector(1536),
  query_filters JSONB DEFAULT '{}'::jsonb,
  max_posts INTEGER DEFAULT 5
)
RETURNS TABLE (
  post_id VARCHAR,
  title TEXT,
  body_text TEXT,
  similarity FLOAT,
  role_type VARCHAR,
  level VARCHAR,
  company VARCHAR,
  outcome VARCHAR,
  interview_topics JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.post_id,
    p.title,
    p.body_text,
    1 - (p.embedding <=> query_embedding) as similarity,
    p.role_type,
    p.level,
    p.metadata->>'company' as company,
    p.outcome,
    p.interview_topics
  FROM scraped_posts p
  WHERE p.embedding IS NOT NULL
    -- Apply dynamic filters from JSONB
    AND (
      query_filters->>'role_type' IS NULL
      OR p.role_type = query_filters->>'role_type'
    )
    AND (
      query_filters->>'level' IS NULL
      OR p.level = query_filters->>'level'
    )
    AND (
      query_filters->>'outcome' IS NULL
      OR p.outcome = query_filters->>'outcome'
    )
  ORDER BY p.embedding <=> query_embedding
  LIMIT max_posts;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION build_rag_context IS 'Retrieve top-k most relevant posts for RAG prompt context';

-- ============================================
-- 11. Migration Completion
-- ============================================

-- Set existing posts to pending for embedding generation
UPDATE scraped_posts
SET embedding_status = 'pending'
WHERE embedding_status IS NULL;

-- Log migration success
DO $$
DECLARE
  post_count INTEGER;
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO post_count FROM scraped_posts;
  SELECT COUNT(*) INTO pending_count FROM scraped_posts WHERE embedding_status = 'pending';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'Phase 6: RAG Database Migration Completed';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'pgvector extension: ENABLED';
  RAISE NOTICE 'Total posts: %', post_count;
  RAISE NOTICE 'Posts pending embeddings: %', pending_count;
  RAISE NOTICE 'Embedding dimensions: 1536 (OpenAI text-embedding-3-small)';
  RAISE NOTICE 'Vector indexes created: 3 (IVFFlat)';
  RAISE NOTICE 'Semantic search functions: 4';
  RAISE NOTICE 'New tables: interview_questions, learning_topics';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run embedding generation pipeline';
  RAISE NOTICE '2. Test semantic search with find_similar_posts()';
  RAISE NOTICE '3. Try hybrid search with hybrid_search()';
  RAISE NOTICE '============================================';
END $$;
