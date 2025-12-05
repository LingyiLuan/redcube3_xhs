# 🔍 Railway Environment Variables - Simple Explanation

## **What Happened:**

When you connected your GitHub repo to Railway, Railway **automatically scanned** your code and found:

1. ✅ **All environment variable names** from your `docker-compose.yml`
2. ✅ **All environment variable names** from your source code (where you use `process.env.VARIABLE_NAME`)

Railway shows these in the "Variables" tab for each service.

---

## **What You Need to Do:**

### **Step 1: Check What Railway Found**

1. Go to Railway dashboard
2. Click on a service (e.g., "user-service")
3. Click "Variables" tab
4. You'll see a list of variables Railway detected

**Example of what you might see:**
```
GOOGLE_CLIENT_ID=          (empty - needs your value)
GOOGLE_CLIENT_SECRET=      (empty - needs your value)
DB_HOST=                   (empty - needs Railway Postgres reference)
REDIS_URL=                 (empty - needs Railway Redis reference)
```

---

### **Step 2: Fill in the Values**

Railway found the **names** but the **values** are empty or have placeholders. You need to:

#### **A. For Database/Redis - Use Railway's Service References:**

Instead of manually typing values, Railway lets you **reference** other services:

1. Click on `DB_HOST` variable
2. Click "Reference Variable" button
3. Select "Postgres" service
4. Select "PGHOST"
5. Railway automatically sets it to: `${{Postgres.PGHOST}}`

**Do this for:**
- `DB_HOST` → Reference `Postgres.PGHOST`
- `DB_PORT` → Reference `Postgres.PGPORT`
- `DB_NAME` → Reference `Postgres.PGDATABASE`
- `DB_USER` → Reference `Postgres.PGUSER`
- `DB_PASSWORD` → Reference `Postgres.PGPASSWORD`
- `REDIS_URL` → Reference `Redis.REDIS_URL`

#### **B. For API Keys/Secrets - Fill with Your Actual Values:**

Railway found the variable names, but you need to provide the actual values:

1. Click on `GOOGLE_CLIENT_ID`
2. Click "Edit"
3. Paste your actual Google OAuth client ID (from Google Cloud Console)
4. Click "Save"

**Do this for:**
- `GOOGLE_CLIENT_ID` → Your actual Google client ID
- `GOOGLE_CLIENT_SECRET` → Your actual Google secret
- `OPENROUTER_API_KEY` → Your actual OpenRouter API key
- `SESSION_SECRET` → Generate a random 32+ character string
- etc.

#### **C. For URLs - Update to Use Railway Domain:**

1. Click on `GOOGLE_CALLBACK_URL`
2. Replace `localhost:8080` with your Railway API domain:
   - Old: `http://localhost:8080/api/auth/google/callback`
   - New: `https://your-railway-api.up.railway.app/api/auth/google/callback`
   - (Replace `your-railway-api.up.railway.app` with your actual Railway API Gateway URL)

---

## **Visual Example:**

### **Before (What Railway Shows):**
```
Variables Tab:
├── GOOGLE_CLIENT_ID=                    (empty)
├── GOOGLE_CLIENT_SECRET=                (empty)
├── DB_HOST=                             (empty)
├── REDIS_URL=                           (empty)
└── GOOGLE_CALLBACK_URL=http://localhost:8080/...  (needs update)
```

### **After (What You Fill In):**
```
Variables Tab:
├── GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com  ✅
├── GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here                ✅
├── DB_HOST=${{Postgres.PGHOST}}                                ✅ (reference)
├── REDIS_URL=${{Redis.REDIS_URL}}                              ✅ (reference)
└── GOOGLE_CALLBACK_URL=https://api.up.railway.app/api/auth/google/callback  ✅
```

---

## **Common Questions:**

### **Q: Do I need to add variables manually?**
**A:** No! Railway already found them. You just need to fill in the values.

### **Q: What if Railway didn't find a variable?**
**A:** Then you need to add it manually:
1. Click "+ New Variable"
2. Enter variable name
3. Enter value

### **Q: What does `${{Postgres.PGHOST}}` mean?**
**A:** This is Railway's way of saying "use the PGHOST value from the Postgres service I created". Railway automatically replaces this with the actual value when your service runs.

### **Q: Do I need to change all variables?**
**A:** Only the ones that:
- Are empty (need your actual values)
- Reference localhost (need Railway domain)
- Need service references (Database/Redis)

### **Q: What if I don't have some API keys yet?**
**A:** You can leave them empty for now, but those features won't work. You can add them later.

---

## **Quick Checklist:**

For each service, check:

- [ ] Database variables use Railway Postgres references
- [ ] Redis variable uses Railway Redis reference
- [ ] OAuth client IDs/secrets are filled with your actual values
- [ ] Callback URLs use Railway domain (not localhost)
- [ ] API keys (OpenRouter, OpenAI, etc.) are filled with your actual keys
- [ ] SESSION_SECRET is a random 32+ character string
- [ ] FRONTEND_URL points to your production domain (https://labzero.io)

---

## **Need Help?**

If you're stuck:
1. Check Railway's logs (service → Deployments → Logs)
2. Look for error messages mentioning missing variables
3. Verify variables are set correctly in Railway dashboard
4. Make sure you clicked "Save" after editing variables
