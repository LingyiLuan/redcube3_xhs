-- Migration 35: Add LinkedIn URL to users table
-- Adds linkedin_url field for storing user's LinkedIn profile link

\c redcube_users;

-- Add linkedin_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);

-- Create index for performance (if users search by LinkedIn URL)
CREATE INDEX IF NOT EXISTS idx_users_linkedin_url ON users(linkedin_url);

-- Add comment
COMMENT ON COLUMN users.linkedin_url IS 'User LinkedIn profile URL (for OAuth and profile display)';
