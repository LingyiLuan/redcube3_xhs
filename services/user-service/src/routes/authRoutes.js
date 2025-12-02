const express = require('express');
const passport = require('../config/passport');
const { getUserStats } = require('../database/userQueries');
const pool = require('../database/connection');
const {
  getUserPreferences,
  updateUserPreferences,
  deleteUserPreferences
} = require('../database/preferencesQueries');

const router = express.Router();

/**
 * Authentication routes for Google OAuth
 */

/**
 * Initiate Google OAuth login
 * GET /auth/google
 * Query params: returnUrl (optional) - URL to redirect to after successful login
 */
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'Google OAuth not configured',
      message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables'
    });
  }
  
  // Store returnUrl in session so we can use it in the callback
  if (req.query.returnUrl) {
    req.session.oauthReturnUrl = req.query.returnUrl;
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

/**
 * Google OAuth callback
 * GET /auth/google/callback
 */
router.get('/google/callback', (req, res, next) => {
  // Prevent duplicate callback processing (OAuth codes can only be used once)
  if (req.session && req.session.oauthProcessing) {
    console.log('[OAuth] Duplicate callback detected, redirecting to frontend');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(frontendUrl);
  }

  // Mark that we're processing OAuth
  if (req.session) {
    req.session.oauthProcessing = true;
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'Google OAuth not configured',
      message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables'
    });
  }

  passport.authenticate('google', {
    failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/login?error=auth_failed'
  })(req, res, (err) => {
    if (err) {
      if (req.session) req.session.oauthProcessing = false;
      return next(err);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const returnUrl = req.session?.oauthReturnUrl;

    if (req.session) {
      delete req.session.oauthReturnUrl;
    }

    console.log('[OAuth] Redirecting user to:', frontendUrl, {
      id: req.user.id,
      email: req.user.email,
      name: req.user.display_name,
      hasAvatar: !!req.user.avatar_url,
      sessionID: req.sessionID,
      returnUrl: returnUrl || 'none'
    });

    if (req.session && req.session.cookie) {
      req.session.cookie.secure = process.env.SESSION_COOKIE_SECURE === 'true';
      req.session.cookie.sameSite = 'none';
      req.session.cookie.path = '/';
      if (process.env.SESSION_COOKIE_DOMAIN) {
        req.session.cookie.domain = process.env.SESSION_COOKIE_DOMAIN;
      }
    }

    const redirectUrl = returnUrl ? `${frontendUrl}${returnUrl}` : `${frontendUrl}/`;

    req.session.save((err) => {
      if (err) {
        console.error('[OAuth] Session save error:', err);
      }
      delete req.session.oauthProcessing;
      console.log('[OAuth] Session saved, redirecting to:', redirectUrl);
      console.log('[OAuth] Session ID:', req.sessionID);
      console.log('[OAuth] Session cookie config:', req.session?.cookie);
      res.redirect(redirectUrl);
    });
  });
});

/**
 * LinkedIn OAuth Routes
 * NOTE: User must be logged in via Google before connecting LinkedIn
 */

/**
 * Initiate LinkedIn OAuth connection
 * GET /auth/linkedin
 */
router.get('/linkedin', requireAuth, (req, res, next) => {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'LinkedIn OAuth not configured',
      message: 'Please configure LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables'
    });
  }

  // Store user ID in session to connect later
  req.session.linkedinConnectUserId = req.user.id;

  console.log('[LinkedIn Init] Session state BEFORE OAuth redirect:', {
    sessionID: req.sessionID,
    userId: req.user.id,
    linkedinConnectUserId: req.session.linkedinConnectUserId,
    sessionKeys: Object.keys(req.session),
    cookie: {
      secure: req.session.cookie.secure,
      httpOnly: req.session.cookie.httpOnly,
      sameSite: req.session.cookie.sameSite,
      path: req.session.cookie.path
    }
  });

  passport.authenticate('linkedin')(req, res, next);
});

/**
 * LinkedIn OAuth callback
 * GET /auth/linkedin/callback
 */
