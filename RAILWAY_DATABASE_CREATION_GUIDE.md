# 🗄️ Railway Database Creation Error - Analysis

## **The Error:**

```
database "redcube_content" does not exist
```

**This means:**
- content-service is trying to connect to database `redcube_content`
- The database doesn't exist in Railway's PostgreSQL
- Railway created the PostgreSQL instance, but not the specific database

---

## **What This Means:**

### **Railway's PostgreSQL Setup:**

Railway provides managed PostgreSQL, but:
- Railway creates the **PostgreSQL instance** (server)
- Railway does **NOT** automatically create databases
- You need to **create databases manually** or via migrations

**Railway provides:**
- PostgreSQL server (host, port, user, password)
- Connection string via `${{Postgres.PGHOST}}`, etc.
- But **not** the actual databases (`redcube_content`, `redcube_users`, etc.)

---

## **What Other Companies Do:**

### **Approach 1: Create Databases Manually (Quick Fix)**

**What they do:**
1. Connect to Railway PostgreSQL
2. Create databases manually using SQL
3. Run migrations to create tables

**How to do it:**
1. **Get Railway PostgreSQL connection:**
   - Go to Railway dashboard → PostgreSQL service
   - Copy connection details (host, port, user, password)

2. **Connect using psql or Railway's database UI:**
   ```sql
   CREATE DATABASE redcube_content;
   CREATE DATABASE redcube_users;
   CREATE DATABASE redcube_interviews;
   CREATE DATABASE redcube_notifications;
   ```

3. **Run migrations:**
   - Execute SQL scripts to create tables
   - Or use migration tools

**Pros:**
- Quick and simple
- Works immediately

**Cons:**
- Manual process
- Need to remember to do it
- Not automated

### **Approach 2: Automated Database Creation (Recommended)**

**What they do:**
1. **Create databases on service startup**
2. **Use migration scripts** to create tables
3. **Automate the process**

**How to do it:**

**Option A: Service Startup Script**
```javascript
// In service startup code
async function ensureDatabaseExists() {
  const adminPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default database
  });
  
  // Create database if it doesn't exist
  await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
  await adminPool.end();
}
```

**Option B: Migration Script**
```bash
# Run before service starts
psql $DATABASE_URL -c "CREATE DATABASE redcube_content;"
```

**Option C: Railway Init Script**
- Create a one-time script that runs on first deploy
- Creates all databases
- Runs migrations

**Pros:**
- Automated
- No manual steps
- Works on every deployment

**Cons:**
- More setup required
- Need to handle "database already exists" errors

### **Approach 3: Use Railway's Database UI**

**What they do:**
1. Use Railway's built-in database UI
2. Connect via Railway dashboard
3. Run SQL commands directly

**How to do it:**
1. Go to Railway dashboard → PostgreSQL service
2. Click "Connect" or "Query" button
3. Run SQL:
   ```sql
   CREATE DATABASE redcube_content;
   CREATE DATABASE redcube_users;
   CREATE DATABASE redcube_interviews;
   CREATE DATABASE redcube_notifications;
   ```

**Pros:**
- Easy to use
- No external tools needed
- Visual interface

**Cons:**
- Manual process
- Not automated

---

## **What You Should Do:**

### **Step 1: Create Databases Manually (Quick Fix)**

**Option A: Using Railway's Database UI (Easiest)**

1. **Go to Railway dashboard**
2. **Click on PostgreSQL service**
3. **Look for "Connect" or "Query" button**
4. **Run SQL:**
   ```sql
   CREATE DATABASE redcube_content;
   CREATE DATABASE redcube_users;
   CREATE DATABASE redcube_interviews;
   CREATE DATABASE redcube_notifications;
   ```

**Option B: Using psql Command Line**

1. **Get PostgreSQL connection string from Railway:**
   - Railway dashboard → PostgreSQL → Settings → Variables
   - Copy: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`

2. **Connect and create databases:**
   ```bash
   psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres
   # Then run:
   CREATE DATABASE redcube_content;
   CREATE DATABASE redcube_users;
   CREATE DATABASE redcube_interviews;
   CREATE DATABASE redcube_notifications;
   ```

### **Step 2: Run Database Migrations**

After creating databases, you need to:
1. **Create tables** (schema)
2. **Run migrations** (if you have them)
3. **Set up initial data** (if needed)

**Check if you have migration scripts:**
- Look for SQL files in your codebase
- Look for migration tools (like `knex`, `sequelize`, etc.)
- Check for `migrations/` folder

### **Step 3: Automate for Future (Optional)**

**Create a setup script:**
```javascript
// scripts/setup-databases.js
// Run this once to create all databases
```

**Or use Railway's init command:**
- Add a one-time setup script
- Runs on first deployment
- Creates databases and runs migrations

---

## **Common Issues:**

### **Issue 1: Database Name Mismatch**

**Problem:**
- Service expects `redcube_content`
- Database might be named differently
- Or database doesn't exist

**Solution:**
- Check `DB_NAME` environment variable
- Make sure it matches the database name
- Create database with correct name

### **Issue 2: Permissions**

**Problem:**
- User doesn't have permission to create databases
- Or can't connect to database

**Solution:**
- Use Railway's default PostgreSQL user (usually has permissions)
- Or grant permissions manually

### **Issue 3: Connection String**

**Problem:**
- Wrong connection string
- Wrong database name in connection

**Solution:**
- Check Railway environment variables
- Verify `DB_NAME` is correct
- Test connection

---

## **Recommended Solution:**

### **Step 1: Create Databases Now (Manual)**

1. **Go to Railway dashboard**
2. **Click on PostgreSQL service**
3. **Use Railway's database UI or connect via psql**
4. **Run:**
   ```sql
   CREATE DATABASE redcube_content;
   CREATE DATABASE redcube_users;
   CREATE DATABASE redcube_interviews;
   CREATE DATABASE redcube_notifications;
   ```

### **Step 2: Check for Migration Scripts**

1. **Look for SQL files or migration scripts**
2. **Run them to create tables**
3. **Or create tables manually if needed**

### **Step 3: Redeploy content-service**

1. **After databases are created**
2. **Redeploy content-service**
3. **Should connect successfully**

---

## **Summary:**

**The Problem:**
- Railway PostgreSQL instance exists
- But databases (`redcube_content`, etc.) don't exist
- Need to create them manually or via script

**The Solution:**
1. Create databases manually using Railway's database UI or psql
2. Run migrations to create tables (if you have them)
3. Redeploy services

**What to Check:**
1. Railway dashboard → PostgreSQL → Can you connect?
2. Do you have migration scripts?
3. Are tables created after creating databases?

Let me know if you need help creating the databases or running migrations!
