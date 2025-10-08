const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { findUserByGoogleId, createUserFromGoogle, updateUserLastLogin } = require('../database/userQueries');

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

    // Check if user already exists
    let user = await findUserByGoogleId(profile.id);

    if (user) {
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

module.exports = passport;