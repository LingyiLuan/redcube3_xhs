# 🧪 Local vs Production Testing - Which Should You Use?

## **The Issue:**

When you logged in locally, OAuth redirected you to `labzero.io` (production) instead of `localhost:5174` (local dev).

**Why?**
- Your local `user-service` is using production environment variables
- `FRONTEND_URL=https://labzero.io` (production)
- `GOOGLE_CALLBACK_URL=https://api-gateway-production-b197.up.railway.app` (production)
- OAuth providers redirect to production URLs

---

## **Option 1: Test Locally (Recommended for Redis Testing)**

### **Pros:**
- ✅ Test local Redis session store
- ✅ Faster iteration (no deployment needed)
- ✅ Safe to experiment
- ✅ Can see logs directly

### **Cons:**
- ❌ Need to set localhost environment variables
- ❌ Need to register localhost URLs in OAuth providers (Google/LinkedIn)
- ❌ More setup required

### **What You Need:**

1. **Set localhost environment variables:**
   ```bash
   export FRONTEND_URL=http://localhost:5174
   export GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
   export LINKEDIN_CALLBACK_URL=http://localhost:8080/api/auth/linkedin/callback
   export SESSION_COOKIE_SECURE=false  # false for HTTP localhost
   export SESSION_COOKIE_DOMAIN=       # empty for localhost
   ```

2. **Register localhost URLs in OAuth providers:**
   - Google Cloud Console → OAuth credentials → Add `http://localhost:8080/api/auth/google/callback`
   - LinkedIn Developers → Redirect URLs → Add `http://localhost:8080/api/auth/linkedin/callback`

3. **Restart user-service:**
   ```bash
   cd services/user-service
   export REDIS_URL=redis://localhost:6379
   export FRONTEND_URL=http://localhost:5174
   export GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
   # ... other vars
   npm start
   ```

---

## **Option 2: Test on Production (labzero.io)**

### **Pros:**
- ✅ No setup needed (already configured)
- ✅ Tests real production environment
- ✅ OAuth already works
- ✅ Can test with real users

### **Cons:**
- ❌ Tests Railway Redis, not local Redis
- ❌ Can't see local logs easily
- ❌ Slower (deployment cycle)
- ❌ Risk of affecting production

### **What You Need:**

1. **Just use the domain:**
   - Go to: `https://labzero.io`
   - Log in via OAuth
   - Sessions will be stored in Railway Redis

2. **Check Railway Redis:**
   - Need Railway CLI or dashboard
   - Can't easily check from local machine

---

## **Recommendation:**

### **For Testing Redis Session Store:**

**Use Option 1 (Localhost)** because:
- You want to test **local Redis**
- You can see sessions in local Redis easily
- Faster to iterate
- Safe to experiment

### **For Final Verification:**

**Use Option 2 (Production)** because:
- Tests real production setup
- Verifies Railway Redis works
- Tests with real OAuth callbacks

---

## **Quick Decision:**

**If you want to test local Redis session store:**
→ Use **localhost** (Option 1)
→ Set localhost environment variables
→ Register localhost URLs in OAuth providers

**If you just want to verify it works:**
→ Use **labzero.io** (Option 2)
→ Log in on production
→ Check Railway Redis (harder to access)

---

## **My Recommendation:**

**Test locally first** (Option 1) to:
1. Verify Redis session store works
2. See sessions in local Redis
3. Test session persistence
4. Then verify on production (Option 2)

**But if you want to skip local setup:**
- Just test on `labzero.io`
- Sessions will be in Railway Redis
- Can't easily check them, but they'll work

---

## **What Do You Want to Do?**

1. **Test locally** → Set localhost env vars + register OAuth URLs
2. **Test on production** → Just use `labzero.io` (but can't check local Redis)
3. **Both** → Test locally first, then verify on production

**Which do you prefer?**
