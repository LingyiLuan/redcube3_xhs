const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { findUserByGoogleId, createUserFromGoogle, updateUserLastLogin } = require('../database/userQueries');

console.log('[Passport] GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

/**
 * Passport.js configuration for Google OAuth 2.0
 */

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const { findUserById } = require('../database/userQueries');
    const user = await findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (only if credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth Profile:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    console.log('[Passport] About to call findUserByGoogleId');

    // Check if user already exists
    let user = await findUserByGoogleId(profile.id);

    console.log('[Passport] findUserByGoogleId returned:', user?.email || 'null');

    if (user) {
      console.log('[Passport] About to call updateUserLastLogin');
      // Update last login
      user = await updateUserLastLogin(user.id);
      console.log('Existing user logged in:', user.email);
      return done(null, user);
    } else {
      // Create new user
      const userData = {
        google_id: profile.id,
        email: profile.emails?.[0]?.value,
        display_name: profile.displayName,
        avatar_url: profile.photos?.[0]?.value,
        first_name: profile.name?.givenName,
        last_name: profile.name?.familyName
      };

      user = await createUserFromGoogle(userData);
      console.log('New user created:', user.email);
      return done(null, user);
    }
  } catch (error) {
    console.error('Google OAuth Strategy Error:', error);
    return done(error, null);
  }
  }));
} else {
  console.warn('Google OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables');
}

// LinkedIn OAuth Strategy (only if credentials are configured)
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const { InternalOAuthError } = require('passport-oauth2');
const https = require('https');

if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  // Create custom strategy that overrides userProfile for OpenID Connect
  class LinkedInOIDCStrategy extends LinkedInStrategy {
    userProfile(accessToken, done) {
      // Use LinkedIn's OpenID Connect userinfo endpoint
      const profileUrl = 'https://api.linkedin.com/v2/userinfo';

      console.log('[LinkedIn OIDC] Fetching user profile from:', profileUrl);
      console.log('[LinkedIn OIDC] Access token length:', accessToken ? accessToken.length : 'MISSING');

      // Make HTTP request with Bearer token in Authorization header (required for OIDC)
      const options = {
        hostname: 'api.linkedin.com',
        path: '/v2/userinfo',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          console.log('[LinkedIn OIDC] Response status:', res.statusCode);
          console.log('[LinkedIn OIDC] Profile response:', body);

          if (res.statusCode !== 200) {
            return done(new InternalOAuthError('failed to fetch user profile', new Error(`Status: ${res.statusCode}, Body: ${body}`)));
          }

          try {
            const json = JSON.parse(body);

            // Parse OpenID Connect userinfo response
            const profile = {
              provider: 'linkedin',
              id: json.sub, // OpenID Connect uses 'sub' for user ID
              displayName: json.name,
              name: {
                givenName: json.given_name,
                familyName: json.family_name
              },
              emails: json.email ? [{ value: json.email }] : [],
              photos: json.picture ? [{ value: json.picture }] : [],
              _raw: body,
              _json: json
            };

            console.log('[LinkedIn OIDC] Parsed profile:', {
              id: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value
            });

            return done(null, profile);
          } catch (e) {
            console.error('[LinkedIn OIDC] Profile parse error:', e);
            return done(new InternalOAuthError('failed to parse profile response', e));
          }
        });
      });

      req.on('error', (err) => {
        console.error('[LinkedIn OIDC] HTTP request error:', err);
        return done(new InternalOAuthError('failed to fetch user profile', err));
      });

      req.end();
    }
  }

  passport.use(new LinkedInOIDCStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL || '/auth/linkedin/callback',
    scope: ['openid', 'profile', 'email'], // LinkedIn OpenID Connect - approved for Standard Tier
    state: true, // Enable CSRF protection with state parameter
    passReqToCallback: true // Pass req to callback to access session
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('[LinkedIn] OAuth Profile:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        profileUrl: profile._json?.publicProfileUrl,
        rawProfile: profile._json
      });

      const { findUserById, updateUserProfile } = require('../database/userQueries');

      // Get user ID from session
      const userId = req.session?.linkedinConnectUserId;

      if (!userId) {
        console.error('[LinkedIn] No userId in session. Session data:', {
          hasSession: !!req.session,
          linkedinConnectUserId: req.session?.linkedinConnectUserId,
          sessionID: req.sessionID
        });
        return done(new Error('LinkedIn connection requires an active session'));
      }

      // Extract LinkedIn profile URL from profile data
      // Try OpenID Connect vanityName first, then fall back to publicProfileUrl or profile.id
      let linkedinUrl;
      if (profile._json?.vanityName) {
        linkedinUrl = `https://www.linkedin.com/in/${profile._json.vanityName}`;
      } else if (profile._json?.publicProfileUrl) {
        linkedinUrl = profile._json.publicProfileUrl;
      } else {
        linkedinUrl = `https://www.linkedin.com/in/${profile.id}`;
      }

      console.log('[LinkedIn] Updating user profile:', {
        userId,
        linkedinUrl
      });

      await updateUserProfile(userId, {
        linkedin_url: linkedinUrl
      });

      const user = await findUserById(userId);
      console.log('[LinkedIn] Connected for user:', user.email, '- LinkedIn URL:', linkedinUrl);
      return done(null, user);
    } catch (error) {
      console.error('[LinkedIn] OAuth Strategy Error:', error);
      return done(error, null);
    }
  }));
} else {
  console.warn('LinkedIn OAuth not configured - set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables');
}

module.exports = passport;