router.get('/linkedin/callback', (req, res, next) => {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'LinkedIn OAuth not configured'
    });
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  console.log('[LinkedIn Callback] Session state ON RETURN from LinkedIn:', {
    sessionID: req.sessionID,
    linkedinConnectUserId: req.session?.linkedinConnectUserId,
    sessionKeys: Object.keys(req.session || {}),
    hasCookie: !!req.headers.cookie,
    cookieHeader: req.headers.cookie,
    queryParams: req.query
  });

  console.log('[LinkedIn Callback] Starting authentication...');

  passport.authenticate('linkedin', (err, user, info) => {
    console.log('[LinkedIn Callback] Authentication completed:', {
      hasError: !!err,
      hasUser: !!user,
      info: info,
      errorMessage: err?.message
    });

    if (err) {
      console.error('[LinkedIn] OAuth error:', err);
      return res.redirect(`${frontendUrl}/?linkedin=failed&error=${encodeURIComponent(err.message || 'Unknown error')}`);
    }

    if (!user) {
      console.error('[LinkedIn] No user returned from OAuth');
      return res.redirect(`${frontendUrl}/?linkedin=failed&error=no_user`);
    }

    // Manually log in the user
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('[LinkedIn] Login error:', loginErr);
        return res.redirect(`${frontendUrl}/?linkedin=failed&error=login_failed`);
      }

      console.log('[LinkedIn] Successfully connected for user:', user.email);
      // Redirect to profile page with success parameter
      res.redirect(`${frontendUrl}/profile?linkedin=success`);
    });
  })(req, res, next);
});

/**
 * Disconnect LinkedIn
 * POST /api/auth/linkedin/disconnect
 */
router.post('/linkedin/disconnect', requireAuth, async (req, res) => {
  try {
    const { updateUserProfile } = require('../database/userQueries');

    await updateUserProfile(req.user.id, {
      linkedin_url: null
    });

    console.log('[LinkedIn] Disconnected for user:', req.user.email);

    res.json({
      success: true,
      message: 'LinkedIn disconnected successfully'
    });
  } catch (error) {
    console.error('[LinkedIn] Disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect LinkedIn'
    });
  }
});

/**
 * Logout user
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Session cleanup failed' });
      }

      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

/**
 * Get current user information (protected route)
 * GET /api/auth/me
 *
 * Verifies that the user still exists in the database
 * If user has been deleted, destroys the session and returns 401
 * Matches industry standard (Google, GitHub, LinkedIn 2025)
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { findUserById } = require('../database/userQueries');

    // Verify user still exists in database
    const currentUser = await findUserById(req.user.id);

    if (!currentUser) {
      // User no longer exists - destroy session and return 401
      console.log('[Auth /me] User no longer exists, destroying session:', req.user.id);

      req.logout((err) => {
        if (err) {
          console.error('[Auth /me] Error during logout:', err);
        }
      });

      req.session.destroy((err) => {
        if (err) {
          console.error('[Auth /me] Error destroying session:', err);
        }
      });

      return res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'Your account no longer exists. Please sign in again.'
      });
    }

    // User exists - return user information
    const user = {
      id: currentUser.id,
      email: currentUser.email,
      display_name: currentUser.display_name,
      avatar_url: currentUser.avatar_url,
      linkedin_url: currentUser.linkedin_url,
      role: currentUser.role,
      last_login: currentUser.last_login,
      created_at: currentUser.created_at,
      deletion_scheduled_at: currentUser.deletion_scheduled_at || null
    };

    res.json({ user });
  } catch (error) {
    console.error('[Auth /me] Error fetching user:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch user information. Please try again.'
    });
  }
});

/**
 * Get user statistics (admin only)
 * GET /api/auth/stats
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await getUserStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { updateUserProfile } = require('../database/userQueries');
    const { display_name, avatar_url, linkedin_url } = req.body;

    // Validation
    const errors = [];

    // Validate display_name
    if (display_name !== undefined) {
      if (typeof display_name !== 'string' || display_name.trim().length < 2 || display_name.trim().length > 100) {
        errors.push('Display name must be between 2 and 100 characters');
      }
    }

    // Validate linkedin_url
    if (linkedin_url !== undefined && linkedin_url !== null && linkedin_url !== '') {
      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/[\w\-]+\/?$/i;
      if (!linkedinRegex.test(linkedin_url)) {
        errors.push('LinkedIn URL must be a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Build updates object
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name.trim();
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (linkedin_url !== undefined) {
      // Allow clearing linkedin_url by setting to empty string or null
      updates.linkedin_url = linkedin_url === '' ? null : linkedin_url;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    const updatedUser = await updateUserProfile(req.user.id, updates);

    console.log('[Profile] Updated user profile:', {
      userId: req.user.id,
      fields: Object.keys(updates)
    });

    res.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Email/Password Authentication Routes
 */

