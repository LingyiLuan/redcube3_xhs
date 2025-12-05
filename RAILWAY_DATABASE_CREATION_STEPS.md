# 🗄️ Railway Database Creation - Step-by-Step Instructions

## **Step 1: Open Railway Dashboard**

1. Go to https://railway.app
2. Log in to your account
3. Click on your project (the one with all your services)

---

## **Step 2: Find PostgreSQL Service**

1. In your Railway project dashboard, look for the **PostgreSQL** service
2. It should be listed alongside your other services (user-service, content-service, etc.)
3. **Click on the PostgreSQL service**

---

## **Step 3: Connect to Database**

You have **two options**:

### **Option A: Use Railway's Database UI (Easiest)**

1. In the PostgreSQL service page, look for:
   - **"Data" tab** (at the top)
   - **"Connect" button**
   - **"Query" button**
   - Or a **database icon/button**

2. Click on it to open Railway's database interface

3. You should see a SQL query editor or database browser

### **Option B: Use Railway's Connection String**

1. In PostgreSQL service page, go to **"Settings" tab**
2. Look for **"Variables" tab**
3. Find these variables:
   - `PGHOST` (or `PGHOST`)
   - `PGPORT` (usually 5432)
   - `PGUSER` (usually `postgres`)
   - `PGPASSWORD` (the password)

4. Copy these values (you'll need them for psql)

---

## **Step 4: Create Databases**

### **If Using Railway's Database UI:**

1. In the SQL query editor, paste this SQL:
   ```sql
   CREATE DATABASE redcube_content;
   CREATE DATABASE redcube_users;
   CREATE DATABASE redcube_interviews;
   CREATE DATABASE redcube_notifications;
   ```

2. Click **"Run"** or **"Execute"** button

3. You should see success messages like:
   - "CREATE DATABASE"
   - Or no error messages

### **If Using psql (Command Line):**

1. Open Terminal on your computer

2. Connect to Railway PostgreSQL:
   ```bash
   psql -h [PGHOST_VALUE] -p [PGPORT_VALUE] -U [PGUSER_VALUE] -d postgres
   ```
   
   Replace:
   - `[PGHOST_VALUE]` with the actual PGHOST value from Railway
   - `[PGPORT_VALUE]` with the actual PGPORT value (usually 5432)
   - `[PGUSER_VALUE]` with the actual PGUSER value (usually `postgres`)

3. When prompted, enter the password (PGPASSWORD value)

4. Once connected, you'll see: `postgres=#`

5. Run these commands one by one:
   ```sql
   CREATE DATABASE redcube_content;
   CREATE DATABASE redcube_users;
   CREATE DATABASE redcube_interviews;
   CREATE DATABASE redcube_notifications;
   ```

6. After each command, you should see: `CREATE DATABASE`

7. Type `\l` to list all databases and verify they were created

8. Type `\q` to exit psql

---

## **Step 5: Verify Databases Were Created**

1. In Railway's database UI, or in psql, run:
   ```sql
   \l
   ```

2. You should see these databases in the list:
   - redcube_content
   - redcube_users
   - redcube_interviews
   - redcube_notifications

3. If you see them, ✅ **Success!**

---

## **Step 6: Run Table Migrations (Next Step)**

After creating databases, you need to create tables. But let's do that after you confirm databases are created.

---

## **Troubleshooting:**

### **If you can't find "Data" or "Connect" button:**

1. Look for **"Settings"** tab in PostgreSQL service
2. Look for **"Networking"** tab - might have connection info there
3. Or Railway might have a **"Query"** or **"SQL"** button somewhere

### **If psql command doesn't work:**

1. Make sure you have PostgreSQL client installed:
   ```bash
   which psql
   ```
   
2. If not installed, install it:
   ```bash
   # macOS
   brew install postgresql
   ```

### **If you get "permission denied" error:**

1. Make sure you're using the correct user (usually `postgres`)
2. Make sure you're connecting to the `postgres` database first
3. Railway's default user should have permissions

---

## **What to Do After Creating Databases:**

Once databases are created:

1. ✅ **Verify** they exist (Step 5)
2. 📝 **Tell me** when databases are created
3. 🔄 **I'll help you** run table migrations next

---

## **Quick Reference:**

**SQL to create databases:**
```sql
CREATE DATABASE redcube_content;
CREATE DATABASE redcube_users;
CREATE DATABASE redcube_interviews;
CREATE DATABASE redcube_notifications;
```

**To verify:**
```sql
\l
```

**To exit psql:**
```sql
\q
```

---

## **Summary:**

1. ✅ Go to Railway dashboard
2. ✅ Click on PostgreSQL service
3. ✅ Open database UI or connect via psql
4. ✅ Run CREATE DATABASE commands
5. ✅ Verify with `\l`
6. ✅ Tell me when done, and I'll help with migrations

Let me know when you've created the databases!
