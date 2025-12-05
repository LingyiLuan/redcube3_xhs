# 🚀 Deploy Embedding-Server & NER-Service to Railway - Step by Step

## **Yes, Deploy Both Services Now!**

Follow these steps to deploy `embedding-server` and `ner-service` to Railway.

---

## **Step 1: Deploy Embedding-Server**

### **1.1 Create Service in Railway**

1. Go to Railway dashboard: https://railway.app
2. Click on your project
3. Click **"+ New"** button (top right)
4. Select **"GitHub Repo"**
5. Choose your repository: `redcube3_xhs`
6. Railway will start detecting the project

### **1.2 Configure Service**

1. **Set Root Directory:**
   - Click on the service (it might be named after your repo)
   - Go to **"Settings"** tab
   - Find **"Root Directory"** field
   - Set it to: `/services/embedding-server`
   - Click **"Save"**

2. **Set Environment Variables:**
   - Go to **"Variables"** tab
   - Click **"Raw Editor"** (top right)
   - Paste the contents of `railway-embedding-server.env`:
     ```
     MODEL_NAME=BAAI/bge-small-en-v1.5
     NODE_ENV=production
     ```
   - Click **"Save"**

### **1.3 Deploy**

1. Railway will automatically start building
2. **Wait for deployment** (5-10 minutes)
   - First build: Downloads Python dependencies
   - First startup: Downloads model from HuggingFace (5-10 minutes)
3. Check **"Logs"** tab to see progress
4. Look for: `Model loaded successfully! Embedding dimension: 384`

### **1.4 Verify**

1. Check **"Deployments"** tab
2. Should show: **"Active"** (green)
3. Service is ready! ✅

---

## **Step 2: Deploy NER-Service**

### **2.1 Create Service in Railway**

1. Still in Railway dashboard
2. Click **"+ New"** button again
3. Select **"GitHub Repo"**
4. Choose your repository: `redcube3_xhs`

### **2.2 Configure Service**

1. **Set Root Directory:**
   - Click on the service
   - Go to **"Settings"** tab
   - Find **"Root Directory"** field
   - Set it to: `/services/ner-service`
   - Click **"Save"**

2. **Set Environment Variables:**
   - Go to **"Variables"** tab
   - Click **"Raw Editor"**
   - Paste the contents of `railway-ner-service.env`:
     ```
     MODEL_NAME=dslim/bert-base-NER
     NODE_ENV=production
     ```
   - Click **"Save"**

### **2.3 Deploy**

1. Railway will automatically start building
2. **Wait for deployment** (10-15 minutes)
   - Build: Downloads Python dependencies
   - Build: Downloads model from HuggingFace (10-15 minutes - this happens during build!)
   - Startup: Service starts quickly (model already in image)
3. Check **"Logs"** tab to see progress
4. Look for: `✅ NER model loaded successfully`

### **2.4 Verify**

1. Check **"Deployments"** tab
2. Should show: **"Active"** (green)
3. Service is ready! ✅

---

## **Step 3: Update Content-Service**

### **3.1 Add Environment Variables**

1. Go to Railway dashboard
2. Click on **content-service**
3. Go to **"Variables"** tab
4. Click **"Raw Editor"**
5. Add these two lines at the end:
   ```
   EMBEDDING_SERVER_URL=http://embedding-server
   NER_SERVICE_URL=http://ner-service
   ```
6. Click **"Save"**

### **3.2 Redeploy**

1. Railway will automatically redeploy content-service
2. Or manually trigger: **"Deployments"** tab → **"Redeploy"**
3. Wait for deployment to complete

---

## **Step 4: Test Everything**

### **4.1 Check Service Logs**

1. **Embedding-Server:**
   - Go to embedding-server → **"Logs"** tab
   - Should see: `Model loaded successfully! Embedding dimension: 384`

2. **NER-Service:**
   - Go to ner-service → **"Logs"** tab
   - Should see: `✅ NER model loaded successfully`

3. **Content-Service:**
   - Go to content-service → **"Logs"** tab
   - Should see: No errors about embedding/ner services

### **4.2 Test from Content-Service**

1. Try creating a batch analysis
2. Check logs for embedding/NER calls
3. Verify embeddings are generated
4. Verify metadata is extracted

---

## **What to Expect:**

### **First Deployment Times:**

- **Embedding-Server:** 5-10 minutes (model downloads on startup)
- **NER-Service:** 10-15 minutes (model downloads during build)
- **Content-Service:** 2-3 minutes (just redeploy)

### **Subsequent Deployments:**

- **Embedding-Server:** 2-3 minutes (model cached)
- **NER-Service:** 2-3 minutes (model in image)
- **Content-Service:** 2-3 minutes

---

## **Troubleshooting:**

### **Issue: Build fails**

**Check:**
- Root directory is set correctly?
- Environment variables are set?
- Check build logs for errors

### **Issue: Model download takes too long**

**Solution:**
- This is normal! First deployment takes 10-15 minutes
- Be patient - models are large (hundreds of MB)
- Subsequent deployments are faster

### **Issue: Service can't connect**

**Check:**
- Are both services deployed and active?
- Are environment variables set in content-service?
- Check Railway logs for connection errors

---

## **Quick Checklist:**

- [ ] Deploy embedding-server (set root directory, env vars)
- [ ] Wait for embedding-server to be active
- [ ] Deploy ner-service (set root directory, env vars)
- [ ] Wait for ner-service to be active
- [ ] Update content-service env vars (add service URLs)
- [ ] Redeploy content-service
- [ ] Test everything works

---

## **Summary:**

**What you're doing:**
1. ✅ Deploy embedding-server → Downloads model automatically
2. ✅ Deploy ner-service → Downloads model during build
3. ✅ Update content-service → Points to new services
4. ✅ Test → Verify everything works

**Time needed:** ~30-40 minutes (mostly waiting for model downloads)

**Ready to deploy!** 🚀
