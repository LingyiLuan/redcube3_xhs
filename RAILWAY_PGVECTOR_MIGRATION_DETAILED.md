# 🚀 Railway pgvector Migration Guide - DETAILED (Beginner-Friendly)

## **Important: Where to Export Data From**

**✅ Export from your LOCAL database** (which has ~9000 posts)  
**❌ NOT from Railway database** (which is empty)

Your local Docker PostgreSQL has all your data. Railway's PostgreSQL is empty (we just created the databases).

---

## **Step 1: Deploy Railway's pgvector PostgreSQL Template**

### **1.1 What You're Seeing**

You mentioned you see:
- A "pgvector" node on Railway canvas
- A "Deploy Template" button in the dashboard

This is Railway's pgvector PostgreSQL template - it's a pre-configured PostgreSQL with pgvector extension already installed.

### **1.2 Deploy the Template**

**Option A: If you see "Deploy Template" button:**

1. In Railway dashboard, you should see a service/node called "pgvector" or similar
2. Click on it
3. Click **"Deploy Template"** or **"Deploy"** button
4. Wait for deployment to complete (usually 1-2 minutes)
5. You'll see a green checkmark when it's ready

**Option B: If you don't see it, deploy from template library:**

1. In Railway dashboard, click **"New"** button (top right)
2. Select **"Deploy Template"** or **"Template"**
3. Search for **"pgvector"**
4. Click on **"PostgreSQL + pgvector"** template
5. Click **"Deploy"** or **"Deploy Now"**
6. Wait for deployment

### **1.3 Verify Deployment**

After deployment:
1. You should see a new service in your Railway project
2. It might be named:
   - `pgvector`
   - `PostgreSQL`
   - `postgres-pgvector`
   - Or similar

3. Click on it to see details
4. Status should show **"Active"** or **"Running"**

---

## **Step 2: Get Connection Details from Railway**

### **2.1 Find Connection Details**

1. Click on your **new pgvector PostgreSQL service** in Railway dashboard
2. Go to **"Variables"** tab (or **"Settings"** → **"Variables"**)
3. You'll see these variables (copy them somewhere safe):

```
PGHOST=xxxxx.railway.internal (or xxxxx.up.railway.app)
PGPORT=5432
PGUSER=postgres
PGPASSWORD=xxxxx (long random string)
PGDATABASE=railway (or postgres)
```

**Important:** Copy these values - you'll need them later!

### **2.2 Alternative: Get Connection String**

Some Railway dashboards show a **"Connection String"** or **"Postgres URL"**:
- Format: `postgresql://postgres:password@host:port/railway`
- Copy this if available

---

## **Step 3: Connect to Railway pgvector Database**

### **3.1 Using Railway CLI (Recommended)**

**First, make sure you're in the right project:**

```bash
# Check current project
railway status

# If wrong project, link to correct one
railway link
# Select your project from the list
```

**Connect to pgvector database:**

```bash
# Connect to the pgvector PostgreSQL service
railway connect postgres
```

You should see:
```
psql (16.11, server 17.7)
Type "help" for help.
railway=#
```

### **3.2 Using psql Directly (Alternative)**

If Railway CLI doesn't work, use psql:

```bash
# Set environment variables (use values from Step 2.1)
export PGHOST=<your-pghost-from-railway>
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=<your-pgpassword-from-railway>

# Connect
psql -h $PGHOST -p $PGPORT -U $PGUSER -d railway
```

---

## **Step 4: Enable pgvector Extension**

### **4.1 Enable Extension**

In the psql prompt (where you see `railway=#`), type:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

You should see:
```
CREATE EXTENSION
```

### **4.2 Verify Extension**

```sql
-- Check if extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
```

You should see a row with `extname = 'vector'`.

---

## **Step 5: Create Databases in Railway pgvector**

### **5.1 Create All Databases**

Still in psql (where you see `railway=#`), type:

```sql
-- Create all 4 databases
CREATE DATABASE redcube_content;
CREATE DATABASE redcube_users;
CREATE DATABASE redcube_interviews;
CREATE DATABASE redcube_notifications;
```

You should see:
```
CREATE DATABASE
CREATE DATABASE
CREATE DATABASE
CREATE DATABASE
```

### **5.2 Verify Databases**

```sql
-- Check databases were created
SELECT datname FROM pg_database WHERE datname LIKE 'redcube%' ORDER BY datname;
```

You should see:
```
      datname
-------------------
 redcube_content
 redcube_interviews
 redcube_notifications
 redcube_users
(4 rows)
```

### **5.3 Exit psql**

```sql
\q
```

You're back to your terminal.

---

## **Step 6: Export Data from LOCAL Database**

### **6.1 Important: Export from LOCAL, Not Railway**

