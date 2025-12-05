# LinkedIn OAuth Integration Implementation Guide

## Summary

I've researched and prepared a complete LinkedIn OAuth integration. The implementation follows the OAuth 2.0 authorization code flow and uses the `passport-linkedin-oauth2` package.

## Research Sources

- [LinkedIn OAuth 2.0 Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [passport-linkedin-oauth2 Package](https://www.passportjs.org/packages/passport-linkedin-oauth2/)
- [LinkedIn Redirect URL Configuration](https://stackoverflow.com/questions/26105135/linkedin-oauth-2-0-redirect-url)

## Prerequisites

1. **Package Installed**: ✅ `passport-linkedin-oauth2` has been installed
2. **Database Ready**: ✅ `linkedin_url` column already exists in users table

## Step 1: Register LinkedIn OAuth App

Before implementing, you need to:

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers)
2. Create a new app
3. Get your Client ID and Client Secret
4. Add redirect URL: `http://localhost:8080/auth/linkedin/callback` (for development)
5. Request these scopes:
   - `openid` - Required for OAuth
   - `profile` - Get name, photo
   - `email` - Get email address

## Step 2: Add Environment Variables

Add to `.env` file in services/user-service:

```bash
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_CALLBACK_URL=http://localhost:8080/auth/linkedin/callback
```

## Step 3: Update Passport Configuration

File: `services/user-service/src/config/passport.js`

Add after the Google Strategy (around line 67):

```javascript
// LinkedIn OAuth Strategy (only if credentials are configured)
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL || '/auth/linkedin/callback',
    scope: ['openid', 'profile', 'email'],
    state: true // Enable CSRF protection
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('LinkedIn OAuth Profile:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName
      });

      const { findUserById, updateUserProfile } = require('../database/userQueries');

      // LinkedIn connection must be for an already logged-in user
      if (!profile._json || !profile._json.user_id) {
        return done(new Error('LinkedIn connection requires an active session'));
      }

      // Update user's LinkedIn profile URL
      const linkedinUrl = `https://www.linkedin.com/in/${profile.id}`;
      await updateUserProfile(profile._json.user_id, {
        linkedin_url: linkedinUrl
      });

      const user = await findUserById(profile._json.user_id);
      console.log('LinkedIn connected for user:', user.email);
      return done(null, user);
    } catch (error) {
      console.error('LinkedIn OAuth Strategy Error:', error);
      return done(error, null);
    }
  }));
} else {
  console.warn('LinkedIn OAuth not configured - set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables');
}
```

## Step 4: Add LinkedIn OAuth Routes

File: `services/user-service/src/routes/authRoutes.js`

Add after Google OAuth routes (around line 65):

```javascript
/**
 * Initiate LinkedIn OAuth connection
 * GET /auth/linkedin
 * NOTE: User must be logged in via Google first
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

  passport.authenticate('linkedin', {
    state: JSON.stringify({ userId: req.user.id })
  })(req, res, next);
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

  passport.authenticate('linkedin', {
    failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173' + '/settings?linkedin=failed'
  })(req, res, (err) => {
    if (err) {
      console.error('[LinkedIn] OAuth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?linkedin=failed`);
    }

    console.log('[LinkedIn] Successfully connected for user:', req.user.email);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?linkedin=success`);
  });
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
```

## Step 5: Add Frontend Button

File: `vue-frontend/src/components/User/UserProfile.vue`

Replace the LinkedIn URL manual edit field with a "Connect LinkedIn" button:

```vue
<!-- LinkedIn Connection -->
<div class="setting-row">
  <div class="setting-info">
    <div class="setting-label">LinkedIn</div>
    <div class="setting-value">
      <span v-if="profile.linkedinUrl" class="status-verified">
        ✓ Connected
      </span>
      <span v-else class="status-unverified">
        Not connected
      </span>
    </div>
  </div>
  <button
    v-if="!profile.linkedinUrl"
    @click="connectLinkedIn"
    class="action-btn action-btn-linkedin"
  >
    Connect LinkedIn
  </button>
  <button
    v-else
    @click="disconnectLinkedIn"
    class="action-btn"
  >
    Disconnect
  </button>
</div>
```

Add these methods to the component:

```typescript
function connectLinkedIn() {
  // Redirect to LinkedIn OAuth flow
  window.location.href = 'http://localhost:8080/auth/linkedin'
}

async function disconnectLinkedIn() {
  if (!confirm('Are you sure you want to disconnect your LinkedIn account?')) {
    return
  }

  try {
    const response = await fetch('http://localhost:8080/api/auth/linkedin/disconnect', {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to disconnect LinkedIn')
    }

    // Update local profile
    if (profile.value) {
      profile.value.linkedinUrl = null
      profile.value.verificationStatus.linkedinVerified = false
    }

    console.log('[UserProfile] LinkedIn disconnected successfully')
  } catch (err: any) {
    profileError.value = err.message || 'Failed to disconnect LinkedIn'
    console.error('[UserProfile] Error disconnecting LinkedIn:', err)
  }
}

// Handle OAuth callback
onMounted(() => {
  loadProfile()

  // Check for LinkedIn OAuth callback
  const urlParams = new URLSearchParams(window.location.search)
  const linkedinStatus = urlParams.get('linkedin')

  if (linkedinStatus === 'success') {
    alert('LinkedIn connected successfully!')
    // Remove query params
    window.history.replaceState({}, '', '/settings')
    // Reload profile to get updated LinkedIn URL
    loadProfile()
  } else if (linkedinStatus === 'failed') {
    alert('Failed to connect LinkedIn. Please try again.')
    window.history.replaceState({}, '', '/settings')
  }
})
```

## Step 6: Add Nginx Route

File: `api-gateway/nginx.conf`

The `/auth/linkedin` route should already work through the existing `/api/auth` location block. No changes needed.

## Testing Instructions

1. Login with Google OAuth first
2. Go to Settings page
3. Click "Connect LinkedIn" button
4. You'll be redirected to LinkedIn
5. Authorize the app
6. You'll be redirected back to Settings with `?linkedin=success`
7. Your LinkedIn profile URL will be saved

## What Data LinkedIn Provides (FREE)

With the free "Sign In with LinkedIn":
- ✅ Name (first + last)
- ✅ Email address
- ✅ Profile picture
- ✅ Headline (current job title)
- ✅ Profile URL

❌ **NOT Available** (requires paid Marketing Developer Program $1000-5000/year):
- Posts
- Full work history
- Skills & endorsements

## Next Steps After Initial Setup

1. Get LinkedIn Client ID and Secret
2. Add them to `.env` file
3. Implement the code changes above
4. Restart user-service
5. Test the flow

## Important Notes

- User MUST be logged in via Google before connecting LinkedIn
- LinkedIn OAuth only adds the profile URL - it doesn't replace Google login
- The redirect URL must be registered exactly in LinkedIn Developer Portal
- Use HTTPS redirect URLs in production

## File Changes Summary

- ✅ `passport-linkedin-oauth2` package installed
- ⏳ `services/user-service/src/config/passport.js` - Add LinkedIn strategy
- ⏳ `services/user-service/src/routes/authRoutes.js` - Add LinkedIn routes
- ⏳ `vue-frontend/src/components/User/UserProfile.vue` - Add Connect button
- ⏳ `.env` - Add LinkedIn credentials (after getting from LinkedIn)
