# 🚀 Import Data to Railway pgvector - Step by Step

## ✅ Step 1: Get Railway Connection Details

1. In Railway dashboard, click on your **pgvector service** (the one that says "Active")
2. Go to **"Variables"** tab (or **"Settings"** → **"Variables"**)
3. You'll see these variables - **COPY THEM DOWN**:

```
PGHOST=xxxxx.railway.internal (or xxxxx.up.railway.app)
PGPORT=5432
PGUSER=postgres
PGPASSWORD=xxxxx (long random string)
```

**Important:** Copy these values somewhere safe - you'll need them!

---

## ✅ Step 2: Connect to Railway pgvector

**Option A: Using Railway CLI (Easiest)**

```bash
# Make sure you're in the right project
railway status

# If wrong project, link to correct one
railway link
# Select your project from the list

# Connect to pgvector database
railway connect postgres
```

You should see:
```
psql (16.11, server 17.7)
Type "help" for help.
railway=#
```

**Option B: Using psql directly**

```bash
# Set environment variables (use values from Step 1)
export PGHOST=<your-pghost-from-railway>
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=<your-pgpassword-from-railway>

# Connect
psql -h $PGHOST -p $PGPORT -U $PGUSER -d railway
```

---

## ✅ Step 3: Enable pgvector Extension

In the psql prompt (where you see `railway=#`), type:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify it's enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
```

You should see a row with `extname = 'vector'`.

---

## ✅ Step 4: Create Databases

Still in psql (where you see `railway=#`), type:

```sql
-- Create all 3 databases (we exported 3)
CREATE DATABASE redcube_content;
CREATE DATABASE redcube_users;
CREATE DATABASE redcube_interviews;

-- Verify
SELECT datname FROM pg_database WHERE datname LIKE 'redcube%' ORDER BY datname;
```

You should see all 3 databases.

---

## ✅ Step 5: Exit psql

```sql
\q
```

You're back to your terminal.

---

## ✅ Step 6: Import Schema Files

**Set Railway connection variables:**

```bash
# Use the values from Step 1
export NEW_PGHOST=<your-railway-pghost>
export NEW_PGPORT=5432
export NEW_PGUSER=postgres
export NEW_PGPASSWORD=<your-railway-pgpassword>
```

**Import schemas:**

```bash
cd ~/Desktop/redcube3_xhs

# Import redcube_content schema
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_content \
  -f redcube_content_schema.sql

# Import redcube_users schema
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_users \
  -f redcube_users_schema.sql

# Import redcube_interviews schema
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_interviews \
  -f redcube_interviews_schema.sql
```

---

## ✅ Step 7: Add Vector Columns (Important!)

The old schema might not have `vector` columns. Connect and add them:

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

## ✅ Step 8: Import Data Files

**Exit psql first:**

```sql
\q
```

**Then import data:**

```bash
# Import redcube_content data (112MB - this will take a few minutes)
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_content \
  -f redcube_content_data.sql

# Import redcube_users data
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_users \
  -f redcube_users_data.sql

# Import redcube_interviews data
psql -h $NEW_PGHOST -p $NEW_PGPORT -U $NEW_PGUSER -d redcube_interviews \
  -f redcube_interviews_data.sql
```

**Note:** The `redcube_content_data.sql` import (112MB) will take several minutes. Be patient!

---

## ✅ Step 9: Verify Data Imported

Connect and check:

```bash
railway connect postgres
```

Then:

```sql
-- Check redcube_content
\c redcube_content
SELECT COUNT(*) FROM scraped_posts;
-- Should show: 9058

-- Check redcube_users
\c redcube_users
SELECT COUNT(*) FROM users;
-- Should show: 10

-- Check redcube_interviews
\c redcube_interviews
SELECT COUNT(*) FROM interviews;
-- Should show: 0 or small number
```

---

## ✅ Step 10: Update Railway Environment Variables

For each service (`user-service`, `content-service`, `interview-service`):

1. Railway dashboard → Click on service
2. Go to **"Variables"** tab
3. Update these variables to point to NEW pgvector database:
   - `DB_HOST` = `<your-railway-pghost>` (from Step 1)
   - `DB_PORT` = `5432`
   - `DB_USER` = `postgres`
   - `DB_PASSWORD` = `<your-railway-pgpassword>` (from Step 1)

4. Also update `POSTGRES_*` variables (if they exist):
   - `POSTGRES_HOST` = `<your-railway-pghost>`
   - `POSTGRES_PORT` = `5432`
   - `POSTGRES_USER` = `postgres`
   - `POSTGRES_PASSWORD` = `<your-railway-pgpassword>`

5. Save changes

---

## ✅ Step 11: Redeploy Services

For each service:
1. Railway dashboard → Service → **"Deployments"** tab
2. Click **"Redeploy"** button
3. Wait for deployment (2-5 minutes)
4. Check logs for errors

---

## ✅ Step 12: Test Vector Functionality

Connect and test:

```bash
railway connect postgres
```

```sql
\c redcube_content

-- Test vector type
SELECT '[1,2,3]'::vector;

-- Test cosine distance
SELECT '[1,2,3]'::vector <=> '[4,5,6]'::vector as distance;

-- Check if scraped_posts has vector column
\d scraped_posts
```

All should work without errors!

---

## 🎉 Done!

Your data is now in Railway's pgvector PostgreSQL with vector similarity search enabled!
