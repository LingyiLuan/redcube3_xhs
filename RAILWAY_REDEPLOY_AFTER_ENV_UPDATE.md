# 🔄 Railway: Redeploy After Environment Variable Update

## **Yes, You Need to Redeploy!**

After updating environment variables in Railway, you **must redeploy** the service for the changes to take effect.

**Why:**
- Environment variables are loaded when the service starts
- Running services don't automatically reload new environment variables
- You need to restart/redeploy to pick up the new values

---

## **How to Redeploy in Railway:**

### **Method 1: Manual Redeploy (Recommended)**

1. **Go to the service** (e.g., user-service)
2. **Click "Deployments" tab**
3. **Click "..." (three dots)** on the latest deployment
4. **Click "Redeploy"**
5. **Wait for deployment to complete** (~1-2 minutes)

### **Method 2: Trigger New Deployment**

1. **Go to the service**
2. **Click "Settings" tab**
3. **Scroll down to "Deploy" section**
4. **Click "Redeploy" button**
5. **Wait for deployment to complete**

### **Method 3: Push to GitHub (Auto-Deploy)**

If you have auto-deploy enabled:
1. **Make a small change** to your code (or just commit)
2. **Push to GitHub**
3. **Railway will automatically redeploy**

---

## **What Happens During Redeploy:**

1. Railway stops the current service
2. Railway loads the new environment variables
3. Railway starts the service with new variables
4. Service restarts with updated configuration

**Time:** Usually 1-2 minutes per service

---

## **After Redeploy:**

1. **Check Logs:**
   - Go to "Deployments" → Latest deployment → "Logs"
   - Verify service started successfully
   - Look for any errors

2. **Test the Service:**
   - Test health endpoint: `https://api-gateway-production-b197.up.railway.app/health`
   - Test OAuth: Try logging in with Google/LinkedIn

3. **Verify Environment Variables:**
   - Go to "Variables" tab
   - Confirm all variables are set correctly

---

## **Quick Checklist:**

After updating environment variables:

- [ ] Updated variables in Railway dashboard
- [ ] Clicked "Save" on variables
- [ ] Redeployed the service
- [ ] Checked deployment logs for errors
- [ ] Tested the service (health check, OAuth, etc.)

---

## **Pro Tip:**

You can redeploy multiple services at once:
1. Update variables for all services
2. Redeploy each service one by one
3. Or wait and redeploy all at once

**Order doesn't matter** for most services, but if services depend on each other:
- Deploy API Gateway last (after all backend services)
- Or deploy in any order - Railway handles dependencies

---

## **Troubleshooting:**

### **Service Won't Start After Redeploy:**

1. **Check Logs:**
   - Go to "Deployments" → "Logs"
   - Look for error messages
   - Common issues:
     - Missing environment variables
     - Invalid variable values
     - Database connection errors

2. **Verify Variables:**
   - Go to "Variables" tab
   - Make sure all required variables are set
   - Check Railway references are correct (e.g., `${{Postgres.PGHOST}}`)

3. **Check Dependencies:**
   - Make sure Postgres and Redis are running
   - Check if other services are deployed

---

## **Summary:**

✅ **Yes, redeploy after updating environment variables**
✅ **Takes 1-2 minutes per service**
✅ **Check logs after redeploy to verify it worked**
✅ **Test the service to confirm changes took effect**
