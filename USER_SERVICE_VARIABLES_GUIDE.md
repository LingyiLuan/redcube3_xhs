# 🔧 User-Service Variables Guide

## **What Railway Detected vs. What You Actually Need**

Railway detected variables from your entire codebase, but **user-service only needs a subset**. Here's what to do:

---

## **❌ CRITICAL FIX NEEDED:**

### **Fix DB_PORT (You have a bug!):**

**Current (WRONG):**
```
DB_PORT="${{Postgres.PGPORT}}5432"
```

**Should be:**
```
DB_PORT="${{Postgres.PGPORT}}"
```

**Why:** Railway's `PGPORT` already includes the port number (5432). You're appending "5432" to it, which creates an invalid port like "54325432".

**How to fix:**
1. Click on `DB_PORT` variable
2. Change value from `${{Postgres.PGPORT}}5432` to just `${{Postgres.PGPORT}}`
3. Click "Save"

---

## **✅ Variables You Need (Keep These):**

### **Database Variables (Already Set - Just Fix DB_PORT):**
- ✅ `DB_HOST="${{Postgres.PGHOST}}"` - **KEEP** (already correct)
- ❌ `DB_PORT="${{Postgres.PGPORT}}5432"` - **FIX** (remove "5432")
- ❌ `DB_NAME` - **MISSING!** Add this: `DB_NAME="redcube_users"` (or reference `Postgres.PGDATABASE`)
- ✅ `DB_USER="${{Postgres.PGUSER}}"` - **KEEP** (already correct)
- ✅ `DB_PASSWORD="${{Postgres.PGPASSWORD}}"` - **KEEP** (already correct)

### **Redis:**
- ✅ `REDIS_URL="${{Redis.REDIS_URL}}"` - **KEEP** (already correct)

### **OAuth (Fill with YOUR actual values):**
- `GOOGLE_CLIENT_ID` - **MISSING!** Add this with your actual Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - **MISSING!** Add this with your actual Google OAuth secret
- `GOOGLE_CALLBACK_URL` - **MISSING!** Add this: `https://your-railway-api.up.railway.app/api/auth/google/callback`
- `LINKEDIN_CLIENT_ID` - **MISSING!** Add this with your actual LinkedIn client ID
- `LINKEDIN_CLIENT_SECRET` - **MISSING!** Add this with your actual LinkedIn secret
- `LINKEDIN_CALLBACK_URL` - **MISSING!** Add this: `https://your-railway-api.up.railway.app/api/auth/linkedin/callback`

### **Session (Fill with YOUR values):**
- `SESSION_SECRET` - **MISSING!** Generate a random 32+ character string
- `SESSION_COOKIE_SECURE` - **MISSING!** Set to: `true`
- `SESSION_COOKIE_DOMAIN` - **MISSING!** Set to: `.labzero.io`
- `FRONTEND_URL` - **MISSING!** Set to: `https://labzero.io`

### **Email (Fill if you use email features):**
- `GMAIL_USER` - **MISSING!** Your Gmail address
- `GMAIL_APP_PASSWORD` - **MISSING!** Your Gmail app password
- `SMTP_PORT` - **MISSING!** Set to: `587`

### **Environment:**
- `NODE_ENV` - **CHANGE** from `"development"` to `"production"`

---

## **❌ Variables You DON'T Need (Delete These):**

These are for **other services**, not user-service. You can **delete** them:

### **For Content Service (Not User Service):**
- ❌ `ANALYSIS_TIMEOUT_MS`
- ❌ `APIFY_ACTOR_ID`
- ❌ `APIFY_API_TOKEN`
- ❌ `BATCH_SIZE_LIMIT`
- ❌ `CONTENT_SERVICE_PORT`
- ❌ `DB_CONTENT`
- ❌ `DEEPSEEK_API_KEY`
- ❌ `ENABLE_SCHEDULER`
- ❌ `MAX_ANALYSIS_TEXT_LENGTH`
- ❌ `OPENAI_API_KEY`
- ❌ `REDDIT_CLIENT_ID`
- ❌ `REDDIT_PASS`
- ❌ `REDDIT_SECRET`
- ❌ `REDDIT_USER`

### **For Other Services:**
- ❌ `API_GATEWAY_PORT` (for API Gateway)
- ❌ `DB_INTERVIEWS` (for Interview Service)
- ❌ `DB_NOTIFICATIONS` (for Notification Service)
- ❌ `INTERVIEW_SERVICE_PORT` (for Interview Service)
- ❌ `NOTIFICATION_SERVICE_PORT` (for Notification Service)
- ❌ `USER_SERVICE_PORT` (Railway handles ports automatically)

