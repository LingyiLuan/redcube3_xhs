# Preferences E2E Testing Guide

## Test Setup
1. Open browser to http://localhost:5173
2. Log in with Google OAuth
3. Navigate to Settings → Preferences tab

## Test Cases

### Test 1: Load Default Preferences
**Expected Behavior:**
- On first load, all toggles should be ON (email_notifications: true, weekly_digest: true)
- Theme should be "Light"
- Console should show: `[UserProfile] Loaded preferences: {email_notifications: true, weekly_digest: true, theme: 'light'}`

**Steps:**
1. Open browser DevTools → Console
2. Navigate to Settings → Preferences tab
3. Verify toggles are ON
4. Verify theme dropdown shows "Light"

**Database Verification:**
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT * FROM user_preferences WHERE user_id = YOUR_USER_ID;"
```
Should return defaults or empty (API returns defaults if no record exists)

---

### Test 2: Toggle Email Notifications OFF
**Expected Behavior:**
- Toggle switches to OFF
- API call to PUT /api/auth/preferences with {email_notifications: false}
- Database updates
- Console shows: `[UserProfile] Preference updated: email_notifications false`

**Steps:**
1. Click Email Notifications toggle to turn it OFF
2. Wait for network request to complete (~500ms)
3. Check browser DevTools → Network tab for PUT request to /preferences
4. Verify response: `{success: true, data: {email_notifications: false, ...}}`

**Database Verification:**
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT email_notifications FROM user_preferences WHERE user_id = YOUR_USER_ID;"
```
Should show: `email_notifications = false`

---

### Test 3: Toggle Weekly Digest OFF
**Expected Behavior:**
- Toggle switches to OFF
- API call to PUT /api/auth/preferences with {weekly_digest: false}
- Database updates
- Console shows: `[UserProfile] Preference updated: weekly_digest false`

**Steps:**
1. Click Weekly Digest toggle to turn it OFF
2. Wait for network request to complete
3. Check Network tab for PUT request
4. Verify response: `{success: true, data: {weekly_digest: false, ...}}`

**Database Verification:**
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT weekly_digest FROM user_preferences WHERE user_id = YOUR_USER_ID;"
```
Should show: `weekly_digest = false`

---

### Test 4: Change Theme to Dark
**Expected Behavior:**
- Dropdown changes to "Dark"
- API call to PUT /api/auth/preferences with {theme: 'dark'}
- Database updates
- Setting value updates to "Dark mode"
- Console shows: `[UserProfile] Preference updated: theme dark`

**Steps:**
1. Click theme dropdown
2. Select "Dark"
3. Wait for network request to complete
4. Verify the setting value text changes to "Dark mode"

**Database Verification:**
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT theme FROM user_preferences WHERE user_id = YOUR_USER_ID;"
```
Should show: `theme = dark`

---

### Test 5: Change Theme to Auto
**Expected Behavior:**
- Dropdown changes to "Auto"
- API call to PUT /api/auth/preferences with {theme: 'auto'}
- Database updates
- Setting value updates to "Auto (system)"

**Steps:**
1. Click theme dropdown
2. Select "Auto"
3. Wait for network request to complete
4. Verify the setting value text changes to "Auto (system)"

**Database Verification:**
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT theme FROM user_preferences WHERE user_id = YOUR_USER_ID;"
```
Should show: `theme = auto`

---

### Test 6: Preference Persistence After Page Reload
**Expected Behavior:**
- After changing preferences and reloading the page
- All preferences should load from database
- Toggles and dropdown should reflect saved state
- Console shows: `[UserProfile] Loaded preferences: {email_notifications: false, weekly_digest: false, theme: 'auto'}`

**Steps:**
1. Set Email Notifications: OFF
2. Set Weekly Digest: OFF
3. Set Theme: Auto
4. Hard refresh page (Cmd+R or Ctrl+R)
5. Navigate back to Settings → Preferences
6. Verify all preferences are still OFF/Auto

---

### Test 7: Toggle Preferences Back ON
**Expected Behavior:**
- Toggles switch back to ON
- Database updates
- State persists

**Steps:**
1. Turn Email Notifications back ON
2. Turn Weekly Digest back ON
3. Change Theme back to Light
4. Verify all changes save successfully

**Database Verification:**
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT * FROM user_preferences WHERE user_id = YOUR_USER_ID;"
```
Should show all preferences back to defaults

---

### Test 8: Error Handling (Network Failure)
**Expected Behavior:**
- If API call fails, preference reverts to previous state
- Alert shows error message
- Console shows error

**Steps (requires manually blocking network):**
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Try to toggle a preference
4. Verify error alert appears
5. Verify toggle reverts to previous state
6. Re-enable network

---

### Test 9: Multiple Rapid Toggles (Debouncing)
**Expected Behavior:**
- Toggles are disabled while saving (savingPreferences = true)
- Rapid clicks don't cause race conditions
- Only final state is saved

**Steps:**
1. Quickly click Email Notifications toggle 5 times rapidly
2. Verify only one API call is made (or requests are properly sequenced)
3. Verify final state is correct in database

---

### Test 10: Cross-Tab Sync (Advanced)
**Expected Behavior:**
- Changes in one tab should NOT automatically sync to another tab
- Each tab loads preferences independently on mount
- Refreshing second tab loads latest data

**Steps:**
1. Open Settings in two browser tabs
2. In Tab 1: Toggle Email Notifications OFF
3. In Tab 2: Verify toggle is still ON (no auto-sync)
4. In Tab 2: Refresh page
5. In Tab 2: Verify toggle is now OFF (loaded from database)

---

## Backend Service Logs to Monitor

### User Service Logs
```bash
docker logs -f redcube3_xhs-user-service-1 | grep -i "preferences"
```

**Expected Log Output:**
```
[Get Preferences] Retrieved preferences for user: 2
[Update Preferences] Updated preferences for user: 2 { email_notifications: false, weekly_digest: true, theme: 'light' }
```

---

## Database Inspection Commands

### View all user preferences
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT * FROM user_preferences;"
```

### View specific user's preferences
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT * FROM user_preferences WHERE user_id = 2;"
```

### Check timestamp updates
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT user_id, updated_at FROM user_preferences WHERE user_id = 2;"
```

### Reset preferences (for testing)
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "DELETE FROM user_preferences WHERE user_id = 2;"
```

---

## API Endpoint Testing (curl)

### Get Preferences
```bash
curl -X GET http://localhost:8080/api/auth/preferences \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -v
```

### Update Email Notifications
```bash
curl -X PUT http://localhost:8080/api/auth/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"email_notifications": false}' \
  -v
```

### Update Weekly Digest
```bash
curl -X PUT http://localhost:8080/api/auth/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"weekly_digest": false}' \
  -v
```

### Update Theme
```bash
curl -X PUT http://localhost:8080/api/auth/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"theme": "dark"}' \
  -v
```

### Update Multiple at Once
```bash
curl -X PUT http://localhost:8080/api/auth/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"email_notifications": true, "weekly_digest": true, "theme": "auto"}' \
  -v
```

---

## Success Criteria

✅ All toggles are functional and save to database
✅ Theme dropdown works and saves to database
✅ Preferences load correctly on page mount
✅ Preferences persist after page reload
✅ No console errors
✅ API responses are successful (200 OK)
✅ Database values match UI state
✅ Timestamps update correctly (updated_at)
✅ Loading states work (toggles disabled while saving)
✅ Error handling works (network failures)

---

## Known Limitations

1. **Theme doesn't actually change UI yet** - Dark mode implementation is Phase 3
2. **Weekly digest emails not sent yet** - Email service is Phase 3
3. **No real-time sync across tabs** - By design, preferences are tab-independent
4. **Rate limiting not implemented** - Future enhancement

---

## Cleanup After Testing

```bash
# Reset test user preferences
docker exec redcube_postgres psql -U postgres -d postgres -c "DELETE FROM user_preferences WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%');"

# View remaining preferences
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT COUNT(*) FROM user_preferences;"
```

---

**Test Date:** 2025-01-27
**Tested By:** Claude Code
**Status:** ✅ Implementation Complete - Ready for Testing
