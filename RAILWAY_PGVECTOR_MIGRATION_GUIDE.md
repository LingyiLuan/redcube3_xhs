# 🚀 Railway pgvector Migration Guide

## **Overview**

This guide will help you migrate from Railway's standard PostgreSQL to Railway's pgvector-enabled PostgreSQL template, enabling vector similarity search for your RAG functionality.

---

## **Prerequisites**

- ✅ Railway account with existing PostgreSQL database
- ✅ Railway CLI installed (`railway --version`)
- ✅ `psql` client installed
- ✅ Access to your current PostgreSQL connection details

---

## **Step 1: Deploy Railway's pgvector PostgreSQL Template**

### **1.1 Deploy the Template**

1. Go to Railway's pgvector deployment page:
   - **URL:** https://railway.com/deploy/pgvector
   - Or search "pgvector" in Railway's template library

2. Click **"Deploy Now"** or **"New Project"**

3. Railway will create a new PostgreSQL service with pgvector pre-installed

4. **Note the new service name** (e.g., `pgvector-production-xxxx`)

### **1.2 Get Connection Details**

1. In Railway dashboard, click on the new PostgreSQL service
2. Go to **"Variables"** tab
3. Copy these values (you'll need them later):
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE` (usually `railway`)

---

## **Step 2: Enable pgvector Extension**

### **2.1 Connect to New Database**

**Option A: Using Railway CLI**

```bash
# Connect to the new pgvector database
railway connect postgres --service <your-pgvector-service-name>
```

**Option B: Using psql directly**

```bash
# Set environment variables
export PGHOST=<your-pghost>
export PGPORT=<your-pgport>
export PGUSER=<your-pguser>
export PGPASSWORD=<your-pgpassword>

# Connect
psql -h $PGHOST -p $PGPORT -U $PGUSER -d railway
```

### **2.2 Enable Extension**

Once connected, run:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify it's enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
```

You should see the `vector` extension listed.

---

## **Step 3: Create Databases**

### **3.1 Create All Required Databases**

In the pgvector PostgreSQL (where you're connected), run:

```sql
-- Create all databases
CREATE DATABASE redcube_content;
CREATE DATABASE redcube_users;
CREATE DATABASE redcube_interviews;
CREATE DATABASE redcube_notifications;

-- Verify
SELECT datname FROM pg_database WHERE datname LIKE 'redcube%' ORDER BY datname;
```

You should see all 4 databases.

---

## **Step 4: Export Data from Old PostgreSQL**

### **4.1 Get Old PostgreSQL Connection Details**

1. In Railway dashboard, go to your **old PostgreSQL service**
2. Copy connection details:
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`

### **4.2 Export Each Database**

**Export redcube_content:**

```bash
# Set old database connection
export OLD_PGHOST=<old-pghost>
export OLD_PGPORT=<old-pgport>
export OLD_PGUSER=<old-pguser>
export OLD_PGPASSWORD=<old-pgpassword>

# Export schema only (no data yet - we'll do data migration separately)
pg_dump -h $OLD_PGHOST -p $OLD_PGPORT -U $OLD_PGUSER -d redcube_content \
  --schema-only --no-owner --no-privileges \
  > redcube_content_schema.sql

# Export data only
pg_dump -h $OLD_PGHOST -p $OLD_PGPORT -U $OLD_PGUSER -d redcube_content \
  --data-only --no-owner --no-privileges \
  > redcube_content_data.sql
```

**Export other databases:**

```bash
# redcube_users
pg_dump -h $OLD_PGHOST -p $OLD_PGPORT -U $OLD_PGUSER -d redcube_users \
  --schema-only --no-owner --no-privileges \
  > redcube_users_schema.sql

pg_dump -h $OLD_PGHOST -p $OLD_PGPORT -U $OLD_PGUSER -d redcube_users \
  --data-only --no-owner --no-privileges \
  > redcube_users_data.sql

# redcube_interviews
pg_dump -h $OLD_PGHOST -p $OLD_PGPORT -U $OLD_PGUSER -d redcube_interviews \
  --schema-only --no-owner --no-privileges \
  > redcube_interviews_schema.sql

pg_dump -h $OLD_PGHOST -p $OLD_PGPORT -U $OLD_PGUSER -d redcube_interviews \
  --data-only --no-owner --no-privileges \
  > redcube_interviews_data.sql

# redcube_notifications
pg_dump -h $OLD_PGHOST -p $OLD_PGPORT -U $OLD_PGUSER -d redcube_notifications \
  --schema-only --no-owner --no-privileges \
  > redcube_notifications_schema.sql

pg_dump -h $OLD_PGHOST -p $OLD_PGPORT -U $OLD_PGUSER -d redcube_notifications \
  --data-only --no-owner --no-privileges \
  > redcube_notifications_data.sql
```

---

## **Step 5: Import Schema to New pgvector Database**

### **5.1 Set New Database Connection**

```bash
# Set new database connection
export NEW_PGHOST=<new-pghost>
export NEW_PGPORT=<new-pgport>
export NEW_PGUSER=<new-pguser>
export NEW_PGPASSWORD=<new-pgpassword>
```

### **5.2 Import Schema (Before Data)**

**Import redcube_content schema:**

```bash
# Connect and import schema
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

### **5.3 Fix Schema Issues (if needed)**

The old schema might not have `vector` columns. After importing, you may need to:

1. **Add vector columns to existing tables:**

```sql
-- Connect to redcube_content
\c redcube_content

-- Add vector column to scraped_posts (if not exists)
ALTER TABLE scraped_posts
  ADD COLUMN IF NOT EXISTS embedding vector(1536),
  ADD COLUMN IF NOT EXISTS title_embedding vector(1536);

-- Add vector column to interview_questions (if not exists)
ALTER TABLE interview_questions
  ADD COLUMN IF NOT EXISTS embedding vector(1536);
```

2. **Run missing migrations:**

```bash
# Run all migrations again (they'll skip existing tables/columns)
cd ~/Desktop/redcube3_xhs
./run_all_migrations.sh
```

---

## **Step 6: Import Data to New Database**

### **6.1 Import Data**

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

**Note:** If you get errors about `vector` type during data import, that's OK - the old data doesn't have embeddings yet. You can regenerate embeddings later.

---

## **Step 7: Update Railway Environment Variables**

### **7.1 Update Each Service's Database Connection**

For each service (`user-service`, `content-service`, `interview-service`, `notification-service`):

1. Go to Railway dashboard → Your service → **Variables** tab
2. Update these variables:

```bash
# Old values (pointing to old PostgreSQL)
DB_HOST=<old-pghost>
DB_PORT=<old-pgport>
DB_USER=<old-pguser>
DB_PASSWORD=<old-pgpassword>

# New values (pointing to pgvector PostgreSQL)
DB_HOST=<new-pghost>
DB_PORT=<new-pgport>
DB_USER=<new-pguser>
DB_PASSWORD=<new-pgpassword>
```

3. **Also update `POSTGRES_*` variables** (used by some services):

```bash
POSTGRES_HOST=<new-pghost>
POSTGRES_PORT=<new-pgport>
POSTGRES_USER=<new-pguser>
POSTGRES_PASSWORD=<new-pgpassword>
```

### **7.2 Update ENV Files (Optional)**

If you're using ENV files, update:
- `railway-user-service.env`
- `railway-content-service.env`
- `railway-interview-service.env`
- `railway-notification-service.env`

---

## **Step 8: Redeploy Services**

### **8.1 Redeploy All Services**

1. In Railway dashboard, go to each service
2. Click **"Deploy"** or **"Redeploy"**
3. Wait for deployment to complete

**Services to redeploy:**
- `user-service`
- `content-service`
- `interview-service`
- `notification-service`

### **8.2 Verify Deployment**

Check deployment logs for each service - you should see:
- ✅ Database connection successful
- ✅ No "relation does not exist" errors
- ✅ Services starting normally

---

## **Step 9: Test Vector Functionality**

### **9.1 Test pgvector Extension**

Connect to new database and test:

```sql
\c redcube_content

-- Test vector type
SELECT '[1,2,3]'::vector;

-- Test cosine distance operator
SELECT '[1,2,3]'::vector <=> '[4,5,6]'::vector as distance;
```

### **9.2 Test Embedding Storage**

```sql
-- Check if scraped_posts has vector column
\d scraped_posts

-- You should see:
-- embedding | vector(1536) | ...
```

### **9.3 Test Similarity Search**

Your existing code should now work:

```sql
-- This query should work now (if you have embeddings)
SELECT 
  post_id,
  title,
  1 - (embedding <=> $1::vector) as similarity
FROM scraped_posts
WHERE embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

---

## **Step 10: Regenerate Embeddings (If Needed)**

If your old data didn't have embeddings, regenerate them:

### **10.1 Trigger Embedding Generation**

Your `content-service` should automatically generate embeddings for posts with `embedding_status = 'pending'`.

Check logs:

```bash
# In Railway dashboard → content-service → Logs
# Look for: "Triggering automated embedding generation"
```

### **10.2 Manual Embedding Generation (Optional)**

If needed, you can trigger manually via API or by updating the scheduler.

---

## **Step 11: Clean Up Old PostgreSQL (Optional)**

**⚠️ IMPORTANT: Only do this after verifying everything works!**

1. **Wait 24-48 hours** to ensure everything is stable
2. **Verify all services are working** with new database
3. **Take a final backup** of old database (just in case)
4. **Delete old PostgreSQL service** in Railway dashboard

---

## **Troubleshooting**

### **Issue: "extension vector does not exist"**

**Solution:** Make sure you deployed Railway's pgvector template, not standard PostgreSQL.

### **Issue: "type vector does not exist"**

**Solution:** Run `CREATE EXTENSION IF NOT EXISTS vector;` in your database.

### **Issue: Data import fails with vector errors**

**Solution:** This is normal if old data doesn't have embeddings. Import schema first, then data. Missing embeddings will be regenerated.

### **Issue: Services can't connect to new database**

**Solution:** 
1. Check connection strings in Railway variables
2. Verify database exists: `SELECT datname FROM pg_database;`
3. Check network connectivity (Railway services should auto-connect)

### **Issue: Missing tables after migration**

**Solution:** Run migrations again:
```bash
cd ~/Desktop/redcube3_xhs
./run_all_migrations.sh
```

---

## **Verification Checklist**

- [ ] pgvector extension enabled: `SELECT * FROM pg_extension WHERE extname = 'vector';`
- [ ] All 4 databases created: `SELECT datname FROM pg_database WHERE datname LIKE 'redcube%';`
- [ ] Tables exist: `\dt` in each database
- [ ] Vector columns exist: `\d scraped_posts` shows `embedding vector(1536)`
- [ ] Services can connect: Check deployment logs
- [ ] RAG search works: Test similarity search queries
- [ ] Embeddings generating: Check `embedding_status` in `scraped_posts`

---

## **Summary**

1. ✅ Deploy Railway's pgvector template
2. ✅ Enable `vector` extension
3. ✅ Create databases
4. ✅ Export data from old PostgreSQL
5. ✅ Import schema to new PostgreSQL
6. ✅ Import data to new PostgreSQL
7. ✅ Update Railway environment variables
8. ✅ Redeploy all services
9. ✅ Test vector functionality
10. ✅ Regenerate embeddings if needed

**After migration, your RAG functionality will work with vector similarity search!** 🎉

---

## **Need Help?**

If you encounter issues:
1. Check Railway deployment logs
2. Verify connection strings
3. Test database connectivity
4. Check extension is enabled: `SELECT * FROM pg_extension;`
