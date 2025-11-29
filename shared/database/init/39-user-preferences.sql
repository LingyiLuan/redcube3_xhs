/**
 * User Preferences Schema
 *
 * Stores user settings for:
 * - Email notifications (marketing/activity emails)
 * - Weekly digest subscription
 * - Theme preference (light/dark/auto)
 * - Account deletion scheduling
 */

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,

  -- Appearance preferences
  theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add deletion scheduling columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Index for cron job to find accounts scheduled for deletion
CREATE INDEX IF NOT EXISTS idx_users_deletion_scheduled
ON users(deletion_scheduled_at)
WHERE deletion_scheduled_at IS NOT NULL;

-- Function to auto-create preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences when user is created
DROP TRIGGER IF EXISTS trigger_create_user_preferences ON users;
CREATE TRIGGER trigger_create_user_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_user_preferences();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_user_preferences_timestamp ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_preferences_timestamp();

COMMENT ON TABLE user_preferences IS 'User preferences for notifications, theme, and other settings';
COMMENT ON COLUMN user_preferences.email_notifications IS 'Receive marketing and activity emails (transactional emails always sent)';
COMMENT ON COLUMN user_preferences.weekly_digest IS 'Receive weekly digest email with trending posts and insights';
COMMENT ON COLUMN user_preferences.theme IS 'UI theme preference: light, dark, or auto (system)';
COMMENT ON COLUMN users.deletion_scheduled_at IS 'When account is scheduled for permanent deletion (14-day grace period)';
COMMENT ON COLUMN users.deletion_reason IS 'User-provided reason for account deletion';
