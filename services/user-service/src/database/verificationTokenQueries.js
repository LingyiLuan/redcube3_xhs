/**
 * Email Verification Token Database Queries
 *
 * Handles all database operations for email verification tokens
 * Based on industry best practices (2025):
 * - Tokens are hashed before storage
 * - 24-hour expiration window
 * - Automatic cleanup of expired tokens
 *
 * NOTE: Tokens are stored in the users table columns:
 * - verification_token (varchar(255))
 * - verification_token_expires (timestamp)
 * - email_verified (boolean)
 */

const pool = require('./connection');
const { hashToken, isTokenExpired, generateTokenExpiration } = require('../utils/tokenUtils');

/**
 * Create a new verification token for a user
 * @param {number} userId - User ID
 * @param {string} token - Plaintext verification token
 * @param {Object} client - Optional database client (for transactions)
 * @returns {Promise<Object>} - Created token record
 */
async function createVerificationToken(userId, token, client = null) {
  const hashedToken = hashToken(token);
  const expiresAt = generateTokenExpiration(24); // 24 hours

  const query = `
    UPDATE users
    SET verification_token = $1,
        verification_token_expires = $2,
        updated_at = NOW()
    WHERE id = $3
    RETURNING id, verification_token_expires
  `;

  try {
    // Use provided client (for transactions) or pool
    const dbClient = client || pool;
    const result = await dbClient.query(query, [hashedToken, expiresAt, userId]);

    if (result.rows.length === 0) {
      throw new Error(`User ${userId} not found`);
    }

    console.log('[VerificationTokenQueries] Token created for user:', userId);
    return {
      user_id: userId,
      expires_at: result.rows[0].verification_token_expires
    };
  } catch (error) {
    console.error('[VerificationTokenQueries] Error creating token:', error);
    throw error;
  }
}

/**
 * Find a verification token by plaintext token
 * @param {string} token - Plaintext verification token
 * @returns {Promise<Object|null>} - Token record or null if not found
 */
async function findVerificationToken(token) {
  const hashedToken = hashToken(token);

  const query = `
    SELECT id, verification_token, verification_token_expires
    FROM users
    WHERE verification_token = $1
      AND is_active = true
  `;

  try {
    const result = await pool.query(query, [hashedToken]);

    if (result.rows.length === 0) {
      console.log('[VerificationTokenQueries] Token not found');
      return null;
    }

    const user = result.rows[0];

    // Check if token is expired
    if (isTokenExpired(user.verification_token_expires)) {
      console.log('[VerificationTokenQueries] Token expired:', {
        userId: user.id,
        expiresAt: user.verification_token_expires
      });
      return null;
    }

    console.log('[VerificationTokenQueries] Token found for user:', user.id);
    return {
      id: user.id, // Token ID not needed, using user ID
      user_id: user.id,
      expires_at: user.verification_token_expires
    };
  } catch (error) {
    console.error('[VerificationTokenQueries] Error finding token:', error);
    throw error;
  }
}

/**
 * Delete a verification token (after use or expiration)
 * @param {number} userId - User ID (NOT token ID, since tokens are in users table)
 * @returns {Promise<boolean>} - True if deleted, false otherwise
 */
async function deleteVerificationToken(userId) {
  const query = `
    UPDATE users
    SET verification_token = NULL,
        verification_token_expires = NULL,
        updated_at = NOW()
    WHERE id = $1
  `;

  try {
    const result = await pool.query(query, [userId]);
    const deleted = result.rowCount > 0;

    if (deleted) {
      console.log('[VerificationTokenQueries] Token cleared for user:', userId);
    } else {
      console.log('[VerificationTokenQueries] User not found for token deletion:', userId);
    }

    return deleted;
  } catch (error) {
    console.error('[VerificationTokenQueries] Error deleting token:', error);
    throw error;
  }
}

/**
 * Delete all verification tokens for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} - Number of tokens deleted (will be 0 or 1)
 */
async function deleteAllUserTokens(userId) {
  // Same as deleteVerificationToken since tokens are in users table
  const deleted = await deleteVerificationToken(userId);
  return deleted ? 1 : 0;
}

/**
 * Delete all expired verification tokens (cleanup utility)
 * @returns {Promise<number>} - Number of expired tokens deleted
 */
async function deleteExpiredTokens() {
  const query = `
    UPDATE users
    SET verification_token = NULL,
        verification_token_expires = NULL,
        updated_at = NOW()
    WHERE verification_token_expires < NOW()
      AND verification_token IS NOT NULL
  `;

  try {
    const result = await pool.query(query);
    console.log('[VerificationTokenQueries] Cleared expired tokens:', result.rowCount);
    return result.rowCount;
  } catch (error) {
    console.error('[VerificationTokenQueries] Error deleting expired tokens:', error);
    throw error;
  }
}

/**
 * Get all verification tokens for a user (for debugging/admin purposes)
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of token records (will be 0 or 1)
 */
async function getUserTokens(userId) {
  const query = `
    SELECT id, verification_token, verification_token_expires, created_at
    FROM users
    WHERE id = $1
      AND verification_token IS NOT NULL
  `;

  try {
    const result = await pool.query(query, [userId]);
    const tokens = result.rows.length > 0 ? [{
      id: result.rows[0].id,
      user_id: result.rows[0].id,
      expires_at: result.rows[0].verification_token_expires,
      created_at: result.rows[0].created_at
    }] : [];

    console.log('[VerificationTokenQueries] Found tokens for user:', {
      userId,
      count: tokens.length
    });
    return tokens;
  } catch (error) {
    console.error('[VerificationTokenQueries] Error getting user tokens:', error);
    throw error;
  }
}

module.exports = {
  createVerificationToken,
  findVerificationToken,
  deleteVerificationToken,
  deleteAllUserTokens,
  deleteExpiredTokens,
  getUserTokens
};
