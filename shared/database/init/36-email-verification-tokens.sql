-- =====================================================
-- Email Verification Tokens Table
-- =====================================================
-- Purpose: Store secure tokens for email verification
-- Created: 2025-11-26
-- Best Practices:
--   - Tokens are hashed before storage for security
--   - 24-hour expiration standard
--   - ON DELETE CASCADE for automatic cleanup
--   - Indexes for performance
-- =====================================================

-- Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token
  ON email_verification_tokens(token);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id
  ON email_verification_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at
  ON email_verification_tokens(expires_at);

-- Add comment for documentation
COMMENT ON TABLE email_verification_tokens IS 'Stores secure tokens for email verification with 24-hour expiration';
COMMENT ON COLUMN email_verification_tokens.token IS 'Hashed verification token (generated using crypto.randomBytes)';
COMMENT ON COLUMN email_verification_tokens.expires_at IS 'Token expiration timestamp (24 hours from creation)';
