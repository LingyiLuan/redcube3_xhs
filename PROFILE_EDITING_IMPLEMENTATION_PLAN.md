# Profile Editing & LinkedIn OAuth Implementation Plan

## Session Summary

This document contains the complete plan and progress for implementing profile editing and LinkedIn OAuth features.

---

## What Was Completed (Current Session)

### ✅ Database Migration
- Created `35-add-linkedin-url.sql` migration
- Added `linkedin_url VARCHAR(500)` column to users table in `redcube_users` database
- Created index `idx_users_linkedin_url` for performance
- Successfully executed migration

### ✅ Research & Planning
- Completed LinkedIn OAuth research (permissions, API access, limitations)
- Researched profile editing best practices
- Designed complete implementation architecture

### ✅ Bug Fixes (Completed Earlier)
- Fixed UserProfile.vue profile data loading (changed `profileData.user` to `profileData.data`)
- Updated TopNav.vue dropdown to show "Settings" instead of "Profile"

---

## Current Database Schema

### Users Table (redcube_users database)
```sql
users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    linkedin_url VARCHAR(500),  -- ✅ NEWLY ADDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
)
```

---

## LinkedIn OAuth Integration - Key Findings

### What You CAN Access (FREE - Sign In with LinkedIn)
- ✅ Name (first + last)
- ✅ Email address
- ✅ Profile picture
- ✅ Headline (current job title)
- ✅ Profile URL

### What You CANNOT Access (Without Paid Partnership $1000-5000/year)
- ❌ User's posts
- ❌ Full work history
- ❌ Detailed experience
- ❌ Skills & endorsements

### Recommended Approach
**Start with FREE "Sign In with LinkedIn"** for basic profile auto-fill and verification badges.

**Skip expensive Marketing Developer Program** unless users specifically need post analysis.

---

## Implementation Roadmap

### Phase 1: Profile Editing (CURRENT PRIORITY - Week 1-2)

#### Backend (user-service)
**Status:** Not Started (Next Session)

**Files to Create/Modify:**
1. `/services/user-service/src/controllers/userController.js` - NEW
2. `/services/user-service/src/routes/userRoutes.js` - NEW or MODIFY
3. `/services/user-service/src/config/database.js` - Check if exists

**API Endpoints to Implement:**
```javascript
PUT /api/user/:userId/profile
Body: {
  displayName: string,      // Instant update
  email: string,            // Requires verification
  linkedinUrl: string       // Simple update
}

Response: {
  success: boolean,
  user: { ...updated user data },
  message: string
}
```

**Features:**
- [x] Database migration (linkedin_url field)
- [ ] Input validation (display name length, email format, URL format)
- [ ] Update users table (display_name, linkedin_url)
- [ ] Email change verification system (send verification email to new address)
- [ ] Update `updated_at` timestamp on changes
- [ ] Error handling (user not found, validation errors)

#### Frontend (Vue)
**Status:** Not Started (Next Session)

**Files to Modify:**
1. `/vue-frontend/src/components/User/UserProfile.vue` - Add edit UI

**Features to Add:**
- [ ] Edit buttons next to each editable field (display name, email, LinkedIn URL)
- [ ] Inline editing OR modal dialog for editing
- [ ] Form validation (client-side)
- [ ] API integration (PUT request to update profile)
- [ ] Success/error toast notifications
- [ ] Email verification UI ("Check your email to verify new address")
- [ ] Loading states during API calls

**UI Design (OpenRouter-Style):**
```vue
<!-- Example: Inline Editing for Display Name -->
<div class="profile-field">
  <label>Display Name</label>

  <!-- View Mode -->
  <div v-if="!editingDisplayName" class="field-value">
    <span>{{ profile.displayName }}</span>
    <button @click="editingDisplayName = true" class="edit-btn">
      Edit
    </button>
  </div>

  <!-- Edit Mode -->
  <div v-else class="field-edit">
    <input v-model="newDisplayName" />
    <button @click="saveDisplayName" class="save-btn">Save</button>
    <button @click="cancelEditDisplayName" class="cancel-btn">Cancel</button>
  </div>
</div>
```

---

### Phase 2: LinkedIn OAuth (Week 3-6)

#### Week 3: LinkedIn Developer Setup
**Status:** Not Started

**Steps:**
1. Register app at https://www.linkedin.com/developers
2. Get Client ID & Client Secret
3. Configure redirect URL: `https://yourdomain.com/auth/linkedin/callback`
4. Choose permissions: `r_liteprofile`, `r_emailaddress`

#### Week 4: Backend OAuth Flow
**Status:** Not Started

**Files to Create:**
1. `/services/user-service/src/controllers/linkedinAuthController.js`
2. `/services/user-service/src/services/linkedinService.js`
3. `/services/user-service/.env` - Add `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`

