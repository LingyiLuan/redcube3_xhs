-- Phase 3: Migrate existing users table for Google OAuth authentication
\c redcube_users;

-- Add Google OAuth fields to existing users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users to be active by default
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Make password_hash optional for OAuth users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Make first_name and last_name optional for OAuth users
ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;

-- Add indexes for new Google OAuth fields
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Create a function to generate display_name from existing users
UPDATE users SET display_name = CONCAT(first_name, ' ', last_name)
WHERE display_name IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL;