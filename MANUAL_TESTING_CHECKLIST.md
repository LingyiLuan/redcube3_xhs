# Manual E2E Testing Checklist

**Test Date:** ___________
**Tester:** ___________
**Browser:** ___________

## Setup
1. ✅ Open http://localhost:5173 in browser
2. ✅ Log in with Google OAuth
3. ✅ Navigate to Settings (user icon in top right)
4. ✅ Open Browser DevTools → Console (to see logs)

---

## TEST 1: Preferences Tab - Email Notifications Toggle

**Steps:**
1. Navigate to Settings → Preferences tab
2. Observe the Email Notifications toggle (should be ON by default)
3. Click the toggle to turn it OFF
4. Wait 1 second for save

**Expected Results:**
- [ ] Toggle switches to OFF position
- [ ] Console shows: `[UserProfile] Preference updated: email_notifications false`
- [ ] No errors in console
- [ ] Toggle stays OFF (doesn't revert)

**Database Verification:**
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT email_notifications FROM user_preferences WHERE user_id = YOUR_USER_ID;"
```
Should show: `f` (false)

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 2: Preferences Tab - Weekly Digest Toggle

**Steps:**
1. Still on Preferences tab
2. Click the Weekly Digest toggle to turn it OFF
3. Wait 1 second for save

**Expected Results:**
- [ ] Toggle switches to OFF position
- [ ] Console shows: `[UserProfile] Preference updated: weekly_digest false`
- [ ] No errors in console
- [ ] Toggle stays OFF

**Database Verification:**
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT weekly_digest FROM user_preferences WHERE user_id = YOUR_USER_ID;"
```
Should show: `f` (false)

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 3: Preferences Tab - Theme Dropdown

**Steps:**
1. Still on Preferences tab
2. Click the Theme dropdown
3. Select "Dark"
4. Wait 1 second for save
5. Observe the setting value text

**Expected Results:**
- [ ] Dropdown shows "Dark" selected
- [ ] Setting value text changes to "Dark mode"
- [ ] Console shows: `[UserProfile] Preference updated: theme dark`
- [ ] No errors in console

**Database Verification:**
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT theme FROM user_preferences WHERE user_id = YOUR_USER_ID;"
```
Should show: `dark`

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 4: Preferences Persistence (Page Reload)

**Steps:**
1. With all preferences OFF/Dark, hard refresh the page (Cmd+R or Ctrl+R)
2. Navigate back to Settings → Preferences tab
3. Observe all preference values

**Expected Results:**
- [ ] Email Notifications toggle is OFF
- [ ] Weekly Digest toggle is OFF
- [ ] Theme dropdown shows "Dark"
- [ ] Setting value shows "Dark mode"
- [ ] Console shows: `[UserProfile] Loaded preferences: {email_notifications: false, weekly_digest: false, theme: 'dark'}`

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 5: Reset Preferences to Defaults

**Steps:**
1. Turn Email Notifications back ON
2. Turn Weekly Digest back ON
3. Change Theme back to "Light"
4. Refresh page

**Expected Results:**
- [ ] All toggles are ON after reload
- [ ] Theme is "Light"
- [ ] Preferences saved correctly

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 6: Account Tab - Email Verification Button

**Steps:**
1. Navigate to Settings → Account tab
2. Look for Email Verification row
3. If using Google OAuth, button should NOT be shown
4. If using email/password, button should be shown

**Expected Results:**
- [ ] Google users: No "Verify" button (already verified)
- [ ] Email users: "Verify" button shown
- [ ] If clicked: Success alert appears
- [ ] Console shows: `[UserProfile] Verification email sent successfully`

**Test Result:** ☐ PASS ☐ FAIL ☐ N/A

---

## TEST 7: Account Tab - Password Change Button

**Steps:**
1. Still on Account tab
2. Click "Change" button next to Password field
3. Wait for response

**Expected Results:**
- [ ] Button shows "Sending..." while processing
- [ ] Alert appears: "Password reset email sent to [email]"
- [ ] Console shows: `[UserProfile] Password reset email sent successfully`
- [ ] No errors

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 8: Account Tab - Delete Account Modal (Step 1: Warning)

**Steps:**
1. Scroll to DANGER ZONE section
2. Click "Delete Account" button
3. Observe modal that appears

**Expected Results:**
- [ ] Modal appears with warning icon
- [ ] Title: "Delete Account?"
- [ ] Shows list of what will be deleted
- [ ] Shows 14-day grace period notice
- [ ] "Cancel" and "Continue" buttons visible

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 9: Delete Account Modal (Step 2: Confirmation)

**Steps:**
1. From Step 1, click "Continue"
2. Observe second modal step

**Expected Results:**
- [ ] Title: "Are you absolutely sure?"
- [ ] Email input field shown
- [ ] Optional reason textarea shown
- [ ] Checkbox: "I understand this is permanent..."
- [ ] "Go Back" and "Delete My Account" buttons visible
- [ ] Delete button is DISABLED initially

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 10: Delete Account Modal (Validation)

**Steps:**
1. Try typing wrong email in confirmation field
2. Try checking the checkbox
3. Try clicking "Delete My Account"

**Expected Results:**
- [ ] Delete button stays disabled if email doesn't match
- [ ] Delete button stays disabled if checkbox not checked
- [ ] Delete button only enables when BOTH email matches AND checkbox checked
- [ ] If email wrong and clicked, shows error: "Email does not match"

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 11: Delete Account Modal (Cancel via X or Back)

**Steps:**
1. Click "Go Back" button
2. Should return to Step 1
3. Click "Cancel" button
4. Modal should close

**Expected Results:**
- [ ] Go Back returns to Step 1
- [ ] Cancel closes modal completely
- [ ] No deletion scheduled
- [ ] Can reopen modal and start again

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 12: Delete Account (Full Flow)

**IMPORTANT:** Only do this with a test account!

**Steps:**
1. Open Delete Account modal
2. Click "Continue"
3. Type your email correctly
4. Check the "I understand..." checkbox
5. Optionally add a reason
6. Click "Delete My Account"

**Expected Results:**
- [ ] Button shows "Deleting..." while processing
- [ ] Modal advances to Step 3 (Success)
- [ ] Title: "Account Deletion Scheduled"
- [ ] Shows deletion date (14 days from now)
- [ ] Message mentions email confirmation
- [ ] "Close" button visible

**Database Verification:**
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT deletion_scheduled_at, deletion_reason FROM users WHERE id = YOUR_USER_ID;"
```
Should show timestamp 14 days in future and your reason

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 13: Deletion Warning Banner Appears

**Steps:**
1. After scheduling deletion, close the modal
2. Look at the top of the Account tab

**Expected Results:**
- [ ] Red/orange warning banner appears
- [ ] Shows warning icon
- [ ] Title: "Account Deletion Scheduled"
- [ ] Shows deletion date
- [ ] "Cancel Deletion" button visible
- [ ] Banner has high visibility (red/orange colors)

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 14: Cancel Account Deletion

**Steps:**
1. With deletion banner visible, click "Cancel Deletion" button
2. Confirm in dialog that appears
3. Wait for response

**Expected Results:**
- [ ] Confirmation dialog appears: "Are you sure you want to cancel..."
- [ ] If confirmed, button shows "Canceling..." while processing
- [ ] Alert appears: "Account deletion cancelled successfully!"
- [ ] Warning banner disappears immediately
- [ ] Console shows: `[UserProfile] Account deletion cancelled successfully`

**Database Verification:**
```bash
docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT deletion_scheduled_at FROM users WHERE id = YOUR_USER_ID;"
```
Should show: `NULL` or empty

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 15: Banner Stays Hidden After Cancellation

**Steps:**
1. After canceling deletion, refresh the page
2. Navigate back to Settings → Account tab
3. Observe if banner appears

**Expected Results:**
- [ ] Warning banner does NOT appear
- [ ] Account tab looks normal
- [ ] No deletion scheduled

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 16: Multiple Preference Changes in Rapid Succession

**Steps:**
1. Go to Preferences tab
2. Quickly toggle Email Notifications OFF
3. Immediately toggle Weekly Digest OFF
4. Immediately change Theme to Dark
5. Wait 2 seconds

**Expected Results:**
- [ ] All three changes save successfully
- [ ] No race conditions or errors
- [ ] Console shows three separate "Preference updated" logs
- [ ] All preferences persist correctly

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 17: Error Handling (Network Offline)

**Steps:**
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Try to toggle a preference
4. Observe behavior
5. Re-enable network

**Expected Results:**
- [ ] Error alert appears
- [ ] Console shows error log
- [ ] Preference does NOT save
- [ ] Toggle may revert to previous state (depending on implementation)

**Test Result:** ☐ PASS ☐ FAIL

---

## TEST 18: Responsive Design (Mobile View)

**Steps:**
1. Open DevTools → Device Toolbar (Cmd+Shift+M or Ctrl+Shift+M)
2. Select iPhone or Android device
3. Navigate through all settings tabs
4. Test all toggles and buttons

**Expected Results:**
- [ ] Settings layout is responsive
- [ ] Tabs are accessible on mobile
- [ ] Toggles work on touch
- [ ] Modals are mobile-friendly
- [ ] No horizontal scroll
- [ ] All buttons are tappable

**Test Result:** ☐ PASS ☐ FAIL

---

## BUGS FOUND

### Bug 1
**Description:** ______________________________________
**Steps to Reproduce:** _______________________________
**Expected:** _________________________________________
**Actual:** ___________________________________________
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low

### Bug 2
**Description:** ______________________________________
**Steps to Reproduce:** _______________________________
**Expected:** _________________________________________
**Actual:** ___________________________________________
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low

---

## OVERALL SUMMARY

**Total Tests:** 18
**Tests Passed:** _____
**Tests Failed:** _____
**Tests Skipped/N/A:** _____

**Pass Rate:** _____%

**Ready for Production?** ☐ YES ☐ NO

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

**Tester Signature:** _______________  **Date:** ___________