/**
 * Check if email is already registered
 * GET /api/auth/check-email
 */
router.get('/check-email', async (req, res) => {
  console.log('[Check Email] Route handler executing for:', req.query.email);
  console.log('[Check Email] Request method:', req.method);
  console.log('[Check Email] Request path:', req.path);

  try {
    const { email } = req.query;

    if (!email) {
      console.log('[Check Email] No email parameter provided');
      return res.status(400).json({
        success: false,
        error: 'Email parameter required'
      });
    }

    const { sanitizeEmail } = require('../utils/passwordUtils');
    const { findUserByEmail } = require('../database/userQueries');

    // Sanitize email before checking
    const sanitizedEmail = sanitizeEmail(email);
    console.log('[Check Email] Original email:', email);
    console.log('[Check Email] Sanitized email:', sanitizedEmail);

    // Check if user exists
    const existingUser = await findUserByEmail(sanitizedEmail);
    console.log('[Check Email] User lookup result:', existingUser ? 'FOUND' : 'NOT FOUND');
    if (existingUser) {
      console.log('[Check Email] Found user email:', existingUser.email);
    }

    const response = {
      exists: !!existingUser
    };
    console.log('[Check Email] Sending response:', response);

    res.json(response);
    console.log('[Check Email] Response sent successfully');

  } catch (error) {
    console.error('[Check Email] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check email availability'
    });
  }
});

