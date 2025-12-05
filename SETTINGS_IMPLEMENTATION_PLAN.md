# Settings Features Implementation Plan

## Overview
Implement all settings tab functionality with proper UX, security, and end-to-end testing.

---

## Phase 1: Account Tab Security Features (HIGH PRIORITY)

### 1.1 Email Verification
**Status:** Backend exists ✅ - Frontend needs implementation
**Complexity:** LOW
**Files to modify:**
- `vue-frontend/src/components/User/UserProfile.vue`
- `services/user-service/src/routes/authRoutes.js` (verify endpoint exists)

**Implementation:**
- Hide "Verify" button for Google OAuth users (already verified)
- Show "Verify" button for email/password users
- Click → Send verification email → Show success message
- User clicks email link → Redirect to app → Show verified status

**Testing:**
- [ ] Google user: No verify button shown
- [ ] Email user: Button shown, email sent
- [ ] Email link works and verifies email
- [ ] Status updates in UI after verification

---

### 1.2 Password Change
**Status:** Backend exists ✅ - Frontend needs implementation
**Complexity:** LOW
**Files to modify:**
- `vue-frontend/src/components/User/UserProfile.vue`

**Implementation:**
- Hide password field for Google OAuth users
- Email/password users: Click "Change" → Send password reset email
- Show success toast: "Password reset email sent to [email]"
- Reuse existing password reset flow

**Testing:**
- [ ] Google user: Password field hidden
- [ ] Email user: Reset email sent successfully
- [ ] Password reset link works
- [ ] New password saves correctly

---

### 1.3 Delete Account
**Status:** Not implemented ❌
**Complexity:** MEDIUM
**Files to create/modify:**
- `vue-frontend/src/components/User/DeleteAccountModal.vue` (NEW)
- `vue-frontend/src/components/User/UserProfile.vue`
- `services/user-service/src/routes/authRoutes.js`
- `services/user-service/src/controllers/authController.js`
- `shared/database/init/39-account-deletion.sql` (NEW)

**Implementation:**
1. First modal: Warning with Cancel/Continue
2. Second modal: Type email to confirm + password entry
3. Schedule deletion for 14 days later
4. Send confirmation email
5. Soft delete (anonymize email, set deletion_scheduled_at)
6. Cron job for permanent deletion after grace period

**Testing:**
- [ ] Modal shows warning message
- [ ] Requires email confirmation
- [ ] Requires password for security
- [ ] Account soft-deleted correctly
- [ ] Grace period works (can reactivate)
- [ ] Email sent confirming deletion
- [ ] Permanent deletion works after 14 days

---

## Phase 2: Preferences Tab (MEDIUM PRIORITY)

### 2.1 Email Notifications Toggle
**Status:** Not implemented ❌
**Complexity:** LOW
**Files to create/modify:**
- `vue-frontend/src/components/User/UserProfile.vue`
- `services/user-service/src/routes/authRoutes.js`
- `shared/database/init/40-user-preferences.sql` (NEW)

**Implementation:**
- Add user_preferences table (email_notifications, weekly_digest, theme)
- Toggle saves to database via API
- Controls marketing emails only (not transactional)

**Testing:**
- [ ] Toggle saves preference to database
- [ ] Toggle state persists on page reload
- [ ] Preference respected in email sending

---

### 2.2 Weekly Digest Toggle
**Status:** Not implemented ❌
**Complexity:** HIGH (requires email service + agent)
**Files to create/modify:**
- `vue-frontend/src/components/User/UserProfile.vue`
- `services/notification-service/src/agents/weeklyDigestAgent.js` (NEW)
- `services/notification-service/src/templates/weeklyDigest.html` (NEW)
- `shared/database/init/40-user-preferences.sql` (same as above)

**Implementation:**
1. Toggle saves preference to database
2. Create weekly digest agent (runs Sunday 6pm)
3. Collects:
   - User's weekly stats
   - Trending posts (top 5)
   - High-quality posts (reputation > 80)
   - Market intelligence (skills trending)
   - Personalized recommendations
4. Email template with clean design
5. Cron job using node-cron

**Testing:**
- [ ] Toggle saves preference
- [ ] Agent runs on schedule
- [ ] Email template renders correctly
- [ ] All sections populated with real data
- [ ] Personalization works
- [ ] Unsubscribe respects toggle

---

