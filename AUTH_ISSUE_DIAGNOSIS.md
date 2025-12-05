# 🔍 Authentication Issue Diagnosis

## ❌ **Problem**

After restarting laptop, getting:
- **Error:** `500 /assistant/chats`
- **Message:** `"Authentication service error: Failed to verify authentication: Request failed with status code 401"`
- **Root Cause:** `content-service` → `user-service` auth verification is failing

---

## 🔬 **What's Happening**

### **1. Request Flow**
1. Browser → `https://api.labzero.io/api/content/assistant/chats`
2. `content-service` receives request with session cookie
3. `content-service` calls `user-service:3001/api/auth/me` with cookie
4. `user-service` returns **401 Unauthorized**
5. `content-service` returns **500** (wraps the 401 error)

### **2. Logs Show**
```
user-service-1 | GET /api/auth/me - Authenticated: false
```
**All auth requests are failing** - user-service is not recognizing the session cookie.

---

## 🎯 **Root Causes (Most Likely)**

### **Cause 1: User Not Logged In (After Restart)**
- **After laptop restart, session cookies are lost**
- User needs to **log in again** to get a new session cookie
- **Solution:** User should log in again

### **Cause 2: Cookie Domain Mismatch**
- **Current config:** `SESSION_COOKIE_DOMAIN=.labzero.io`
- **Problem:** Cookie might not be sent to `api.labzero.io` if:
  - Cookie was set for `labzero.io` (not `.labzero.io`)
  - Browser is blocking cross-subdomain cookie
  - Cookie path/domain settings are incorrect

### **Cause 3: Cookie Not Being Sent**
- Browser might not be sending the cookie to `api.labzero.io`
- Check if cookie exists in browser DevTools → Application → Cookies
- Cookie must have:
  - `Domain=.labzero.io` (or `labzero.io`)
  - `Path=/`
  - `Secure=true`
  - `SameSite=None` (for cross-subdomain)

### **Cause 4: Session Store Issue**
- After restart, **session data might be lost** if using in-memory store
- Need to check if user-service is using persistent session store (Redis/DB)

---

## 🔍 **What to Check**

### **1. Check if User is Logged In**
- Open browser DevTools → Application → Cookies
- Look for `redcube.sid` cookie
- Check if it exists and has correct domain/path

### **2. Check Cookie Attributes**
Cookie should have:
- ✅ `Domain=.labzero.io` (or `labzero.io`)
- ✅ `Path=/`
- ✅ `Secure=true`
- ✅ `SameSite=None`
- ✅ `HttpOnly=true`

### **3. Check User-Service Session Store**
- Is user-service using **Redis** or **in-memory** session store?
- After restart, **in-memory sessions are lost**
- Need **persistent session store** (Redis/PostgreSQL)

### **4. Check Environment Variables**
- `user-service` has:
  - ✅ `SESSION_COOKIE_SECURE=true`
  - ✅ `SESSION_COOKIE_DOMAIN=.labzero.io`
  - ✅ `SESSION_SECRET=...`
- `content-service` needs:
  - ❓ `FRONTEND_URL` (for CORS)
  - ❓ `CORS_ORIGIN` (if used)

---

## ✅ **Solutions**

### **Solution 1: User Needs to Log In Again**
**Most likely fix:**
1. User should **log out and log in again**
2. This will create a new session cookie
3. Cookie will be set with correct domain/path

### **Solution 2: Fix Session Store (If Using In-Memory)**
**If user-service is using in-memory session store:**
- Switch to **Redis** or **PostgreSQL** session store
- Sessions will persist across restarts
- Users won't need to log in again after restart

### **Solution 3: Verify Cookie Middleware**
**Check if cookie fix middleware is working:**
- The middleware in `user-service/src/app.js` should:
  - Set `SameSite=None`
  - Set `Secure=true`
  - Set `Domain=.labzero.io`
- Verify it's running and fixing cookies correctly

### **Solution 4: Check CORS Configuration**
**Verify CORS allows credentials:**
- `content-service` CORS should include:
  - `origin: ['https://labzero.io', ...]`
  - `credentials: true`
- Already configured correctly ✅

---

## 🎯 **Immediate Action**

**Most likely:** User needs to **log in again** after restart.

**To verify:**
1. Open browser DevTools → Application → Cookies
2. Check if `redcube.sid` cookie exists
3. If not, user needs to log in
4. If yes, check cookie attributes (domain, path, secure, sameSite)

**If cookie exists but auth still fails:**
- Check user-service session store (Redis vs in-memory)
- Check if session data persists across restarts
- May need to switch to persistent session store

---

## 📝 **Why This Happened After Restart**

**After laptop restart:**
1. ✅ Docker containers restarted (sessions in memory are lost)
2. ✅ User-service restarted (in-memory sessions cleared)
3. ❌ User's browser still has old cookie (but session doesn't exist on server)
4. ❌ Result: Cookie is sent, but user-service doesn't recognize it → 401

**Fix:** User needs to log in again to create a new session.

**Long-term fix:** Use persistent session store (Redis) so sessions survive restarts.
