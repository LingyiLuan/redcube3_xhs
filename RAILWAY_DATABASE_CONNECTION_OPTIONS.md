# 🔌 Railway PostgreSQL Connection Options

## **The Problem:**

`postgres.railway.internal` is Railway's **internal** hostname - it's only accessible from within Railway's network, not from your local computer.

---

## **Solution Options:**

### **Option 1: Use Railway's Web UI (Easiest - Recommended)**

1. **Go to Railway dashboard** → PostgreSQL service
2. **Look for one of these:**
   - **"Data" tab** (at the top)
   - **"Connect" button**
   - **"Query" button**
   - **Database icon/button**

3. **Click it** to open Railway's built-in database interface

4. **Paste this SQL:**
   ```sql
   CREATE DATABASE redcube_content;
   CREATE DATABASE redcube_users;
   CREATE DATABASE redcube_interviews;
   CREATE DATABASE redcube_notifications;
   ```

5. **Click "Run" or "Execute"**

✅ **This is the easiest way!**

---

### **Option 2: Get Public Connection String**

1. **Go to Railway dashboard** → PostgreSQL service
2. **Go to "Settings" tab**
3. **Look for "Variables" tab**
4. **Check if there's a `DATABASE_URL` or `POSTGRES_URL` variable**
5. **If yes, copy it** - it should look like:
   ```
   postgresql://postgres:password@public-hostname.railway.app:5432/postgres
   ```

6. **Use that hostname instead:**
   ```bash
   psql "postgresql://postgres:password@public-hostname.railway.app:5432/postgres"
   ```

---

### **Option 3: Use Railway CLI with Port Forwarding**

1. **Install Railway CLI:**
   ```bash
   brew install railway
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Link to your project:**
   ```bash
   railway link
   ```

4. **Port forward PostgreSQL:**
   ```bash
   railway connect postgres
   ```

5. **This will forward the database to localhost**, then you can connect:
   ```bash
   psql -h localhost -p 5432 -U postgres -d postgres
   ```

---

## **Recommended: Use Railway's Web UI**

**This is the fastest and easiest way:**

1. Go to Railway dashboard
2. Click PostgreSQL service
3. Find "Data" or "Query" button
4. Paste SQL commands
5. Click Run

**No command line needed!**

---

## **What to Do:**

1. **Try Railway's Web UI first** (easiest)
2. **If that doesn't work**, check for a public connection string
3. **If still not working**, use Railway CLI

Let me know which option you want to try!
