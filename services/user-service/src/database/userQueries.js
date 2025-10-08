const pool = require('./connection');

/**
 * User database queries for authentication and user management
 */

/**
 * Find user by Google ID
 */
async function findUserByGoogleId(googleId) {
  const query = 'SELECT * FROM users WHERE google_id = $1 AND is_active = true';
  const result = await pool.query(query, [googleId]);
  return result.rows[0] || null;
}

/**
 * Find user by ID
 */
async function findUserById(id) {
  const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Find user by email
 */
async function findUserByEmail(email) {
  const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

/**
 * Create new user from Google OAuth data
 */
async function createUserFromGoogle(userData) {
  const {
    google_id,
    email,
    display_name,
    avatar_url,
    first_name,
    last_name
  } = userData;

  const query = `
    INSERT INTO users (
      google_id,
      email,
      display_name,
      avatar_url,
      first_name,
      last_name,
      role,
      status,
      is_active,
      last_login,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 'candidate', 'active', true, NOW(), NOW(), NOW())
    RETURNING id, google_id, email, display_name, avatar_url, role, status, created_at
  `;

  const values = [
    google_id,
    email,
    display_name,
    avatar_url,
    first_name,
    last_name
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Update user's last login timestamp
 */
async function updateUserLastLogin(userId) {
  const query = `
    UPDATE users
    SET last_login = NOW(), updated_at = NOW()
    WHERE id = $1 AND is_active = true
    RETURNING id, google_id, email, display_name, avatar_url, role, status, last_login
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

/**
 * Update user profile information
 */
async function updateUserProfile(userId, updates) {
  const allowedFields = ['display_name', 'avatar_url', 'first_name', 'last_name'];
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  // Build dynamic update query
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateFields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(userId);

  const query = `
    UPDATE users
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount} AND is_active = true
    RETURNING id, google_id, email, display_name, avatar_url, role, status, updated_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Deactivate user account
 */
async function deactivateUser(userId) {
  const query = `
    UPDATE users
    SET is_active = false, updated_at = NOW()
    WHERE id = $1
    RETURNING id, email, is_active
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

/**
 * Get user statistics (for admin purposes)
 */
async function getUserStats() {
  const query = `
    SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE is_active = true) as active_users,
      COUNT(*) FILTER (WHERE google_id IS NOT NULL) as google_users,
      COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '30 days') as recent_logins,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week
    FROM users
  `;

  const result = await pool.query(query);
  return result.rows[0];
}

module.exports = {
  findUserByGoogleId,
  findUserById,
  findUserByEmail,
  createUserFromGoogle,
  updateUserLastLogin,
  updateUserProfile,
  deactivateUser,
  getUserStats
};