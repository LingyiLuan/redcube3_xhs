-- Migration 28: Add Email/Password Authentication Support
-- This migration adds the necessary fields to support email/password authentication
-- alongside existing Google OAuth authentication

-- Add password authentication fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add email verification fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;

-- Add password reset fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Update existing Google OAuth users to have email_verified = true
UPDATE users SET email_verified = true WHERE google_id IS NOT NULL AND email_verified = false;

-- Add comments for documentation
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash of user password (nullable for OAuth-only users)';
COMMENT ON COLUMN users.email_verified IS 'Whether the user email has been verified (auto-true for OAuth users)';
COMMENT ON COLUMN users.verification_token IS 'Token for email verification (used during registration)';
COMMENT ON COLUMN users.verification_token_expires IS 'Expiration timestamp for verification token';
COMMENT ON COLUMN users.password_reset_token IS 'Token for password reset flow';
COMMENT ON COLUMN users.password_reset_expires IS 'Expiration timestamp for password reset token';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 28: Email/Password authentication fields added successfully';
END $$;
