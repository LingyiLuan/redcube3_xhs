# 🔧 Fix: Railway Can't Find requirements.txt

## **The Problem:**

Railway is looking for `requirements.txt` in the wrong place. Even though you set "Root Directory" to `/services/embedding-server`, Railway might not be using it as the build context correctly.

---

## **Solution 1: Verify Root Directory Setting**

### **For Embedding-Server:**

1. Go to Railway dashboard
2. Click on **embedding-server** service
3. Go to **"Settings"** tab
4. Check **"Root Directory"** field
5. Make sure it says: `/services/embedding-server` (with leading slash)
6. If it's wrong, change it and click **"Save"**
7. **Redeploy** the service

### **For NER-Service:**

1. Go to Railway dashboard
2. Click on **ner-service** service
3. Go to **"Settings"** tab
4. Check **"Root Directory"** field
5. Make sure it says: `/services/ner-service` (with leading slash)
6. If it's wrong, change it and click **"Save"**
7. **Redeploy** the service

---

## **Solution 2: Use Railway's Build Context (Alternative)**

If Root Directory doesn't work, try this:

### **Option A: Set Build Context in Railway Settings**

1. Go to service → **Settings** tab
2. Look for **"Build Context"** or **"Docker Build Context"**
3. Set it to: `.` (current directory)
4. Make sure **"Root Directory"** is still set correctly

### **Option B: Update Dockerfile to Use Absolute Paths**

If Railway still can't find files, we might need to update the Dockerfiles to be more explicit.

---

## **Solution 3: Check File Structure**

Verify the files exist in the correct locations:

### **Embedding-Server Should Have:**
```
services/embedding-server/
  ├── Dockerfile
  ├── requirements.txt  ← Must exist here
  └── app.py
```

### **NER-Service Should Have:**
```
services/ner-service/
  ├── Dockerfile
  ├── requirements.txt  ← Must exist here
  └── main.py
```

**Check:** Are these files actually in your GitHub repository?

---

## **Solution 4: Push Code to GitHub**

If you haven't pushed the latest code:

1. Make sure all files are committed:
   ```bash
   git status
   ```

2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Add embedding-server and ner-service"
   git push
   ```

3. Railway will automatically redeploy

---

## **Most Likely Fix:**

**The Root Directory setting might not have been saved correctly.**

**Try this:**
1. Go to service → **Settings** tab
2. **Clear** the Root Directory field
3. **Type it again:** `/services/embedding-server` (or `/services/ner-service`)
4. Click **"Save"**
5. **Redeploy** the service

---

## **Quick Checklist:**

- [ ] Root Directory is set to `/services/embedding-server` (for embedding-server)
- [ ] Root Directory is set to `/services/ner-service` (for ner-service)
- [ ] Files exist in GitHub repository
- [ ] Latest code is pushed to GitHub
- [ ] Service is redeployed after fixing Root Directory

---

## **If Still Not Working:**

Share:
1. What does the Root Directory field show in Railway?
2. Are the files in your GitHub repository? (Check on GitHub.com)
3. What's the exact error message?

**We'll fix it!** 🔧
