# 🗑️ Delete and Recreate Railway Services - Step by Step

## **Why We're Doing This:**

Railway cached the wrong configuration when the services were first created. Deleting and recreating forces Railway to create fresh cache with correct settings.

---

## **Step 1: Delete embedding-server Service**

### **1.1 Go to Railway Dashboard**
1. Open: https://railway.app
2. Log in if needed
3. Click on your project (the one with all your services)

### **1.2 Find embedding-server**
1. You should see a list of services
2. Find **embedding-server** in the list
3. Click on it

### **1.3 Delete the Service**
1. Go to **"Settings"** tab (at the top)
2. Scroll down to the bottom
3. Find **"Danger Zone"** section (usually red)
4. Click **"Delete Service"** button
5. Railway will ask for confirmation
6. Type the service name to confirm: `embedding-server`
7. Click **"Delete"** or **"Confirm"**

**⚠️ Wait for deletion to complete (10-30 seconds)**

---

## **Step 2: Delete ner-service Service**

### **2.1 Find ner-service**
1. Go back to your project (click project name at top)
2. Find **ner-service** in the services list
3. Click on it

### **2.2 Delete the Service**
1. Go to **"Settings"** tab
2. Scroll down to **"Danger Zone"** section
3. Click **"Delete Service"** button
4. Confirm by typing: `ner-service`
5. Click **"Delete"** or **"Confirm"**

**⚠️ Wait for deletion to complete (10-30 seconds)**

---

## **Step 3: Create embedding-server Service (NEW)**

### **3.1 Create New Service**
1. In your Railway project dashboard
2. Click **"+ New"** button (top right, usually green)
3. Select **"GitHub Repo"** from the dropdown

### **3.2 Connect Repository**
1. Railway will show your repositories
2. Find and click on: **redcube3_xhs** (or your repo name)
3. Railway will start detecting the project

### **3.3 Set Root Directory FIRST (CRITICAL!)**
1. Railway might auto-create a service - that's OK
2. Click on the newly created service (it might be named after your repo)
3. Go to **"Settings"** tab immediately
4. Find **"Root Directory"** field
5. **Clear it completely** (if it has anything)
6. **Type exactly:** `services/embedding-server`
   - No leading `/`
   - No trailing `/`
   - Lowercase
7. Click **"Save"** (or Railway auto-saves)

**⚠️ IMPORTANT: Do this BEFORE Railway starts building!**

### **3.4 Set Environment Variables**
1. Go to **"Variables"** tab
2. Click **"Raw Editor"** (top right)
3. Paste this:

```bash
MODEL_NAME=BAAI/bge-small-en-v1.5
NODE_ENV=production
```

4. Click **"Save"**

**⚠️ DO NOT set RAILWAY_DOCKERFILE_PATH - leave it unset!**

### **3.5 Deploy**
1. Railway should automatically start building
2. If not, go to **"Deployments"** tab
3. Click **"Deploy"** or **"Redeploy"** button
4. Wait for build (5-10 minutes for first build)

---

## **Step 4: Create ner-service Service (NEW)**

### **4.1 Create New Service**
1. Still in Railway project dashboard
2. Click **"+ New"** button again
3. Select **"GitHub Repo"**
4. Click on **redcube3_xhs** repository again

### **4.2 Set Root Directory FIRST (CRITICAL!)**
1. Click on the newly created service
2. Go to **"Settings"** tab immediately
3. Find **"Root Directory"** field
4. **Clear it completely**
5. **Type exactly:** `services/ner-service`
   - No leading `/`
   - No trailing `/`
   - Lowercase
6. Click **"Save"**

**⚠️ IMPORTANT: Do this BEFORE Railway starts building!**

### **4.3 Set Environment Variables**
1. Go to **"Variables"** tab
2. Click **"Raw Editor"**
3. Paste this:

```bash
MODEL_NAME=dslim/bert-base-NER
NODE_ENV=production
```

4. Click **"Save"**

**⚠️ DO NOT set RAILWAY_DOCKERFILE_PATH - leave it unset!**

### **4.4 Deploy**
1. Railway should automatically start building
2. If not, go to **"Deployments"** tab
3. Click **"Deploy"** or **"Redeploy"** button
4. Wait for build (10-15 minutes for first build - model downloads during build)

---

## **Step 5: Verify Build Success**

### **5.1 Check embedding-server**
1. Go to **embedding-server** → **"Deployments"** tab
2. Click on the latest deployment
3. Check build logs
4. **Should see:**
   - ✅ `COPY services/embedding-server/requirements.txt .`
   - ✅ `RUN pip install --no-cache-dir -r requirements.txt`
   - ✅ `COPY services/embedding-server/app.py .`
   - ✅ Build completes successfully

### **5.2 Check ner-service**
1. Go to **ner-service** → **"Deployments"** tab
2. Click on the latest deployment
3. Check build logs
4. **Should see:**
   - ✅ `COPY services/ner-service/requirements.txt .`
   - ✅ `RUN pip install --no-cache-dir -r requirements.txt`
   - ✅ `COPY services/ner-service/ .`
   - ✅ Model download during build
   - ✅ Build completes successfully

---

## **Common Mistakes to Avoid:**

### **❌ Mistake 1: Setting Root Directory AFTER Build Starts**
- Railway caches config when build starts
- If you set Root Directory after, it's too late
- **Fix:** Set Root Directory BEFORE any build

### **❐ Mistake 2: Setting RAILWAY_DOCKERFILE_PATH**
- Don't set this variable
- Root Directory is enough
- Railway will auto-detect Dockerfile

### **❌ Mistake 3: Wrong Root Directory Format**
- ❌ `/services/embedding-server` (leading slash)
- ❌ `services/embedding-server/` (trailing slash)
- ✅ `services/embedding-server` (correct)

### **❌ Mistake 4: Not Waiting for Deletion**
- If you recreate too fast, Railway might have stale cache
- **Fix:** Wait 30 seconds after deletion before recreating

---

## **If Build Still Fails:**

### **Check 1: Root Directory**
- Go to Settings → Root Directory
- Should be exactly: `services/embedding-server` or `services/ner-service`
- No slashes, lowercase

### **Check 2: Build Logs**
- Look for the exact error
- Share the error message

### **Check 3: GitHub**
- Make sure code is pushed to GitHub
- Check that Dockerfile exists at: `services/embedding-server/Dockerfile`
- Check that Dockerfile exists at: `services/ner-service/Dockerfile`

---

## **Summary:**

1. ✅ Delete embedding-server
2. ✅ Delete ner-service
3. ✅ Create embedding-server → Set Root Directory FIRST → Set ENV vars → Deploy
4. ✅ Create ner-service → Set Root Directory FIRST → Set ENV vars → Deploy
5. ✅ Verify builds succeed

**The key is setting Root Directory BEFORE Railway starts building!**

