# 🗄️ Railway Database Setup - Step-by-Step Instructions

## **The Error:**

```
database "redcube_content" does not exist
```

**This means:**
- Railway PostgreSQL instance exists
- But the databases (`redcube_content`, `redcube_users`, etc.) don't exist
- You need to create them

---

## **What Other Companies Do:**

### **Most Common Approach:**

1. **Create databases manually** (one-time setup)
2. **Run migrations** to create tables
3. **Automate for future** (optional)

---

## **What You Have:**

✅ **You already have migration scripts!**
- `shared/database/init/01-create-databases.sql` - Creates all databases
- `shared/database/init/02-create-tables.sql` - Creates tables
- Many other migration files

---

## **Step-by-Step Solution:**

### **Step 1: Create Databases (Quick Fix)**

**Option A: Using Railway's Database UI (Easiest)**

1. **Go to Railway dashboard**
2. **Click on PostgreSQL service**
3. **Look for "Connect" or "Query" button** (or "Data" tab)
4. **Click to open database UI**
5. **Run this SQL:**
   ```sql
   CREATE DATABASE redcube_content;
   CREATE DATABASE redcube_users;
   CREATE DATABASE redcube_interviews;
   CREATE DATABASE redcube_notifications;
   ```

**Option B: Using psql (Command Line)**

1. **Get PostgreSQL connection from Railway:**
   - Railway dashboard → PostgreSQL → Settings → Variables
   - Copy: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`

2. **Connect:**
   ```bash
   psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres
   ```

3. **Run SQL:**
   ```sql
   CREATE DATABASE redcube_content;
   CREATE DATABASE redcube_users;
   CREATE DATABASE redcube_interviews;
   CREATE DATABASE redcube_notifications;
   ```

**Option C: Use Your Migration Script**

You have `shared/database/init/01-create-databases.sql`:
```sql
CREATE DATABASE redcube_users;
CREATE DATABASE redcube_interviews;
CREATE DATABASE redcube_content;
CREATE DATABASE redcube_notifications;
```

**Run it:**
```bash
psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres -f shared/database/init/01-create-databases.sql
```

### **Step 2: Run Table Migrations**

After creating databases, you need to create tables:

1. **You have migration files in `shared/database/init/`:**
   - `02-create-tables.sql` - Creates initial tables
   - `03-phase2-tables.sql` - Phase 2 tables
   - `04-phase3-auth-tables.sql` - Auth tables
   - And many more...

2. **Run migrations for each database:**
   ```bash
   # For content-service
   psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_content -f shared/database/init/02-create-tables.sql
   psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_content -f shared/database/init/07-phase4-scraper-tables.sql
   # ... run other relevant migrations
   
   # For user-service
   psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_users -f shared/database/init/04-phase3-auth-tables.sql
   # ... run other relevant migrations
   ```

3. **Or use your migration script:**
   - `scripts/migrate-to-railway.sh` - Exports local databases
   - You might need to adapt it to import to Railway

### **Step 3: Verify Databases Created**

1. **Check Railway dashboard → PostgreSQL**
2. **Connect to database**
3. **List databases:**
   ```sql
   \l
   ```
4. **Should see:**
   - redcube_content
   - redcube_users
   - redcube_interviews
   - redcube_notifications

### **Step 4: Redeploy Services**

1. **After databases and tables are created**
2. **Redeploy content-service**
3. **Should connect successfully**

---

## **Recommended Approach:**

### **Quick Fix (Now):**

1. **Create databases manually** using Railway's database UI
2. **Run key migrations** to create tables
3. **Redeploy services**

### **Long-term (Optional):**

1. **Create automated setup script**
2. **Runs on first deployment**
3. **Creates databases and runs migrations**

---

## **What to Do Right Now:**

### **Step 1: Create Databases**

1. Go to Railway dashboard → PostgreSQL
2. Use database UI or psql
3. Run:
   ```sql
   CREATE DATABASE redcube_content;
   CREATE DATABASE redcube_users;
   CREATE DATABASE redcube_interviews;
   CREATE DATABASE redcube_notifications;
   ```

### **Step 2: Run Basic Migrations**

1. Run `02-create-tables.sql` for each database
2. Run other relevant migrations
3. Check which migrations are needed for each service

### **Step 3: Test**

1. Redeploy content-service
2. Check logs - should connect successfully
3. No more "database does not exist" errors

---

## **Summary:**

**The Problem:**
- Databases don't exist in Railway PostgreSQL
- Need to create them manually

**The Solution:**
1. Create databases using Railway's database UI or psql
2. Run migrations to create tables
3. Redeploy services

**You have the migration scripts - just need to run them!**

Let me know once you've created the databases, and I can help with running the migrations!