### 2.3 Dark Mode
**Status:** Not implemented ❌
**Complexity:** MEDIUM
**Files to create/modify:**
- `vue-frontend/tailwind.config.js`
- `vue-frontend/src/composables/useTheme.js` (NEW)
- `vue-frontend/src/components/User/UserProfile.vue`
- `vue-frontend/package.json` (add @vueuse/core)
- ALL component .vue files (add dark: classes)

**Implementation:**
1. Install @vueuse/core
2. Configure Tailwind darkMode: 'class'
3. Create useTheme composable
4. Add dark mode classes to all components
5. Save preference to localStorage
6. Three options: Light, Dark, Auto (system)

**Testing:**
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] Auto mode follows system preference
- [ ] Preference persists across sessions
- [ ] No flicker on page load
- [ ] All components support dark mode

---

## Implementation Order (Prioritized)

### Sprint 1: Critical Security Features (Week 1)
1. **Password Change** (1 day) - Reuse existing infrastructure
2. **Email Verification** (1 day) - Frontend integration only
3. **Delete Account** (3 days) - Full implementation + testing

### Sprint 2: User Preferences (Week 2)
4. **Email Notifications Toggle** (1 day) - Simple database toggle
5. **Database schema for preferences** (0.5 days)
6. **Preferences API endpoints** (0.5 days)

### Sprint 3: Advanced Features (Week 3-4)
7. **Dark Mode** (3 days) - Styling all components
8. **Weekly Digest Agent** (5 days) - Complex email automation

---

## Testing Strategy

### Unit Tests
- Database queries for preferences
- Email sending functions
- Dark mode composable

### Integration Tests
- API endpoints for each feature
- Email verification flow
- Password reset flow
- Account deletion flow

### E2E Tests (Playwright/Cypress)
- Complete user journeys for each feature
- Toggle interactions
- Modal confirmations
- Email link clicks

### Manual Testing Checklist
- [ ] All buttons work as expected
- [ ] Proper error messages shown
- [ ] Success messages displayed
- [ ] Email delivery confirmed
- [ ] Database updates verified
- [ ] UI updates in real-time
- [ ] Mobile responsive design
- [ ] Accessibility (keyboard navigation)

---

## Database Schema Changes

### Table: user_preferences (NEW)
```sql
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  theme VARCHAR(10) DEFAULT 'light', -- 'light', 'dark', 'auto'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: users (MODIFY)
```sql
ALTER TABLE users ADD COLUMN deletion_scheduled_at TIMESTAMP;
ALTER TABLE users ADD COLUMN deletion_reason TEXT;
```

---

## API Endpoints to Create

### User Preferences
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update preferences

### Account Management
- `POST /api/auth/send-verification-email` - Resend verification
- `POST /api/auth/request-password-change` - Send reset email
- `POST /api/auth/delete-account` - Schedule deletion
- `POST /api/auth/cancel-deletion` - Cancel scheduled deletion

---

## Dependencies to Add

### Frontend
```json
{
  "@vueuse/core": "^11.0.0"
}
```

### Backend (if needed)
```json
{
  "node-cron": "^3.0.3",
  "nodemailer": "^6.9.8" // (already exists)
}
```

---

## Success Metrics

- [ ] All settings buttons functional
- [ ] Zero security vulnerabilities
- [ ] Email delivery rate > 95%
- [ ] Dark mode covers 100% of components
- [ ] Weekly digest open rate > 20%
- [ ] Account deletion < 1% error rate
- [ ] User preference save time < 500ms
- [ ] E2E test coverage > 80%

---

## Rollout Plan

1. **Alpha Testing** (Internal team)
   - Test all features manually
   - Fix critical bugs

2. **Beta Testing** (Small user group)
   - 5-10 test users
   - Collect feedback
   - Monitor email delivery

3. **Production Release**
   - Feature flag rollout (10% → 50% → 100%)
   - Monitor error rates
   - Quick rollback plan ready

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Email delivery failure | High | Use SendGrid/AWS SES, monitor bounce rates |
| Accidental account deletion | High | 14-day grace period, confirmation emails |
| Dark mode breaking UI | Medium | Comprehensive testing, gradual rollout |
| Weekly digest spam | Medium | Easy unsubscribe, quality content filtering |
| Password reset abuse | High | Rate limiting, secure tokens |

---

**Last Updated:** 2025-01-27
**Status:** Planning Complete - Ready for Implementation