**Your local Docker PostgreSQL has all your data (~9000 posts).**  
**Railway database is empty (we just created it).**

### **6.2 Check Local Database is Running**

```bash
# Check if Docker is running
docker ps

# You should see a container named something like:
# redcube_postgres
# Or check docker-compose
docker-compose ps
```

If Docker isn't running:
```bash
# Start Docker Desktop
# Then start containers
docker-compose up -d postgres
```

### **6.3 Get Local Database Connection Details**

Your local PostgreSQL (from docker-compose.yml):
- **Host:** `localhost` (or `127.0.0.1`)
- **Port:** `5432`
- **User:** `postgres`
- **Password:** `postgres` (check your docker-compose.yml)
- **Databases:** `redcube_content`, `redcube_users`, `redcube_interviews`, `redcube_notifications`

### **6.4 Export Using Helper Script**

**Option A: Use the helper script (easiest):**

```bash
cd ~/Desktop/redcube3_xhs
./migrate_to_pgvector.sh
```

When prompted:
- **PGHOST:** `localhost`
- **PGPORT:** `5432`
- **PGUSER:** `postgres`
- **PGPASSWORD:** `postgres` (or whatever is in your docker-compose.yml)

The script will create 8 files:
- `redcube_content_schema.sql`
- `redcube_content_data.sql`
- `redcube_users_schema.sql`
- `redcube_users_data.sql`
- `redcube_interviews_schema.sql`
- `redcube_interviews_data.sql`
- `redcube_notifications_schema.sql`
- `redcube_notifications_data.sql`

**Option B: Export manually:**

```bash
# Set local database connection
export LOCAL_PGHOST=localhost
export LOCAL_PGPORT=5432
export LOCAL_PGUSER=postgres
export LOCAL_PGPASSWORD=postgres

# Export redcube_content
pg_dump -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d redcube_content \
  --schema-only --no-owner --no-privileges \
  > redcube_content_schema.sql

pg_dump -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d redcube_content \
  --data-only --no-owner --no-privileges \
  > redcube_content_data.sql

# Repeat for other databases...
```

---

## **Step 7: Import Schema to Railway pgvector Database**

### **7.1 Get Railway Connection Details**

From Step 2.1, you should have:
- `NEW_PGHOST` (from Railway Variables)
- `NEW_PGPORT` (usually 5432)
- `NEW_PGUSER` (usually postgres)
- `NEW_PGPASSWORD` (from Railway Variables)

### **7.2 Set Environment Variables**

```bash
# Set Railway database connection
export NEW_PGHOST=<your-railway-pghost>
export NEW_PGPORT=5432
export NEW_PGUSER=postgres
export NEW_PGPASSWORD=<your-railway-pgpassword>
```

### **7.3 Import Schema**

**Import redcube_content schema:**

```bash
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_content \
  -f redcube_content_schema.sql
```

**Import other databases:**

```bash
# redcube_users
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_users \
  -f redcube_users_schema.sql

# redcube_interviews
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_interviews \
  -f redcube_interviews_schema.sql

# redcube_notifications
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_notifications \
  -f redcube_notifications_schema.sql
```

### **7.4 Fix Vector Columns (Important!)**

The old schema might not have `vector` columns. After importing schema, connect and add them:

```bash
# Connect to Railway pgvector
railway connect postgres
```

Then:

```sql
-- Switch to redcube_content
\c redcube_content

-- Add vector columns (if not exists)
ALTER TABLE scraped_posts
  ADD COLUMN IF NOT EXISTS embedding vector(1536),
  ADD COLUMN IF NOT EXISTS title_embedding vector(1536);

ALTER TABLE interview_questions
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Verify
\d scraped_posts
-- You should see: embedding | vector(1536) | ...
```

---

## **Step 8: Import Data to Railway pgvector Database**

### **8.1 Import Data**

**Import redcube_content data:**

```bash
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_content \
  -f redcube_content_data.sql
```

**Import other databases:**

```bash
# redcube_users
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_users \
  -f redcube_users_data.sql

# redcube_interviews
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_interviews \
  -f redcube_interviews_data.sql

# redcube_notifications
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_notifications \
  -f redcube_notifications_data.sql
```

**Note:** If you see errors about `vector` type during data import, that's OK - your old data doesn't have embeddings yet. They'll be regenerated later.

---

## **Step 9: Update Railway Environment Variables**

### **9.1 Find Your Services in Railway**

In Railway dashboard, you should see these services:
- `user-service`
- `content-service`
- `interview-service`
- `notification-service`

### **9.2 Update Each Service's Database Connection**

**For each service:**

