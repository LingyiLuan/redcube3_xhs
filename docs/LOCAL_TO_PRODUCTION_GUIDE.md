# Local to Production: Why It's Hard & Lessons Learned

This document captures the challenges faced during the 3-day production deployment of Interview Intel, explaining why apps that work perfectly locally can break in production.

---

## The Core Problem: "It Works On My Machine"

**Local development hides complexity.** When running locally:
- Everything is on `localhost` (same origin)
- No SSL/HTTPS required
- No cross-domain cookie issues
- Single network (no firewall/proxy)
- Environment variables are in `.env` file
- No container orchestration
- No load balancing
- No CDN/caching layers

**Production exposes all of these.**

---

## Summary of Our 3-Day Production Journey

| Day | Issues Faced | Root Cause |
|-----|--------------|------------|
| 1 | 502 Bad Gateway, services not starting | Railway port configuration, Dockerfile issues |
| 2 | OAuth login fails, cookies not persisting | Cross-domain cookies, duplicate session cookies |
| 3 | Forgot password hangs, emails not sending | SMTP port blocked by cloud provider |

**Time breakdown:**
- 40% debugging cross-domain/cookie issues
- 25% Railway configuration (ports, env vars, networking)
- 20% OAuth flow issues
- 15% email/SMTP configuration

---

## Category 1: Cross-Origin & Cookie Issues (40% of time)

### Why It Works Locally
```
Frontend: http://localhost:5173
Backend:  http://localhost:8080
→ Same origin (localhost), cookies just work
```

### Why It Breaks in Production
```
Frontend: https://labzero.io
Backend:  https://api.labzero.io
→ Different origins, strict cookie rules apply
```

### Issues We Faced

#### 1. Cookies Not Being Sent
**Symptom:** User logs in successfully but appears logged out on next request.

**Root Cause:** Browser blocks cross-origin cookies by default.

**Fix:**
```javascript
// Backend: Express session configuration
app.use(session({
  cookie: {
    sameSite: 'lax',           // Not 'strict'
    secure: true,               // Required for HTTPS
    domain: '.labzero.io',      // Dot prefix for subdomains
    httpOnly: true
  }
}));

// Frontend: Fetch with credentials
fetch(url, { credentials: 'include' });

// Backend: CORS configuration
app.use(cors({
  origin: 'https://labzero.io',
  credentials: true              // Allow cookies
}));
```

#### 2. Duplicate Session Cookies (The Hardest Bug)
**Symptom:** OAuth completes successfully, but user appears logged out.

**Root Cause:** Browser had TWO `connect.sid` cookies with slightly different attributes. Express reads the first one (the stale, unauthenticated one).

**Why it happened:**
- Old cookie from development had different domain/path
- New cookie from OAuth had correct attributes
- Browser kept both because attributes differed
- Express read the first (wrong) one

**Fix:**
```javascript
// Clear ALL existing cookies before setting new session
res.clearCookie('connect.sid', { path: '/', domain: '.labzero.io' });
req.session.regenerate(() => { ... });
```

**Lesson:** Always inspect REQUEST headers (`Cookie:`), not just RESPONSE headers (`Set-Cookie:`).

---

## Category 2: Railway/Cloud Platform Configuration (25% of time)

### Why It Works Locally
- Docker Compose handles networking
- Ports are explicitly mapped
- Services discover each other by container name

### Why It Breaks in Production

#### 1. Port Configuration
**Symptom:** 502 Bad Gateway

**Root Cause:** Railway expects apps to listen on `PORT` env variable (usually 8080), not hardcoded ports.

**Fix:**
```javascript
// Wrong
app.listen(3000);

// Right
const PORT = process.env.PORT || 3000;
app.listen(PORT);
```

#### 2. Internal Service Discovery
**Symptom:** Services can't communicate with each other.

**Root Cause:** Locally, services use `http://service-name:3000`. In Railway, you need internal URLs.

**Fix:**
```
# Railway internal networking
USER_SERVICE_URL=http://user-service.railway.internal:8080
CONTENT_SERVICE_URL=http://content-service.railway.internal:8080
```