### **For Monitoring (Not Needed in Production):**
- ❌ `GRAFANA_PORT`
- ❌ `PROMETHEUS_PORT`

### **Not Used:**
- ❌ `DB_USERS` (duplicate/wrong - use `DB_NAME` instead)
- ❌ `JWT_EXPIRES_IN` (not used by user-service)
- ❌ `JWT_SECRET` (not used by user-service)

---

## **📋 Complete User-Service Variables List:**

Here's what your user-service Variables tab should look like:

```bash
# Database (Railway References)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}                    # ⚠️ FIX: Remove "5432" from end
DB_NAME=redcube_users                           # ⚠️ ADD: Missing!
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# Redis (Railway Reference)
REDIS_URL=${{Redis.REDIS_URL}}

# OAuth - Google
GOOGLE_CLIENT_ID=your-actual-google-client-id   # ⚠️ ADD: Fill with your value
GOOGLE_CLIENT_SECRET=your-actual-google-secret  # ⚠️ ADD: Fill with your value
GOOGLE_CALLBACK_URL=https://your-railway-api.up.railway.app/api/auth/google/callback  # ⚠️ ADD

# OAuth - LinkedIn
LINKEDIN_CLIENT_ID=your-actual-linkedin-id      # ⚠️ ADD: Fill with your value
LINKEDIN_CLIENT_SECRET=your-actual-linkedin-secret  # ⚠️ ADD: Fill with your value
LINKEDIN_CALLBACK_URL=https://your-railway-api.up.railway.app/api/auth/linkedin/callback  # ⚠️ ADD

# Session
SESSION_SECRET=generate-random-32-char-string   # ⚠️ ADD: Generate random string
SESSION_COOKIE_SECURE=true                     # ⚠️ ADD
SESSION_COOKIE_DOMAIN=.labzero.io              # ⚠️ ADD
FRONTEND_URL=https://labzero.io                 # ⚠️ ADD

# Email (Optional - if you use email features)
GMAIL_USER=your-email@gmail.com                 # ⚠️ ADD: Fill if needed
GMAIL_APP_PASSWORD=your-gmail-app-password      # ⚠️ ADD: Fill if needed
SMTP_PORT=587                                   # ⚠️ ADD

# Environment
NODE_ENV=production                             # ⚠️ CHANGE: From "development"
```

**Total: ~20 variables** (not 30+)

---

## **🔧 Step-by-Step Actions:**

### **Step 1: Fix DB_PORT**
1. Find `DB_PORT` variable
2. Change value from `${{Postgres.PGPORT}}5432` to `${{Postgres.PGPORT}}`
3. Save

### **Step 2: Add Missing Database Variable**
1. Click "+ New Variable"
2. Name: `DB_NAME`
3. Value: `redcube_users`
4. Save

### **Step 3: Delete Unnecessary Variables**
1. For each variable in the "Don't Need" list above:
   - Click on the variable
   - Click "Delete" or trash icon
   - Confirm deletion

### **Step 4: Add Missing OAuth Variables**
1. Add `GOOGLE_CLIENT_ID` with your actual Google OAuth client ID
2. Add `GOOGLE_CLIENT_SECRET` with your actual Google OAuth secret
3. Add `GOOGLE_CALLBACK_URL` with your Railway API URL
4. Repeat for LinkedIn variables

### **Step 5: Add Missing Session Variables**
1. Add `SESSION_SECRET` - Generate random string (32+ chars)
2. Add `SESSION_COOKIE_SECURE` = `true`
3. Add `SESSION_COOKIE_DOMAIN` = `.labzero.io`
4. Add `FRONTEND_URL` = `https://labzero.io`

### **Step 6: Change NODE_ENV**
1. Find `NODE_ENV` variable
2. Change value from `development` to `production`
3. Save

### **Step 7: Add Email Variables (If Needed)**
1. Add `GMAIL_USER` with your Gmail address
2. Add `GMAIL_APP_PASSWORD` with your Gmail app password
3. Add `SMTP_PORT` = `587`

---

## **✅ Final Checklist:**

After making changes, verify:

- [ ] `DB_PORT` is `${{Postgres.PGPORT}}` (NOT `${{Postgres.PGPORT}}5432`)
- [ ] `DB_NAME` exists and equals `redcube_users`
- [ ] All OAuth variables are filled with your actual values
- [ ] All session variables are set correctly
- [ ] `NODE_ENV` is `production`
- [ ] All unnecessary variables are deleted
- [ ] Total variables: ~20 (not 30+)

---

## **💡 Pro Tip:**

You can use Railway's "Raw Editor" to quickly delete multiple variables:
1. Click "Raw Editor" button
2. Delete lines for variables you don't need
3. Click "Save"

This is faster than deleting one by one!
