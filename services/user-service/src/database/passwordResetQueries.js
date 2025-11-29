/**
 * Password Reset Database Queries
 *
 * Handles all database operations for password reset functionality
 * Based on industry best practices (2025):
 * - Tokens are SHA-256 hashed before storage
 * - 24-hour expiration window
 * - Single-use tokens
 * - Rate limiting support
 *
 * Security standards from:
 * - OWASP Forgot Password Cheat Sheet
 * - Auth0 Password Reset Flow
 * - GitHub, Google, Microsoft 2025 standards
 */

const pool = require('./connection');
const { hashToken, isTokenExpired, generateTokenExpiration } = require('../utils/tokenUtils');

/**
 * Create a password reset token for a user
 * @param {number} userId - User ID
 * @param {string} token - Plaintext reset token (64+ characters)
 * @returns {Promise<Object>} - Created token record
 */
async function createPasswordResetToken(userId, token) {
  const hashedToken = hashToken(token);
  const expiresAt = generateTokenExpiration(24); // 24 hours

  const query = `
    UPDATE users
    SET reset_token = $1,
        reset_token_expires = $2,
        updated_at = NOW()
    WHERE id = $3
    RETURNING id, reset_token_expires
  `;

  try {
    const result = await pool.query(query, [hashedToken, expiresAt, userId]);

    if (result.rows.length === 0) {
      throw new Error(`User ${userId} not found`);
    }

    console.log('[PasswordResetQueries] Reset token created for user:', userId);
    return {
      user_id: userId,
      expires_at: result.rows[0].reset_token_expires
    };
  } catch (error) {
    console.error('[PasswordResetQueries] Error creating token:', error);
    throw error;
  }
}

/**
 * Find a password reset token by plaintext token
 * @param {string} token - Plaintext reset token
 * @returns {Promise<Object|null>} - Token record or null if not found/expired
 */
async function findPasswordResetToken(token) {
  const hashedToken = hashToken(token);

  const query = `
    SELECT id, reset_token, reset_token_expires
    FROM users
    WHERE reset_token = $1
      AND is_active = true
  `;

  try {
    const result = await pool.query(query, [hashedToken]);

    if (result.rows.length === 0) {
      console.log('[PasswordResetQueries] Reset token not found');
      return null;
    }

    const user = result.rows[0];

    // Check if token is expired
    if (isTokenExpired(user.reset_token_expires)) {
      console.log('[PasswordResetQueries] Reset token expired:', {
        userId: user.id,
        expiresAt: user.reset_token_expires
      });
      return null;
    }

    console.log('[PasswordResetQueries] Reset token found for user:', user.id);
    return {
      user_id: user.id,
      expires_at: user.reset_token_expires
    };
  } catch (error) {
    console.error('[PasswordResetQueries] Error finding token:', error);
    throw error;
  }
}

/**
 * Delete a password reset token (after use or expiration)
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if deleted, false otherwise
 */
async function deletePasswordResetToken(userId) {
  const query = `
    UPDATE users
    SET reset_token = NULL,
        reset_token_expires = NULL,
        updated_at = NOW()
    WHERE id = $1
  `;

  try {
    const result = await pool.query(query, [userId]);
    const deleted = result.rowCount > 0;

    if (deleted) {
      console.log('[PasswordResetQueries] Reset token cleared for user:', userId);
    } else {
      console.log('[PasswordResetQueries] User not found for token deletion:', userId);
    }

    return deleted;
  } catch (error) {
    console.error('[PasswordResetQueries] Error deleting token:', error);
    throw error;
  }
}

/**
 * Delete all expired password reset tokens (cleanup utility)
 * @returns {Promise<number>} - Number of expired tokens deleted
 */
async function deleteExpiredResetTokens() {
  const query = `
    UPDATE users
    SET reset_token = NULL,
        reset_token_expires = NULL,
        updated_at = NOW()
    WHERE reset_token_expires < NOW()
      AND reset_token IS NOT NULL
  `;

  try {
    const result = await pool.query(query);
    console.log('[PasswordResetQueries] Cleared expired reset tokens:', result.rowCount);
    return result.rowCount;
  } catch (error) {
    console.error('[PasswordResetQueries] Error deleting expired tokens:', error);
    throw error;
  }
}

/**
 * Log a password reset attempt (for rate limiting)
 * @param {string} email - Email address
 * @param {string} ipAddress - IP address of requester
 * @param {boolean} success - Whether the request was successful
 * @returns {Promise<Object>} - Created attempt record
 */
async function logPasswordResetAttempt(email, ipAddress, success = false) {
  const query = `
    INSERT INTO password_reset_attempts (email, ip_address, success)
    VALUES ($1, $2, $3)
    RETURNING id, attempted_at
  `;

  try {
    const result = await pool.query(query, [email, ipAddress, success]);
    console.log('[PasswordResetQueries] Logged reset attempt:', {
      email,
      ipAddress,
      success
    });
    return result.rows[0];
  } catch (error) {
    console.error('[PasswordResetQueries] Error logging attempt:', error);
    throw error;
  }
}

/**
 * Get recent password reset attempts for rate limiting
 * @param {string} email - Email address
 * @param {number} hoursWindow - Time window in hours (default 1 hour)
 * @returns {Promise<number>} - Number of attempts in time window
 */
async function getRecentResetAttempts(email, hoursWindow = 1) {
  const query = `
    SELECT COUNT(*) as attempt_count
    FROM password_reset_attempts
    WHERE email = $1
      AND attempted_at > NOW() - INTERVAL '${hoursWindow} hours'
  `;

  try {
    const result = await pool.query(query, [email]);
    const count = parseInt(result.rows[0].attempt_count);

    console.log('[PasswordResetQueries] Recent attempts for email:', {
      email,
      count,
      window: `${hoursWindow} hours`
    });

    return count;
  } catch (error) {
    console.error('[PasswordResetQueries] Error getting recent attempts:', error);
    throw error;
  }
}

/**
 * Get recent password reset attempts by IP for rate limiting
 * @param {string} ipAddress - IP address
 * @param {number} hoursWindow - Time window in hours (default 1 hour)
 * @returns {Promise<number>} - Number of attempts in time window
 */
async function getRecentResetAttemptsByIP(ipAddress, hoursWindow = 1) {
  const query = `
    SELECT COUNT(*) as attempt_count
    FROM password_reset_attempts
    WHERE ip_address = $1
      AND attempted_at > NOW() - INTERVAL '${hoursWindow} hours'
  `;

  try {
    const result = await pool.query(query, [ipAddress]);
    const count = parseInt(result.rows[0].attempt_count);

    console.log('[PasswordResetQueries] Recent attempts for IP:', {
      ipAddress,
      count,
      window: `${hoursWindow} hours`
    });

    return count;
  } catch (error) {
    console.error('[PasswordResetQueries] Error getting recent IP attempts:', error);
    throw error;
  }
}

module.exports = {
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
  deleteExpiredResetTokens,
  logPasswordResetAttempt,
  getRecentResetAttempts,
  getRecentResetAttemptsByIP
};