/**
 * Register with email and password
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    const {
      hashPassword,
      validatePassword,
      validateEmail,
      sanitizeEmail
    } = require('../utils/passwordUtils');
    const {
      findUserByEmail,
      createUserWithEmail
    } = require('../database/userQueries');

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: emailValidation.errors
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: passwordValidation.errors
      });
    }

    // Validate display name
    if (!displayName || displayName.trim().length < 2 || displayName.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: ['Display name must be between 2 and 100 characters']
      });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Check if user already exists
    const existingUser = await findUserByEmail(sanitizedEmail);
    if (existingUser) {
      if (existingUser.google_id) {
        return res.status(409).json({
          success: false,
          error: 'EMAIL_EXISTS_WITH_GOOGLE',
          message: 'This email is already registered with Google. Please sign in with Google.'
        });
      } else {
        return res.status(409).json({
          success: false,
          error: 'EMAIL_ALREADY_REGISTERED',
          message: 'This email is already registered. Please log in instead.'
        });
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and verification token in a single transaction
    // This ensures both operations succeed together or fail together
    const pool = require('../database/connection');
    const client = await pool.connect();

    let newUser;
    try {
      await client.query('BEGIN');

      // Create user within transaction
      newUser = await createUserWithEmail(
        sanitizedEmail,
        passwordHash,
        displayName.trim(),
        client // Pass client for transaction
      );

      console.log('[Register] New user created:', {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.display_name
      });

      // Generate verification token
      const { generateVerificationToken } = require('../utils/tokenUtils');
      const { createVerificationToken } = require('../database/verificationTokenQueries');
      const token = generateVerificationToken();

      // Save token to database (within same transaction)
      await createVerificationToken(newUser.id, token, client);

      // Commit transaction - both user and token are now persisted
      await client.query('COMMIT');

      console.log('[Register] User and verification token created successfully');

      // Send verification email (outside transaction - this can fail without rolling back)
      try {
        const { sendVerificationEmail } = require('../services/emailService');
        await sendVerificationEmail(newUser.email, token);
        console.log('[Register] Verification email sent to:', newUser.email);
      } catch (emailError) {
        // Log error but don't fail registration
        console.error('[Register] Failed to send verification email:', emailError);
        // User can still resend later via /api/auth/resend-verification
      }
    } catch (dbError) {
      // Rollback transaction on any error
      await client.query('ROLLBACK');
      console.error('[Register] Transaction failed, rolled back:', dbError);
      throw dbError; // Re-throw to be caught by outer try-catch
    } finally {
      client.release();
    }

    // Log user in immediately after registration
    req.login(newUser, (err) => {
      if (err) {
        console.error('[Register] Login error after registration:', err);
        return res.status(500).json({
          success: false,
          error: 'Registration successful but login failed. Please try logging in.'
        });
      }

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          display_name: newUser.display_name,
          role: newUser.role,
          status: newUser.status,
          email_verified: newUser.email_verified,
          created_at: newUser.created_at
        },
        message: 'Registration successful'
      });
    });

  } catch (error) {
    console.error('[Register] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Login with email and password
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const {
      comparePassword,
      sanitizeEmail
    } = require('../utils/passwordUtils');
    const {
      verifyUserCredentials,
      updateUserLastLogin
    } = require('../database/userQueries');

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: ['Email and password are required']
      });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Find user (check both active and inactive to provide better error messages)
    const { findUserByEmail } = require('../database/userQueries');
    const user = await findUserByEmail(sanitizedEmail);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Your account is inactive. Please reset your password to reactivate your account.',
        hint: 'Use the "Forgot password" link to reset your password and reactivate your account.'
      });
    }

    // Check if user has a password set
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        error: 'NO_PASSWORD_SET',
        message: 'This account uses Google sign-in. Please sign in with Google or reset your password to add one.',
        hint: 'You can add a password by using the "Forgot password" link.'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        hint: 'Did you recently reset your password? Make sure you\'re using the NEW password. If you forgot your password, use the "Forgot password" link.'
      });
    }

    // Update last login
    await updateUserLastLogin(user.id);

    console.log('[Login] User logged in:', {
      id: user.id,
      email: user.email
    });

    // Log user in
    req.login(user, (err) => {
      if (err) {
        console.error('[Login] Session error:', err);
        return res.status(500).json({
          success: false,
          error: 'Login failed',
          message: 'Authentication successful but session creation failed'
        });
      }

      // Ensure cookie is set with correct attributes
      if (req.session && req.session.cookie) {
        req.session.cookie.secure = process.env.SESSION_COOKIE_SECURE === 'true';
        req.session.cookie.sameSite = 'none';
        req.session.cookie.path = '/';
        if (process.env.SESSION_COOKIE_DOMAIN) {
          req.session.cookie.domain = process.env.SESSION_COOKIE_DOMAIN;
        }
        // Save session to ensure cookie is set with new attributes
        req.session.save((err) => {
          if (err) {
            console.error('[Login] Error saving session:', err);
          }
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          linkedin_url: user.linkedin_url,
          role: user.role,
          last_login: user.last_login
        },
        message: 'Login successful'
      });
    });

  } catch (error) {
    console.error('[Login] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Add password to existing Google OAuth account
 * POST /api/auth/add-password
 */
