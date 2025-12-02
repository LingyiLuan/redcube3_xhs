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
 * Find user by email (case-insensitive)
 */
async function findUserByEmail(email) {
  const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)';
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
  console.log('[DB] updateUserLastLogin starting for userId:', userId);
  const query = `
    UPDATE users
    SET last_login = NOW(), updated_at = NOW()
    WHERE id = $1 AND is_active = true
    RETURNING id, google_id, email, display_name, avatar_url, role, status, last_login
  `;

  const result = await pool.query(query, [userId]);
  console.log('[DB] updateUserLastLogin completed, rows:', result.rows.length);
  return result.rows[0];
}

/**
 * Update user profile information
 */
async function updateUserProfile(userId, updates) {
  const allowedFields = ['display_name', 'avatar_url', 'first_name', 'last_name', 'linkedin_url'];
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
    RETURNING id, google_id, email, display_name, avatar_url, linkedin_url, role, status, updated_at
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

/**
 * Create new user with email/password
 * @param {string} email - User email
 * @param {string} passwordHash - Hashed password
 * @param {string} displayName - Display name
 * @param {Object} client - Optional database client (for transactions)
 * @returns {Promise<Object>} - Created user
 */
async function createUserWithEmail(email, passwordHash, displayName, client = null) {
  const query = `
    INSERT INTO users (
      email,
      password_hash,
      display_name,
      email_verified,
      role,
      status,
      is_active,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, false, 'candidate', 'active', true, NOW(), NOW())
    RETURNING id, email, display_name, role, status, email_verified, created_at
  `;

  const values = [email, passwordHash, displayName];
  // Use provided client (for transactions) or pool
  const dbClient = client || pool;
  const result = await dbClient.query(query, values);
  return result.rows[0];
}

/**
 * Verify user credentials for email/password login (case-insensitive)
 */
async function verifyUserCredentials(email) {
  const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true';
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

/**
 * Link Google account to existing email user
 */
async function linkGoogleAccount(userId, googleId, googleData) {
  const query = `
    UPDATE users
    SET
      google_id = $2,
      avatar_url = COALESCE(avatar_url, $3),
      email_verified = true,
      updated_at = NOW()
    WHERE id = $1 AND is_active = true
    RETURNING id, email, google_id, display_name, avatar_url, role, status
  `;

  const values = [userId, googleId, googleData.avatar_url];
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Add password to Google OAuth user
 */
async function addPasswordToUser(userId, passwordHash) {
  const query = `
    UPDATE users
    SET
      password_hash = $2,
      updated_at = NOW()
    WHERE id = $1 AND is_active = true
    RETURNING id, email, display_name, role, status
  `;

  const values = [userId, passwordHash];
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Update user fields (generic update for email_verified, status, etc.)
 */
async function updateUser(userId, updates) {
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  // Build dynamic update query
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      updateFields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(userId);

  const query = `
    UPDATE users
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, email, display_name, email_verified, role, status, updated_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Destroy all sessions for a user
 * This is used for security purposes after password reset
 * Forces user to log in again on all devices
 *
 * Note: This function is designed to be graceful - if the sessions table
 * doesn't exist yet, it logs a warning but doesn't fail. This follows
 * industry best practices (GitHub, Auth0) where password reset should
 * succeed even if session cleanup fails.
 *
 * @param {number} userId - User ID
 * @returns {Promise<number>} - Number of sessions destroyed (0 if table doesn't exist)
 */
async function destroyAllUserSessions(userId) {
  try {
    // First check if sessions table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'sessions'
      );
    `;

    const tableCheck = await pool.query(tableCheckQuery);
    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      console.log('[UserQueries] Sessions table does not exist yet, skipping session cleanup', {
        userId,
        note: 'Password reset will still succeed'
      });
      return 0;
    }

    // Table exists, proceed with deletion
    const deleteQuery = `
      DELETE FROM sessions
      WHERE sess->>'passport'->>'user' = $1
    `;

    const result = await pool.query(deleteQuery, [userId.toString()]);
    console.log('[UserQueries] Destroyed all sessions for user:', {
      userId,
      sessionsDestroyed: result.rowCount
    });
    return result.rowCount;
  } catch (error) {
    // Log warning but don't throw - allow password reset to succeed
    console.warn('[UserQueries] Warning: Could not destroy sessions (password reset will still succeed):', {
      userId,
      error: error.message
    });
    return 0;
  }
}

module.exports = {
  findUserByGoogleId,
  findUserById,
  findUserByEmail,
  createUserFromGoogle,
  updateUserLastLogin,
  updateUserProfile,
  deactivateUser,
  getUserStats,
  createUserWithEmail,
  verifyUserCredentials,
  linkGoogleAccount,
  addPasswordToUser,
  updateUser,
  destroyAllUserSessions
};