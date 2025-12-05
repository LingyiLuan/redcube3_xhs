# 🔍 How to Get Railway Service URLs

## **The "xxxx" is a Placeholder!**

The `xxxx` in the URLs is **NOT** what you should use. Railway will generate a **unique URL** for each service after deployment.

---

## **What Railway URLs Look Like:**

### **Format:**
```
{service-name}-{environment}-{random-id}.up.railway.app
```

### **Examples:**
- `embedding-server-production-a1b2c3d4.up.railway.app`
- `ner-service-production-e5f6g7h8.up.railway.app`
- `user-service-production-5d66.up.railway.app` (you already have this!)

**Notice:** The random ID is different for each service!

---

## **How to Find Your Service URLs:**

### **Method 1: Railway Dashboard (Easiest)**

1. **Go to Railway Dashboard:**
   - https://railway.app
   - Log in → Select your project

2. **Click on the service** (e.g., `embedding-server`)

3. **Look for "Settings" tab:**
   - Click on **"Settings"** tab
   - Scroll down to **"Domains"** section
   - You'll see: **"Generate Domain"** button

4. **Generate Domain:**
   - Click **"Generate Domain"**
   - Railway will create a URL like: `embedding-server-production-xxxx.up.railway.app`
   - **Copy this URL!**

5. **Repeat for ner-service:**
   - Click on `ner-service`
   - Settings → Generate Domain
   - Copy the URL

---

### **Method 2: Service Overview**

1. **In Railway Dashboard:**
   - Click on the service
   - Look at the **top of the page**
   - You might see the domain already listed

2. **Or check "Deployments" tab:**
   - Click **"Deployments"** tab
   - Look at the latest deployment
   - The URL might be shown there

---

### **Method 3: Railway CLI**

```bash
# List all services and their URLs
railway status

# Or for a specific service
railway status --service embedding-server
```

---

## **Step-by-Step: Getting Your URLs**

### **For Embedding-Server:**

1. Railway dashboard → Click `embedding-server` service
2. **Settings** tab → Scroll to **"Domains"**
3. Click **"Generate Domain"**
4. Railway shows: `embedding-server-production-a1b2c3d4.up.railway.app`
5. **Copy this entire URL**

### **For NER-Service:**

1. Railway dashboard → Click `ner-service` service
2. **Settings** tab → Scroll to **"Domains"**
3. Click **"Generate Domain"**
4. Railway shows: `ner-service-production-e5f6g7h8.up.railway.app`
5. **Copy this entire URL**

---

## **Then Update Content-Service:**

Once you have both URLs, update `content-service` environment variables:

```
EMBEDDING_SERVER_URL=https://embedding-server-production-a1b2c3d4.up.railway.app
NER_SERVICE_URL=https://ner-service-production-e5f6g7h8.up.railway.app
```

**Replace with YOUR actual URLs!**

---

## **Example:**

**What you have now (placeholder):**
```
EMBEDDING_SERVER_URL=https://embedding-server-production-xxxx.up.railway.app
```

**What it should be (actual URL):**
```
EMBEDDING_SERVER_URL=https://embedding-server-production-a1b2c3d4.up.railway.app
```

**Notice:** `xxxx` → `a1b2c3d4` (your actual random ID)

---

## **Important Notes:**

1. **Each service gets a unique URL** - don't reuse the same URL
2. **URLs are permanent** - they won't change unless you delete/recreate the service
3. **Use HTTPS** - Railway URLs use HTTPS by default
4. **Copy the entire URL** - including `https://` and `.up.railway.app`

---

## **Quick Checklist:**

- [ ] Deploy embedding-server to Railway
- [ ] Generate domain for embedding-server
- [ ] Copy embedding-server URL
- [ ] Deploy ner-service to Railway
- [ ] Generate domain for ner-service
- [ ] Copy ner-service URL
- [ ] Update content-service environment variables with actual URLs
- [ ] Redeploy content-service

---

## **Troubleshooting:**

### **Issue: "Generate Domain" button not showing**

**Solution:**
- Make sure service is deployed and running
- Check if domain was already generated (look in Settings)
- Try refreshing the page

### **Issue: Don't know which URL is which**

**Solution:**
- The URL contains the service name: `embedding-server-...` or `ner-service-...`
- Check the service name in Railway dashboard

---

## **Summary:**

**Q: Should I use "xxxx" as-is?**
**A: NO!** Replace `xxxx` with the actual random ID Railway generates.

**Q: Where do I get the actual URL?**
**A: Railway Dashboard → Service → Settings → Generate Domain**

**Q: What does the actual URL look like?**
**A: `https://embedding-server-production-a1b2c3d4.up.railway.app`** (random ID instead of xxxx)

**Ready to get your URLs!** 🔍