router.post('/add-password', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;
    const {
      hashPassword,
      validatePassword
    } = require('../utils/passwordUtils');
    const { addPasswordToUser } = require('../database/userQueries');

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: passwordValidation.errors
      });
    }

    // Check if user already has a password
    if (req.user.password_hash) {
      return res.status(400).json({
        success: false,
        error: 'PASSWORD_ALREADY_SET',
        message: 'Your account already has a password. Use the password reset feature to change it.'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Add password to user
    await addPasswordToUser(req.user.id, passwordHash);

    console.log('[Add Password] Password added for user:', req.user.email);

    res.json({
      success: true,
      message: 'Password added successfully. You can now log in with email and password.'
    });

  } catch (error) {
    console.error('[Add Password] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add password',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Resend email verification
 * POST /api/auth/resend-verification
 */
/**
 * Resend verification email
 * NO AUTHENTICATION REQUIRED - users who can't verify can't log in
 * Matches industry standard (GitHub, Google, LinkedIn 2025)
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email provided
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_REQUIRED',
        message: 'Email address is required to resend verification email.'
      });
    }

    const { findUserByEmail } = require('../database/userQueries');

    // Find user by email
    const user = await findUserByEmail(email);

    if (!user) {
      // For security, don't reveal if email exists
      // Return success to prevent email enumeration
      console.log('[Resend Verification] Email not found:', email);
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification email has been sent.'
      });
    }

    // Check if email is already verified
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_ALREADY_VERIFIED',
        message: 'Your email address is already verified.'
      });
    }

    // TODO: Implement rate limiting using Redis
    // For now, allowing resend without strict rate limiting

    const { generateVerificationToken } = require('../utils/tokenUtils');
    const { createVerificationToken, deleteAllUserTokens } = require('../database/verificationTokenQueries');
    const { sendVerificationEmail } = require('../services/emailService');

    // Delete any existing tokens for this user
    await deleteAllUserTokens(user.id);

    // Generate new verification token
    const token = generateVerificationToken();

    // Save token to database (hashed)
    await createVerificationToken(user.id, token);

    // Send verification email (with plaintext token)
    await sendVerificationEmail(user.email, token);

    console.log('[Resend Verification] Verification email sent to:', user.email);

    res.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });

  } catch (error) {
    console.error('[Resend Verification] Error:', error);
    res.status(500).json({
      success: false,
      error: 'RESEND_FAILED',
      message: 'Failed to resend verification email. Please try again.'
    });
  }
});

/**
 * Email Verification Endpoint
 *
 * Verifies a user's email address using the token from the verification email.
 * Implements automatic login after verification (industry standard 2025).
 * This endpoint is public (no authentication required) since users may not be logged in
 * when they click the verification link.
 *
 * Expected query parameters:
 *   - token: The verification token from the email link
 *
 * Response cases:
 *   - 200: Email verified successfully + auto-login (session created)
 *   - 400: Invalid or expired token
 *   - 404: Token not found
 *   - 500: Server error
 *
 * Auto-login behavior:
 *   - Creates session automatically after successful verification
 *   - User is logged in and can access protected routes
 *   - Returns user info in response for frontend state management
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    // Validate token parameter
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Verification token is required.'
      });
    }

    console.log('[Verify Email] Attempting verification with token');

    const { findVerificationToken, deleteVerificationToken } = require('../database/verificationTokenQueries');
    const { updateUser, findUserById, updateUserLastLogin } = require('../database/userQueries');

    // Find and validate token
    const tokenRecord = await findVerificationToken(token);

    if (!tokenRecord) {
      console.log('[Verify Email] Token not found or expired');
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'This verification link is invalid or has expired. Please request a new verification email.'
      });
    }

    // Get user ID from token
    const userId = tokenRecord.user_id;

    // Update user's email_verified status
    await updateUser(userId, { email_verified: true });

    // Delete the used token
    await deleteVerificationToken(tokenRecord.id);

    // Get full user details for session
    const user = await findUserById(userId);

    if (!user) {
      console.error('[Verify Email] User not found after verification:', userId);
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found. Please try registering again.'
      });
    }

    // Update last login timestamp
    await updateUserLastLogin(userId);

    // Auto-login: Create session using Passport
    req.login(user, (err) => {
      if (err) {
        console.error('[Verify Email] Auto-login failed:', err);
        // Email is verified but login failed - user can manually login
        return res.json({
          success: true,
          autoLoginFailed: true,
          message: 'Your email has been verified successfully! Please sign in to continue.',
          user: null
        });
      }

      console.log('[Verify Email] Email verified and user auto-logged in:', userId);

      // Return success with user info for frontend
      res.json({
        success: true,
        autoLoginSuccess: true,
        message: 'Your email has been verified successfully! Redirecting to dashboard...',
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          role: user.role
        }
      });
    });

  } catch (error) {
    console.error('[Verify Email] Error:', error);
    res.status(500).json({
      success: false,
      error: 'VERIFICATION_FAILED',
      message: 'Failed to verify email address. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Password Reset Routes
 * Following 2025 industry standards (OWASP, Auth0, GitHub, Google)
 */

/**
 * Request password reset
 * POST /api/auth/forgot-password
 *
 * Security features:
 * - Email enumeration prevention (same response whether email exists or not)
 * - Rate limiting by email and IP address
 * - SHA-256 hashed tokens with 24-hour expiration
 * - Single-use tokens
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email provided
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_REQUIRED',
        message: 'Email address is required.'
      });
    }

    const { sanitizeEmail } = require('../utils/passwordUtils');
    const { findUserByEmail } = require('../database/userQueries');
    const {
      logPasswordResetAttempt,
      getRecentResetAttempts,
      getRecentResetAttemptsByIP
    } = require('../database/passwordResetQueries');

    // Get client IP address
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Check rate limiting by email (max 3 attempts per hour)
    const emailAttempts = await getRecentResetAttempts(sanitizedEmail, 1);
    if (emailAttempts >= 3) {
      console.log('[Forgot Password] Rate limit exceeded for email:', sanitizedEmail);
      // Still return success to prevent email enumeration
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Check rate limiting by IP (max 5 attempts per hour)
    const ipAttempts = await getRecentResetAttemptsByIP(ipAddress, 1);
    if (ipAttempts >= 5) {
      console.log('[Forgot Password] Rate limit exceeded for IP:', ipAddress);
      // Still return success to prevent email enumeration
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Find user by email
    const user = await findUserByEmail(sanitizedEmail);

    // Log attempt (before checking if user exists)
    await logPasswordResetAttempt(sanitizedEmail, ipAddress, !!user);

    if (!user) {
      // For security, don't reveal if email exists
      // Return success to prevent email enumeration
      console.log('[Forgot Password] Email not found:', sanitizedEmail);
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Check if user is active
    // For inactive accounts, we still allow password reset to reactivate the account
    // This helps users who were deactivated but want to regain access
    if (!user.is_active) {
      console.log('[Forgot Password] User account is inactive, but allowing reset to reactivate:', user.id);
      // Continue with password reset flow - resetting password will reactivate account
    }

    // Generate password reset token
    const { generatePasswordResetToken } = require('../utils/tokenUtils');
    const { createPasswordResetToken } = require('../database/passwordResetQueries');
    const { sendPasswordResetEmail } = require('../services/emailService');

    const token = generatePasswordResetToken();

    // Save token to database (hashed with SHA-256)
    await createPasswordResetToken(user.id, token);

    // Send password reset email (with plaintext token)
    try {
      await sendPasswordResetEmail(user.email, token);
      console.log('[Forgot Password] Password reset email sent to:', user.email);
    } catch (emailError) {
      // Log error but don't fail the request (prevents email enumeration)
      console.error('[Forgot Password] Failed to send email:', emailError);
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder. If you don\'t receive an email within a few minutes, the email address may not be registered with us.'
    });

  } catch (error) {
    console.error('[Forgot Password] Error:', error);
    res.status(500).json({
      success: false,
      error: 'PASSWORD_RESET_FAILED',
      message: 'Failed to process password reset request. Please try again.'
    });
  }
});

/**
 * Verify password reset token (for frontend validation)
 * GET /api/auth/reset-password?token=xyz
 *
 * This endpoint allows the frontend to verify if a token is valid
 * before showing the password reset form.
 */
router.get('/reset-password', async (req, res) => {
  try {
    const { token } = req.query;

    // Validate token parameter
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Password reset token is required.'
      });
    }

    const { findPasswordResetToken } = require('../database/passwordResetQueries');

    // Find and validate token
    const tokenRecord = await findPasswordResetToken(token);

    if (!tokenRecord) {
      console.log('[Reset Password Verify] Token not found or expired');
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'This password reset link is invalid or has expired. Please request a new password reset.'
      });
    }

    console.log('[Reset Password Verify] Token is valid for user:', tokenRecord.user_id);

    res.json({
      success: true,
      message: 'Token is valid. You can now reset your password.',
      expiresAt: tokenRecord.expires_at
    });

  } catch (error) {
    console.error('[Reset Password Verify] Error:', error);
    res.status(500).json({
      success: false,
      error: 'TOKEN_VERIFICATION_FAILED',
      message: 'Failed to verify password reset token. Please try again.'
    });
  }
});

