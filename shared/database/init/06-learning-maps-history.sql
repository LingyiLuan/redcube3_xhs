-- Learning Maps History Table
-- Stores all generated learning maps for users

CREATE TABLE IF NOT EXISTS learning_maps_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL, -- References users(id) in redcube_users database

  -- Map metadata
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  difficulty VARCHAR(50),
  timeline_weeks INTEGER,
  is_crazy_plan BOOLEAN DEFAULT FALSE,

  -- Map content (JSONB for flexible storage)
  milestones JSONB DEFAULT '[]'::jsonb,
  outcomes JSONB DEFAULT '[]'::jsonb,
  next_steps JSONB DEFAULT '[]'::jsonb,

  -- Analysis metadata
  analysis_count INTEGER DEFAULT 0,
  analysis_ids JSONB DEFAULT '[]'::jsonb,
  user_goals JSONB DEFAULT '{}'::jsonb,
  personalization_score DECIMAL(3, 2),

  -- Status tracking
  status VARCHAR(50) DEFAULT 'active', -- active, archived, completed
  progress INTEGER DEFAULT 0, -- 0-100 percentage

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_viewed_at TIMESTAMP,

  -- Indexing for performance
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_learning_maps_user_id ON learning_maps_history(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_maps_created_at ON learning_maps_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_maps_status ON learning_maps_history(status);
CREATE INDEX IF NOT EXISTS idx_learning_maps_crazy_plan ON learning_maps_history(is_crazy_plan);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_learning_maps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER learning_maps_updated_at_trigger
  BEFORE UPDATE ON learning_maps_history
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_maps_updated_at();

-- Comments for documentation
COMMENT ON TABLE learning_maps_history IS 'Stores all generated learning maps with full history per user';
COMMENT ON COLUMN learning_maps_history.is_crazy_plan IS 'Whether this map was generated with CrazyPlan mode (aggressive 1-month timeline)';
COMMENT ON COLUMN learning_maps_history.milestones IS 'Array of milestone objects with week, title, description, skills, tasks, resources';
COMMENT ON COLUMN learning_maps_history.status IS 'Current status: active (default), archived (hidden but kept), completed (user finished)';
COMMENT ON COLUMN learning_maps_history.progress IS 'User-tracked completion percentage (0-100)';
