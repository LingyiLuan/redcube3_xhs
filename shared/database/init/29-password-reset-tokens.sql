/**
 * Password Reset Token Fields
 *
 * Adds password reset functionality following 2025 industry standards:
 * - SHA-256 hashed tokens (64+ characters)
 * - 24-hour expiration window
 * - Single-use tokens
 * - Email enumeration prevention
 *
 * Security best practices from:
 * - OWASP Forgot Password Cheat Sheet
 * - Auth0 Password Reset Flow
 * - GitHub, Google, Microsoft standards
 */

-- Add password reset fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Create password reset attempts tracking table for rate limiting
CREATE TABLE IF NOT EXISTS password_reset_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  attempted_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_reset_attempts_email_time ON password_reset_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_reset_attempts_ip_time ON password_reset_attempts(ip_address, attempted_at);

-- Add recovery email field (optional - for enhanced account recovery)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS recovery_email VARCHAR(255);

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 28: Password reset fields added successfully';
END $$;