/**
 * Reset password with token
 * POST /api/auth/reset-password
 *
 * Security features:
 * - Single-use tokens (deleted after successful reset)
 * - Password validation (OWASP standards)
 * - Automatic session invalidation (all existing sessions destroyed)
 * - Token expiration (24 hours)
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validate inputs
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: ['Token and password are required']
      });
    }

    const {
      hashPassword,
      validatePassword
    } = require('../utils/passwordUtils');
    const {
      findPasswordResetToken,
      deletePasswordResetToken
    } = require('../database/passwordResetQueries');
    const {
      updateUser,
      destroyAllUserSessions
    } = require('../database/userQueries');

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: passwordValidation.errors
      });
    }

    // Find and validate token
    const tokenRecord = await findPasswordResetToken(token);

    if (!tokenRecord) {
      console.log('[Reset Password] Token not found or expired');
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'This password reset link is invalid or has expired. Please request a new password reset.'
      });
    }

    const userId = tokenRecord.user_id;

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Use transaction to ensure atomic update
    const pool = require('../database/connection');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get user details to check if account is inactive
      const { findUserById } = require('../database/userQueries');
      const currentUser = await findUserById(userId);

      // Update user's password and reactivate account if it was inactive
      const updates = { password_hash: passwordHash };
      if (currentUser && !currentUser.is_active) {
        // Reactivate account when password is reset
        updates.is_active = true;
        console.log('[Reset Password] Reactivating inactive account:', userId);
      }

      await updateUser(userId, updates, client);

      // Delete the used token (single-use)
      await deletePasswordResetToken(userId);

      // Destroy all existing sessions for security
      // This forces user to log in with new password on all devices
      await destroyAllUserSessions(userId);

      await client.query('COMMIT');

      console.log('[Reset Password] Password reset successful for user:', userId);

      res.json({
        success: true,
        message: 'Your password has been reset successfully. You can now log in with your new password.'
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('[Reset Password] Transaction failed, rolled back:', dbError);
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Reset Password] Error:', error);
    res.status(500).json({
      success: false,
      error: 'PASSWORD_RESET_FAILED',
      message: 'Failed to reset password. Please try again or request a new password reset link.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Delete Account
 * POST /api/auth/delete-account
 *
 * Schedules account for deletion with 14-day grace period
 * Requires authentication
 */
