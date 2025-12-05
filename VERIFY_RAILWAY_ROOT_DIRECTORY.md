# 🔍 Verify Railway Root Directory Setting

## **If Files Are Already on GitHub:**

Since you can see the files on GitHub, the issue is likely the **Root Directory** setting in Railway.

---

## **Step-by-Step: Check Root Directory**

### **For Embedding-Server:**

1. **Go to Railway Dashboard:**
   - https://railway.app
   - Click on your project
   - Click on **embedding-server** service

2. **Check Settings:**
   - Click **"Settings"** tab
   - Scroll down to find **"Root Directory"** field
   - **What does it say?**
     - ✅ Should be: `/services/embedding-server`
     - ❌ Might be: `services/embedding-server` (missing `/`)
     - ❌ Might be: `/embedding-server` (wrong path)
     - ❌ Might be: empty or `.`

3. **If Wrong, Fix It:**
   - Click on the Root Directory field
   - **Clear it completely**
   - **Type exactly:** `/services/embedding-server`
   - Make sure it starts with `/`
   - Click **"Save"**

4. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** button
   - Wait for build to complete

---

### **For NER-Service:**

1. **Go to Railway Dashboard:**
   - Click on **ner-service** service

2. **Check Settings:**
   - Click **"Settings"** tab
   - Scroll down to find **"Root Directory"** field
   - **What does it say?**
     - ✅ Should be: `/services/ner-service`
     - ❌ Might be: `services/ner-service` (missing `/`)
     - ❌ Might be: `/ner-service` (wrong path)
     - ❌ Might be: empty or `.`

3. **If Wrong, Fix It:**
   - Click on the Root Directory field
   - **Clear it completely**
   - **Type exactly:** `/services/ner-service`
   - Make sure it starts with `/`
   - Click **"Save"**

4. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** button
   - Wait for build to complete

---

## **Common Issues:**

### **Issue 1: Root Directory Not Set**

**Symptom:** Field is empty or shows `.`

**Fix:** Set it to `/services/embedding-server` or `/services/ner-service`

---

### **Issue 2: Missing Leading Slash**

**Symptom:** Shows `services/embedding-server` (no `/` at start)

**Fix:** Change to `/services/embedding-server` (with `/`)

---

### **Issue 3: Wrong Path**

**Symptom:** Shows `/embedding-server` or just `embedding-server`

**Fix:** Change to `/services/embedding-server` (full path)

---

### **Issue 4: Case Sensitivity**

**Symptom:** Shows `/Services/Embedding-Server` (wrong case)

**Fix:** Change to `/services/embedding-server` (lowercase)

---

## **How to Verify It's Correct:**

### **After Setting Root Directory:**

1. **Check Build Logs:**
   - Go to **"Deployments"** tab
   - Click on latest deployment
   - Look for build logs
   - Should see: `COPY requirements.txt .` (not an error)

2. **If You See:**
   ```
   ERROR: "/requirements.txt": not found
   ```
   → Root Directory is still wrong

3. **If You See:**
   ```
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   ```
   → Root Directory is correct! ✅

---

## **Alternative: Check Railway's Build Context**

Some Railway projects have a **"Build Context"** setting separate from Root Directory:

1. Go to **Settings** tab
2. Look for **"Build Context"** or **"Docker Build Context"**
3. If it exists, set it to: `.` (current directory)
4. Make sure Root Directory is still set correctly

---

## **What to Tell Me:**

After checking Railway, tell me:

1. **What does Root Directory show for embedding-server?**
   - Exact text in the field

2. **What does Root Directory show for ner-service?**
   - Exact text in the field

3. **Are the files on GitHub?**
   - Can you see `services/embedding-server/requirements.txt`?
   - Can you see `services/ner-service/requirements.txt`?

4. **What's the latest build log error?**
   - Copy the exact error message

**Then I can help you fix it!** 🔧