#### 3. Environment Variables Not Set
**Symptom:** Random features broken.

**Root Cause:** `.env` file exists locally but not in Railway. Each service needs its own env vars configured in Railway dashboard.

**Fix:** Manually configure ALL environment variables in Railway for EACH service.

---

## Category 3: OAuth Flow Issues (20% of time)

### Why It Works Locally
- Callback URL is `http://localhost:8080/callback`
- No HTTPS required
- Session persists easily

### Why It Breaks in Production

#### 1. Wrong Callback URLs
**Symptom:** OAuth fails with "redirect_uri mismatch"

**Root Cause:** Google/LinkedIn OAuth apps configured with localhost URLs.

**Fix:** Update OAuth app settings:
```
Google Console → Authorized redirect URIs:
  https://api.labzero.io/api/auth/google/callback

LinkedIn Developer Portal → Authorized redirect URLs:
  https://api.labzero.io/api/auth/linkedin/callback
```

#### 2. Session Lost During OAuth Redirect
**Symptom:** User redirected to Google, comes back, session is gone.

**Root Cause:** Session cookie not persisting across the external redirect.

**Fix:** Ensure session is saved before redirect:
```javascript
req.session.save(() => {
  res.redirect(googleAuthUrl);
});
```

---

## Category 4: Email/SMTP Issues (15% of time)

### Why It Works Locally
- Direct connection to Gmail SMTP
- No firewall blocking outbound connections
- Port 465 (SSL) works fine

### Why It Breaks in Production

#### 1. SMTP Ports Blocked
**Symptom:** Forgot password hangs forever, no email received.

**Root Cause:** Cloud providers (Railway, Heroku, AWS) often block outbound SMTP ports (25, 465) to prevent spam.

**Fix:**
```javascript
// Use port 587 (STARTTLS) instead of 465 (SSL)
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,           // Not 465
  secure: false,       // STARTTLS, not SSL
  requireTLS: true
};
```

#### 2. Connection Timeouts
**Symptom:** Request hangs indefinitely.

**Root Cause:** No timeout configured on SMTP connection.

**Fix:**
```javascript
const emailConfig = {
  connectionTimeout: 10000,  // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 15000
};
```

---

## The Production Debugging Checklist

When something works locally but breaks in production, check in this order:

### 1. Environment Variables
```bash
# Are all env vars set in Railway?
# Common missing ones:
- DATABASE_URL
- REDIS_URL
- SESSION_SECRET
- FRONTEND_URL
- OAuth credentials
- API keys
```

### 2. CORS Configuration
```javascript
// Is credentials: true set?
// Is origin set to exact frontend URL (not *)?
// Is the right domain in Access-Control-Allow-Origin?
```

### 3. Cookie Configuration
```javascript
// Check these cookie attributes:
{
  secure: true,          // Required for HTTPS
  sameSite: 'lax',       // Not 'strict' for OAuth
  domain: '.yourdomain.com',  // Dot prefix for subdomains
  httpOnly: true
}
```

### 4. Network Requests
```bash
# Check browser Network tab:
# - Are cookies being sent? (Request headers → Cookie)
# - Are cookies being set? (Response headers → Set-Cookie)
# - What's the actual error response?
```

### 5. Server Logs
```bash
# Check Railway logs:
railway logs --service user-service
railway logs --service api-gateway
```

### 6. Port Configuration
```javascript
// Is the app listening on process.env.PORT?
const PORT = process.env.PORT || 3000;
```

---

## Why These Issues Don't Appear Locally

| Issue | Why Hidden Locally | Why Exposed in Production |
|-------|-------------------|---------------------------|
| Cross-origin cookies | Same localhost origin | Different domains |
| Duplicate cookies | Fresh browser each time | Users have existing cookies |
| SMTP blocked | Direct internet access | Cloud firewall rules |
| Wrong callback URLs | Using localhost URLs | Need production URLs |
| Missing env vars | .env file exists | Must configure manually |
| Port binding | Docker Compose handles | Cloud platform requirements |
| Session persistence | No external redirects | OAuth redirects externally |
| SSL/HTTPS | Not required | Required for secure cookies |

