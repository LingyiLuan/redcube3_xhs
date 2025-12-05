# 📋 Railway ENV File Instructions

## **How to Use the ENV File:**

1. **Open the file:** `railway-user-service.env`

2. **Replace ALL placeholders:**
   - `YOUR_GOOGLE_CLIENT_ID_HERE` → Your actual Google OAuth client ID
   - `YOUR_GOOGLE_CLIENT_SECRET_HERE` → Your actual Google OAuth secret
   - `YOUR_LINKEDIN_CLIENT_ID_HERE` → Your actual LinkedIn client ID
   - `YOUR_LINKEDIN_CLIENT_SECRET_HERE` → Your actual LinkedIn secret
   - `YOUR_RAILWAY_API_DOMAIN` → Your Railway API Gateway URL (e.g., `api-gateway-production.up.railway.app`)
   - `YOUR_RANDOM_32_CHARACTER_SECRET_HERE` → Generate random string (see below)
   - `YOUR_EMAIL@gmail.com` → Your Gmail address (if using email)
   - `YOUR_GMAIL_APP_PASSWORD_HERE` → Your Gmail app password (if using email)

3. **Generate SESSION_SECRET:**
   ```bash
   openssl rand -base64 32
   ```
   Or use an online generator: https://randomkeygen.com/

4. **Copy the entire file content** (after replacing placeholders)

5. **In Railway:**
   - Go to user-service → Variables tab
   - Click "Raw Editor" button
   - Delete all existing variables
   - Paste the ENV file content
   - Click "Save"

---

## **Quick Reference - Where to Get Credentials:**

### **Google OAuth:**
- Go to: https://console.cloud.google.com/apis/credentials
- Find your OAuth 2.0 Client ID
- Copy Client ID and Client Secret

### **LinkedIn OAuth:**
- Go to: https://www.linkedin.com/developers/apps
- Find your app
- Go to "Auth" tab
- Copy Client ID and Client Secret

### **Railway API Domain:**
- Go to Railway dashboard
- Click on your API Gateway service
- Go to "Settings" → "Networking"
- Copy the "Public Domain" (e.g., `api-gateway-production.up.railway.app`)

### **Gmail App Password:**
- Go to: https://myaccount.google.com/apppasswords
- Generate a new app password
- Use it for `GMAIL_APP_PASSWORD`

---

## **After Pasting:**

1. ✅ Verify Railway references are correct: `${{Postgres.PGHOST}}`, etc.
2. ✅ Verify all `YOUR_*_HERE` placeholders are replaced
3. ✅ Verify `NODE_ENV=production`
4. ✅ Click "Save"
5. ✅ Redeploy service if needed