**Endpoints:**
```javascript
GET /auth/linkedin
// Redirects to LinkedIn OAuth consent screen

GET /auth/linkedin/callback
// Handles OAuth callback, exchanges code for token
// Stores access token (encrypted) and profile data
// Redirects to frontend with success/error
```

#### Week 5-6: Frontend Integration
**Status:** Not Started

**Features:**
- [ ] "Connect LinkedIn" button in UserProfile.vue
- [ ] OAuth popup/redirect flow
- [ ] Handle OAuth callback
- [ ] Display "LinkedIn Connected" status with green checkmark
- [ ] "Sync from LinkedIn" button to refresh profile data
- [ ] "Disconnect LinkedIn" button

**Utilization Features:**
- [ ] Auto-populate display_name from LinkedIn name
- [ ] Display "Verified via LinkedIn" badge on profile
- [ ] Auto-update profile picture from LinkedIn (weekly cron job)
- [ ] Use headline to pre-fill target role in analysis forms

---

## Next Session Action Items

### Immediate Tasks (Start Here)
1. **Create user-service controller** for profile updates
2. **Add validation logic** for display name, email, LinkedIn URL
3. **Implement PUT /api/user/:userId/profile** endpoint
4. **Test backend with Postman/curl**
5. **Add edit buttons to UserProfile.vue frontend**
6. **Wire up frontend to backend API**
7. **Test complete flow end-to-end**

### Files to Focus On
- Backend: `services/user-service/src/controllers/userController.js` (NEW)
- Backend: `services/user-service/src/routes/userRoutes.js` (NEW/MODIFY)
- Frontend: `vue-frontend/src/components/User/UserProfile.vue` (MODIFY)

---

## Code Snippets for Next Session

### Backend Controller Template
```javascript
// services/user-service/src/controllers/userController.js
const pool = require('../config/database');

async function updateUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const { displayName, email, linkedinUrl } = req.body;

    // Validation
    if (displayName && (displayName.length < 2 || displayName.length > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Display name must be between 2 and 100 characters'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (displayName) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(displayName);
    }

    if (linkedinUrl) {
      updates.push(`linkedin_url = $${paramIndex++}`);
      values.push(linkedinUrl);
    }

    // Email requires verification (implement later)

    updates.push(`updated_at = NOW()`);
    values.push(userId); // Last parameter for WHERE clause

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('[UserController] Error updating profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
}

module.exports = {
  updateUserProfile
};
```

### Frontend Update Function Template
```typescript
// vue-frontend/src/components/User/UserProfile.vue
async function saveDisplayName() {
  loading.value = true
  error.value = ''

  try {
    const userId = authStore.user?.id || 1

    const response = await fetch(`http://localhost:8080/api/user/${userId}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        displayName: newDisplayName.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile')
    }

    // Update local profile data
    profile.value.displayName = data.user.display_name
    editingDisplayName.value = false

    // Show success message
    console.log('[UserProfile] Profile updated successfully')

  } catch (err: any) {
    error.value = err.message || 'Failed to update profile'
    console.error('[UserProfile] Error updating profile:', err)
  } finally {
    loading.value = false
  }
}
```

---

## Testing Checklist

### Backend Testing
- [ ] Test display name update with valid data
- [ ] Test display name validation (too short, too long)
- [ ] Test LinkedIn URL update
- [ ] Test user not found error
- [ ] Test database connection error handling

### Frontend Testing
- [ ] Click edit button, input field appears
- [ ] Save button updates profile successfully
- [ ] Cancel button discards changes
- [ ] Error messages display correctly
- [ ] Success notifications work
- [ ] UI remains responsive during loading

### Integration Testing
- [ ] Complete flow: click edit → modify → save → see updated data
- [ ] Hard refresh browser, data persists
- [ ] Multiple users can edit profiles independently
- [ ] Concurrent edits handled gracefully

---

## Resources & Documentation

### LinkedIn OAuth
- [LinkedIn OAuth 2.0 Authentication](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [LinkedIn 3-Legged OAuth Flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [LinkedIn Profile API](https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api)

### Best Practices
- [User Experience Best Practices for Email Changes](https://ux.stackexchange.com/questions/58503/best-practices-for-a-change-of-email-user)

---

## Current Architecture

### Services
- **user-service**: Port 3001, handles authentication and user data (database: redcube_users)
- **content-service**: Port 3002, handles analysis and reputation (database: redcube_content)
- **api-gateway**: Port 8080 (nginx), routes to services

### Database
- **redcube_users**: User authentication, profiles, sessions
- **redcube_content**: Interview data, analysis, reputation

### Frontend
- **vue-frontend**: Port 3000 (dev), Vue 3 + TypeScript + Composition API

---

## Session Status: Ready for Implementation

All planning and research complete. Next session should focus on:
1. Creating backend API endpoint
2. Adding frontend edit UI
3. Testing complete flow

**Estimated Time:** 2-3 hours for basic profile editing (display name + LinkedIn URL)