---

## Tools That Would Have Saved Time

### 1. Pre-Production Checklist
Before deploying, verify:
- [ ] All env vars documented and configured
- [ ] OAuth callback URLs updated for production
- [ ] CORS allows production frontend URL
- [ ] Cookie domain includes production domain
- [ ] Email service uses port 587 (STARTTLS)
- [ ] All services listen on `process.env.PORT`

### 2. Staging Environment
Having a staging environment (e.g., `staging.labzero.io`) would catch most issues before production.

### 3. Feature Flags
Ability to test production features in isolation:
```javascript
if (process.env.ENABLE_NEW_AUTH === 'true') {
  // New auth code
}
```

### 4. Better Logging
```javascript
// Log all cookie-related info in production
console.log('[Auth] Request cookies:', req.headers.cookie);
console.log('[Auth] Session ID:', req.sessionID);
console.log('[Auth] Session user:', req.session?.user?.id);
```

---

## The Hardest Bugs (Ranked)

### 1. Duplicate Session Cookies (8+ hours)
- Everything looked correct
- OAuth worked, session created, cookie set
- Had to inspect REQUEST headers, not response
- Browser was sending two cookies, Express read the stale one

### 2. Cross-Origin Cookie Not Sent (4+ hours)
- Worked in Postman, failed in browser
- Had to understand SameSite, Secure, Domain attributes
- Required coordinated frontend + backend changes

### 3. SMTP Port Blocked (2+ hours)
- No error message, just hung forever
- Had to add timeout to see the failure
- Had to research cloud provider port restrictions

### 4. OAuth Callback URL Mismatch (1+ hour)
- Clear error message but multiple places to fix
- Google Console, LinkedIn Portal, backend config, frontend redirect

---

## Key Takeaways

### 1. Production is a Different Environment
Don't assume anything that works locally will work in production. The network, security policies, and configuration are fundamentally different.

### 2. Cookies Are the #1 Pain Point
Cross-domain cookies are the single biggest source of production bugs for web apps. Understand SameSite, Secure, Domain, and Path attributes deeply.

### 3. Always Add Timeouts
Never let any network operation hang forever. Add timeouts to:
- Database connections
- Redis connections
- SMTP connections
- External API calls
- OAuth flows

### 4. Log Everything in Production
The more logging you have, the faster you debug. Log:
- Request/response cookies
- Session state
- External API calls
- Error details with stack traces

### 5. Test with Production-Like Conditions
Before deploying:
- Test with HTTPS locally (mkcert)
- Test with different domains (modify /etc/hosts)
- Test OAuth with production callback URLs
- Test with existing session cookies

---

## Summary: The 3-Day Production Timeline

| Time | What Happened |
|------|---------------|
| Day 1, Morning | Railway deployment, 502 errors |
| Day 1, Afternoon | Fixed port configuration, services running |
| Day 1, Evening | Discovered OAuth login failing |
| Day 2, Morning | Debugged CORS, cookies not being sent |
| Day 2, Afternoon | Fixed cookie configuration |
| Day 2, Evening | Found duplicate cookie bug |
| Day 3, Morning | Fixed session regeneration |
| Day 3, Afternoon | Forgot password hanging |
| Day 3, Evening | Fixed SMTP timeout and port |

**Total: ~72 hours of work compressed into 3 days**

---

## Final Advice

1. **Expect production issues.** Budget 2-3 days for production debugging, even for a "working" local app.

2. **Document everything.** These issues will happen again on your next project.

3. **Start production deployment early.** Don't wait until "everything is done locally" - deploy a minimal version first.

4. **Use staging environments.** They catch 80% of production issues before they affect real users.

5. **Learn the fundamentals.** HTTP cookies, CORS, OAuth flows, DNS - these are the building blocks that break in production.

---

**Last Updated:** December 2, 2025
**Author:** Lingyi Luan
**Context:** Interview Intel (labzero.io) production deployment
