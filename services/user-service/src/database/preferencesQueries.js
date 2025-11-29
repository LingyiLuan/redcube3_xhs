const pool = require('./connection');

/**
 * User preferences database queries
 * Following node-postgres project structure best practices
 */

/**
 * Get user preferences with default fallback
 * Returns defaults if no record exists
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - User preferences
 */
async function getUserPreferences(userId) {
  const query = `
    SELECT
      email_notifications,
      weekly_digest,
      theme,
      created_at,
      updated_at
    FROM user_preferences
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);

  // Return defaults if no preferences exist
  if (result.rows.length === 0) {
    return {
      email_notifications: true,
      weekly_digest: true,
      theme: 'light'
    };
  }

  return result.rows[0];
}

/**
 * Update user preferences using UPSERT pattern
 * Handles partial updates efficiently
 * @param {number} userId - User ID
 * @param {Object} updates - Preference fields to update
 * @returns {Promise<Object>} - Updated preferences
 */
async function updateUserPreferences(userId, updates) {
  const allowedFields = ['email_notifications', 'weekly_digest', 'theme'];
  const fields = [];
  const values = [];

  // Validate and build fields array
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(key);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  // Add user_id as last parameter
  values.push(userId);

  // Build parameterized placeholders for INSERT
  const insertPlaceholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  // Build SET clause for UPDATE
  const updateSets = fields.map((field, i) => `${field} = EXCLUDED.${field}`).join(', ');

  // UPSERT query (INSERT ... ON CONFLICT ... DO UPDATE)
  const query = `
    INSERT INTO user_preferences (user_id, ${fields.join(', ')})
    VALUES ($${values.length}, ${insertPlaceholders})
    ON CONFLICT (user_id) DO UPDATE SET
      ${updateSets},
      updated_at = NOW()
    RETURNING
      email_notifications,
      weekly_digest,
      theme,
      updated_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Delete user preferences (reset to defaults)
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Deleted preferences
 */
async function deleteUserPreferences(userId) {
  const query = 'DELETE FROM user_preferences WHERE user_id = $1 RETURNING *';
  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  deleteUserPreferences
};
