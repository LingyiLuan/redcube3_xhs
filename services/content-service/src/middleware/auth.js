/**
 * Authentication middleware for content service
 * Verifies user sessions and extracts user ID
 */

const axios = require('axios');

/**
 * Middleware to extract and verify user authentication
 * Makes request to user service to verify session and get user info
 */
async function requireAuth(req, res, next) {
  try {
    console.log('Auth middleware - checking authentication...');

    // Extract session cookie
    const sessionCookie = req.headers.cookie;
    console.log('Session cookie:', sessionCookie ? 'Present' : 'Missing');

    if (!sessionCookie) {
      console.log('Auth failed: No session cookie');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No session cookie found'
      });
    }

    console.log('Making request to user service for auth verification...');

    // Make request to user service to verify session
    const response = await axios.get('http://user-service:3001/api/auth/me', {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout
    });

    console.log('User service response status:', response.status);

    if (response.status !== 200) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid or expired session'
      });
    }

    const userData = response.data;

    if (!userData.user || !userData.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid user data'
      });
    }

    // Add user info to request object
    req.user = userData.user;
    console.log(`✅ AUTH MIDDLEWARE SUCCESS:`);
    console.log(`  - User ID: ${req.user.id}`);
    console.log(`  - Email: ${req.user.email}`);
    console.log(`  - Full user object:`, JSON.stringify(req.user, null, 2));

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    console.error('Full error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication service error',
      message: `Failed to verify authentication: ${error.message}`
    });
  }
}

/**
 * Optional auth middleware - sets user if authenticated, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const sessionCookie = req.headers.cookie;

    if (!sessionCookie) {
      req.user = null;
      return next();
    }

    const response = await axios.get('http://user-service:3001/api/auth/me', {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      const userData = response.data;
      if (userData.user && userData.user.id) {
        req.user = userData.user;
        console.log(`Optional auth - user: ${req.user.id} (${req.user.email})`);
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth
};