1. Click on the service (e.g., `content-service`)
2. Go to **"Variables"** tab
3. Find these variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`

4. **Update them to point to NEW pgvector database:**
   - `DB_HOST` = `<your-railway-pghost>` (from Step 2.1)
   - `DB_PORT` = `5432`
   - `DB_USER` = `postgres`
   - `DB_PASSWORD` = `<your-railway-pgpassword>` (from Step 2.1)

5. **Also update `POSTGRES_*` variables** (if they exist):
   - `POSTGRES_HOST` = `<your-railway-pghost>`
   - `POSTGRES_PORT` = `5432`
   - `POSTGRES_USER` = `postgres`
   - `POSTGRES_PASSWORD` = `<your-railway-pgpassword>`

6. **Save changes** (Railway usually auto-saves)

### **9.3 Update All 4 Services**

Repeat Step 9.2 for:
- ✅ `user-service`
- ✅ `content-service`
- ✅ `interview-service`
- ✅ `notification-service`

---

## **Step 10: Redeploy Services**

### **10.1 Redeploy Each Service**

**For each service:**

1. Click on the service in Railway dashboard
2. Go to **"Deployments"** tab (or main page)
3. Click **"Redeploy"** or **"Deploy"** button
4. Wait for deployment to complete (usually 2-5 minutes)
5. Check deployment logs for errors

**Services to redeploy:**
- ✅ `user-service`
- ✅ `content-service`
- ✅ `interview-service`
- ✅ `notification-service`

### **10.2 Verify Deployment**

**Check deployment logs for each service:**

1. Click on service → **"Deployments"** tab
2. Click on latest deployment
3. Check logs - you should see:
   - ✅ "Connected to PostgreSQL database"
   - ✅ No "relation does not exist" errors
   - ✅ Service starting normally

---

## **Step 11: Test Vector Functionality**

### **11.1 Test pgvector Extension**

Connect to Railway pgvector:

```bash
railway connect postgres
```

Then:

```sql
-- Switch to redcube_content
\c redcube_content

-- Test vector type
SELECT '[1,2,3]'::vector;

-- Test cosine distance operator
SELECT '[1,2,3]'::vector <=> '[4,5,6]'::vector as distance;
```

Both should work without errors.

### **11.2 Test Embedding Storage**

```sql
-- Check if scraped_posts has vector column
\d scraped_posts
```

You should see:
```
embedding | vector(1536) | ...
```

### **11.3 Test Similarity Search**

```sql
-- This query should work (if you have embeddings)
SELECT 
  post_id,
  title,
  1 - (embedding <=> '[0.1,0.2,0.3,...]'::vector) as similarity
FROM scraped_posts
WHERE embedding IS NOT NULL
ORDER BY embedding <=> '[0.1,0.2,0.3,...]'::vector
LIMIT 10;
```

---

## **Step 12: Regenerate Embeddings (If Needed)**

### **12.1 Check Embedding Status**

```sql
-- Check how many posts need embeddings
SELECT 
  embedding_status,
  COUNT(*) 
FROM scraped_posts 
GROUP BY embedding_status;
```

### **12.2 Trigger Embedding Generation**

Your `content-service` should automatically generate embeddings. Check logs:

1. Go to Railway dashboard → `content-service` → **"Logs"** tab
2. Look for: `"Triggering automated embedding generation"`
3. Or: `"Embedding job queued successfully"`

### **12.3 Wait for Embeddings**

Embedding generation takes time. For 9000 posts, it might take several hours.

---

## **Summary Checklist**

- [ ] Deployed Railway's pgvector template
- [ ] Got connection details from Railway Variables
- [ ] Connected to Railway pgvector database
- [ ] Enabled `vector` extension
- [ ] Created all 4 databases
- [ ] Exported data from LOCAL database (not Railway)
- [ ] Imported schema to Railway pgvector
- [ ] Added vector columns to tables
- [ ] Imported data to Railway pgvector
- [ ] Updated all 4 services' environment variables
- [ ] Redeployed all 4 services
- [ ] Tested vector functionality
- [ ] Verified embeddings are generating

---

## **Common Questions**

**Q: Which database do I export from?**  
A: Your LOCAL Docker PostgreSQL (which has ~9000 posts). Railway database is empty.

**Q: What if I see "Deploy Template" button?**  
A: Click it! That's the pgvector template.

**Q: Where do I find connection details?**  
A: Railway dashboard → pgvector service → Variables tab

**Q: What if data import fails?**  
A: That's OK if it's about vector type - old data doesn't have embeddings. They'll be regenerated.

**Q: How do I know it's working?**  
A: Test vector queries (Step 11) and check service logs for no errors.

---

## **Need Help?**

If stuck:
1. Check Railway deployment logs
2. Verify connection strings
3. Test database connectivity
4. Check extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'vector';`
