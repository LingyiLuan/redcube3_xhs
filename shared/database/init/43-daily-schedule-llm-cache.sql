--
-- Daily Schedule LLM Cache
-- Date: 2025-12-02
-- Caches LLM-enhanced daily schedule content for hybrid approach
-- LLM generates once, then content is served from cache for speed
--

-- Create table for caching LLM-enhanced schedule content
CREATE TABLE IF NOT EXISTS daily_schedule_llm_cache (
  id SERIAL PRIMARY KEY,

  -- Cache key components
  cache_key VARCHAR(255) UNIQUE NOT NULL,  -- Hash of focus_area + week_number + problems
  focus_area VARCHAR(100) NOT NULL,
  week_number INTEGER NOT NULL,
  problem_numbers INTEGER[] DEFAULT '{}',  -- LeetCode problem numbers used

  -- LLM-enhanced content (the "why" and educational value)
  enhanced_slots JSONB NOT NULL,  -- Array of enhanced time slots with educational content
  problem_insights JSONB DEFAULT '{}',  -- Problem-specific insights (why each matters)
  learning_objectives JSONB DEFAULT '[]',  -- Daily learning objectives
  pattern_connections JSONB DEFAULT '[]',  -- Connections between problems
  personalized_tips JSONB DEFAULT '[]',  -- Week/progress-based advice

  -- Metadata
  model_used VARCHAR(100) DEFAULT 'openrouter',
  tokens_used INTEGER DEFAULT 0,
  generation_time_ms INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_schedule_cache_key ON daily_schedule_llm_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_schedule_cache_focus_week ON daily_schedule_llm_cache(focus_area, week_number);
CREATE INDEX IF NOT EXISTS idx_schedule_cache_expires ON daily_schedule_llm_cache(expires_at);

-- Comments
COMMENT ON TABLE daily_schedule_llm_cache IS 'Caches LLM-enhanced daily schedule content for fast retrieval';
COMMENT ON COLUMN daily_schedule_llm_cache.cache_key IS 'Unique key: hash of focus_area + week_number + sorted problem numbers';
COMMENT ON COLUMN daily_schedule_llm_cache.enhanced_slots IS 'Array of time slots with LLM-enhanced descriptions, "why" explanations, and learning tips';
COMMENT ON COLUMN daily_schedule_llm_cache.problem_insights IS 'Object mapping problem numbers to insights: why it matters, patterns taught, common mistakes';
COMMENT ON COLUMN daily_schedule_llm_cache.learning_objectives IS 'Array of learning objectives for the day/week';
COMMENT ON COLUMN daily_schedule_llm_cache.pattern_connections IS 'Array showing how problems connect to each other and to interview patterns';
COMMENT ON COLUMN daily_schedule_llm_cache.personalized_tips IS 'Array of tips based on week number and expected progress';
