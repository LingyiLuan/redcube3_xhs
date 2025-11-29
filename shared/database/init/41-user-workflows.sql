-- Migration 41: User Workflows Library
-- Stores saved workflow canvases per user for Workflow Lab history

CREATE TABLE IF NOT EXISTS user_workflows (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  workflow_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_workflows_user_id
  ON user_workflows (user_id);

CREATE INDEX IF NOT EXISTS idx_user_workflows_updated_at
  ON user_workflows (updated_at DESC);

-- Trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_workflows_updated_at ON user_workflows;
CREATE TRIGGER trg_user_workflows_updated_at
  BEFORE UPDATE ON user_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_user_workflows_updated_at();

