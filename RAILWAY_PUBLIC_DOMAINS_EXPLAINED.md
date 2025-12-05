# 🌐 Railway Public Domains - Explained

## **What You're Seeing:**

### **For Your Services (user-service, content-service, etc.):**
- You see "Generate domain" button
- You clicked it, but nothing appears immediately
- It says "Public domain will be generated"

### **For Postgres & Redis:**
- They already have public domains
- But these are **different** from your service domains

---

## **What's Happening:**

### **1. Service Public Domains (What You Need):**

When you click "Generate domain" for a service:
- Railway **starts generating** a domain
- It takes **10-30 seconds** to appear
- The domain format: `service-name-production.up.railway.app`
- Example: `user-service-production.up.railway.app`

**Why it's not showing:**
- Railway needs to deploy the service first
- Or the domain generation is still in progress
- Refresh the page after 30 seconds

**How to get it:**
1. Make sure your service is **deployed** (not just created)
2. Click "Generate domain" button
3. **Wait 10-30 seconds**
4. **Refresh the page** (F5 or Cmd+R)
5. The domain should appear under "Public Domain"

**If it still doesn't appear:**
- Check if service is actually deployed (not just created)
- Check deployment logs for errors
- Try clicking "Generate domain" again
- Wait a bit longer (sometimes takes 1-2 minutes)

---

### **2. Postgres & Redis Public Domains (Different Purpose):**

Postgres and Redis have public domains, but:
- These are for **database connections** (not for your API Gateway)
- They're used internally by Railway
- You **don't need** these for callback URLs
- You use Railway references instead: `${{Postgres.PGHOST}}`

**Don't use Postgres/Redis public domains for:**
- ❌ OAuth callback URLs
- ❌ API Gateway routing
- ❌ Frontend API calls

**Use them for:**
- ✅ External database tools (if you want to connect from outside Railway)
- ✅ Database backups
- ✅ Debugging (rarely needed)

---

## **What You Actually Need:**

### **For OAuth Callback URLs:**

You need the **API Gateway's public domain**, not individual service domains.

**Steps:**
1. **Deploy API Gateway service** first
2. Go to API Gateway → Settings → Networking
3. Click "Generate domain"
4. Wait 10-30 seconds
5. Refresh page
6. Copy the public domain (e.g., `api-gateway-production.up.railway.app`)
7. Use it in callback URLs:
   ```
   https://api-gateway-production.up.railway.app/api/auth/google/callback
   ```

### **For Service-to-Service Communication:**

Your services (user-service, content-service, etc.) **don't need public domains** for internal communication.

Railway handles this automatically via:
- Internal service names
- Service discovery
- Private networking

**You only need public domains for:**
- ✅ API Gateway (so frontend can call it)
- ✅ Services you want to access from outside Railway (rare)

---

## **Step-by-Step: Get API Gateway Domain**

1. **Deploy API Gateway:**
   - Make sure API Gateway service is deployed
   - Check "Deployments" tab - should show "Active"

2. **Generate Domain:**
   - Go to API Gateway → Settings → Networking
   - Click "Generate domain" button
   - **Wait 10-30 seconds** (don't click multiple times)

3. **Refresh Page:**
   - Press F5 (Windows) or Cmd+R (Mac)
   - Or close and reopen the tab

4. **Copy Domain:**
   - You should see: `api-gateway-production.up.railway.app` (or similar)
   - Copy this domain

5. **Update Callback URLs:**
   - In `railway-user-service.env`, replace `YOUR_RAILWAY_API_DOMAIN` with the actual domain
   - Example:
     ```
     GOOGLE_CALLBACK_URL=https://api-gateway-production.up.railway.app/api/auth/google/callback
     ```

---

## **Troubleshooting:**

### **Domain Not Appearing After 30 Seconds:**

**Check:**
1. Is the service actually deployed?
   - Go to "Deployments" tab
   - Should show "Active" deployment
   - If not, deploy the service first

2. Are there any errors?
   - Check "Logs" tab
   - Look for deployment errors

3. Try again:
   - Click "Generate domain" again
   - Wait 1-2 minutes
   - Refresh page

### **Domain Generated But Not Working:**

**Check:**
1. Is the service running?
   - Check "Deployments" → "Logs"
   - Service should be listening on port 80 (or configured port)

2. Test the domain:
   ```bash
   curl https://your-service-domain.up.railway.app/health
   ```
   Should return a response

---

## **Summary:**

1. **Postgres/Redis domains:** Different purpose (database connections), not needed for callbacks
2. **Service domains:** Generated after deployment, takes 10-30 seconds
3. **API Gateway domain:** This is what you need for OAuth callbacks
4. **Other services:** Don't need public domains (internal communication only)

**Next Steps:**
1. Deploy API Gateway
2. Generate its public domain
3. Wait 10-30 seconds
4. Refresh page
5. Copy domain
6. Update callback URLs in `railway-user-service.env`