router.post('/delete-account', async (req, res) => {
  try {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to delete your account.'
      });
    }

    const userId = req.user.id;
    const { reason } = req.body;

    // Calculate deletion date (14 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 14);

    // Update user record to schedule deletion
    const query = `
      UPDATE users
      SET
        deletion_scheduled_at = $1,
        deletion_reason = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING email, deletion_scheduled_at
    `;

    const result = await pool.query(query, [deletionDate, reason || null, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found.'
      });
    }

    const user = result.rows[0];

    console.log('[Delete Account] Account deletion scheduled:', {
      userId,
      email: user.email,
      deletionDate: user.deletion_scheduled_at,
      reason: reason || 'No reason provided'
    });

    // TODO: Send confirmation email
    // await sendDeletionConfirmationEmail(user.email, user.deletion_scheduled_at);

    res.json({
      success: true,
      message: 'Your account has been scheduled for deletion.',
      data: {
        deletionScheduledAt: user.deletion_scheduled_at
      }
    });

  } catch (error) {
    console.error('[Delete Account] Error:', error);
    res.status(500).json({
      success: false,
      error: 'DELETE_ACCOUNT_FAILED',
      message: 'Failed to schedule account deletion. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Cancel Account Deletion
 * POST /api/auth/cancel-deletion
 *
 * Cancel a scheduled account deletion during the 14-day grace period
 * Requires authentication
 */
router.post('/cancel-deletion', async (req, res) => {
  try {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to cancel account deletion.'
      });
    }

    const userId = req.user.id;

    // Check if account has scheduled deletion
    const checkQuery = `
      SELECT deletion_scheduled_at, email
      FROM users
      WHERE id = $1
    `;

    const checkResult = await pool.query(checkQuery, [userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found.'
      });
    }

    const user = checkResult.rows[0];

    if (!user.deletion_scheduled_at) {
      return res.status(400).json({
        success: false,
        error: 'NO_DELETION_SCHEDULED',
        message: 'Your account is not scheduled for deletion.'
      });
    }

    // Cancel the deletion
    const cancelQuery = `
      UPDATE users
      SET
        deletion_scheduled_at = NULL,
        deletion_reason = NULL,
        updated_at = NOW()
      WHERE id = $1
      RETURNING email
    `;

    const result = await pool.query(cancelQuery, [userId]);

    console.log('[Cancel Deletion] Account deletion cancelled for user:', userId);

    // TODO: Send confirmation email
    // await sendDeletionCancelledEmail(user.email);

    res.json({
      success: true,
      message: 'Account deletion cancelled successfully. Your account will remain active.'
    });

  } catch (error) {
    console.error('[Cancel Deletion] Error:', error);
    res.status(500).json({
      success: false,
      error: 'CANCEL_DELETION_FAILED',
      message: 'Failed to cancel account deletion. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get User Preferences
 * GET /api/auth/preferences
 *
 * Fetch user's notification and appearance preferences
 * Requires authentication
 */
router.get('/preferences', async (req, res) => {
  const startTime = Date.now();

  try {
    // Check authentication
    if (!req.isAuthenticated()) {
      console.log('[Get Preferences] Unauthorized access attempt');
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to view preferences.'
      });
    }

    const userId = req.user.id;

    console.log('[Get Preferences] Fetching preferences for user:', userId);

    // Use query module
    const preferences = await getUserPreferences(userId);

    const duration = Date.now() - startTime;
    console.log('[Get Preferences] Success for user:', userId, '| Duration:', duration + 'ms', '| Data:', preferences);

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Get Preferences] Error:', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      duration: duration + 'ms'
    });

    res.status(500).json({
      success: false,
      error: 'GET_PREFERENCES_FAILED',
      message: 'Failed to fetch preferences. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Update User Preferences
 * PUT /api/auth/preferences
 *
 * Update user's notification and appearance preferences (partial updates supported)
 * Requires authentication
 */
router.put('/preferences', async (req, res) => {
  const startTime = Date.now();

  try {
    // Check authentication
    if (!req.isAuthenticated()) {
      console.log('[Update Preferences] Unauthorized access attempt');
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to update preferences.'
      });
    }

    const userId = req.user.id;
    const { email_notifications, weekly_digest, theme } = req.body;

    console.log('[Update Preferences] Request for user:', userId, '| Updates:', req.body);

    // Validate theme value if provided
    if (theme && !['light', 'dark', 'auto'].includes(theme)) {
      console.log('[Update Preferences] Invalid theme value:', theme);
      return res.status(400).json({
        success: false,
        error: 'INVALID_THEME',
        message: 'Theme must be one of: light, dark, auto'
      });
    }

    // Build updates object
    const updates = {};

    if (email_notifications !== undefined) {
      updates.email_notifications = email_notifications;
    }

    if (weekly_digest !== undefined) {
      updates.weekly_digest = weekly_digest;
    }

    if (theme !== undefined) {
      updates.theme = theme;
    }

    if (Object.keys(updates).length === 0) {
      console.log('[Update Preferences] No valid updates provided');
      return res.status(400).json({
        success: false,
        error: 'NO_UPDATES',
        message: 'No preference updates provided.'
      });
    }

    // Use query module
    const preferences = await updateUserPreferences(userId, updates);

    const duration = Date.now() - startTime;
    console.log('[Update Preferences] Success for user:', userId, '| Duration:', duration + 'ms', '| Updated:', Object.keys(updates), '| Result:', preferences);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Update Preferences] Error:', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      duration: duration + 'ms'
    });

    res.status(500).json({
      success: false,
      error: 'UPDATE_PREFERENCES_FAILED',
      message: 'Failed to update preferences. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Authentication middleware
 */
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

/**
 * Admin role middleware
 */
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
}

module.exports = router;