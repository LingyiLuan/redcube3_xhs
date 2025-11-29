/**
 * Token Generation Utilities
 *
 * Provides secure token generation for email verification
 * Based on industry best practices (2025):
 * - Uses crypto.randomBytes for cryptographic randomness
 * - SHA-256 hashing for secure storage
 * - 24-hour token expiration standard
 */

const crypto = require('crypto');

/**
 * Generate a secure random verification token
 * @returns {string} - 64-character hex string
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure random password reset token
 * Following OWASP/Auth0 standards: 64+ characters, cryptographically random
 * @returns {string} - 64-character hex string
 */
function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token using SHA-256
 * @param {string} token - The plaintext token
 * @returns {string} - Hashed token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate token expiration timestamp
 * @param {number} hours - Number of hours until expiration (default: 24)
 * @returns {Date} - Expiration timestamp
 */
function generateTokenExpiration(hours = 24) {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + hours);
  return expiration;
}

/**
 * Verify if a token has expired
 * @param {Date} expiresAt - Token expiration timestamp
 * @returns {boolean} - True if expired, false otherwise
 */
function isTokenExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

module.exports = {
  generateVerificationToken,
  generatePasswordResetToken,
  hashToken,
  generateTokenExpiration,
  isTokenExpired
};
