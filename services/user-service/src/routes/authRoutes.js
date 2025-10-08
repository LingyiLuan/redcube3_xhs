const express = require('express');
const passport = require('../config/passport');
const { getUserStats } = require('../database/userQueries');

const router = express.Router();

/**
 * Authentication routes for Google OAuth
 */

/**
 * Initiate Google OAuth login
 * GET /auth/google
 */
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'Google OAuth not configured',
      message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables'
    });
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
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'Google OAuth not configured',
      message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables'
    });
  }

  passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL || 'http://localhost:3002' + '/login?error=auth_failed'
  })(req, res, (err) => {
    if (err) return next(err);
    // Successful authentication
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    res.redirect(`${frontendUrl}?auth=success`);
  });
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
 */
router.get('/me', requireAuth, (req, res) => {
  const user = {
    id: req.user.id,
    email: req.user.email,
    display_name: req.user.display_name,
    avatar_url: req.user.avatar_url,
    role: req.user.role,
    last_login: req.user.last_login,
    created_at: req.user.created_at
  };

  res.json({ user });
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
    const { display_name, avatar_url } = req.body;

    const updates = {};
    if (display_name) updates.display_name = display_name;
    if (avatar_url) updates.avatar_url = avatar_url;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedUser = await updateUserProfile(req.user.id, updates);
    res.json({ user: updatedUser });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
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