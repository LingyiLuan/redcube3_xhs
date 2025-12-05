# 🔧 Update Railway Environment Variables

## **Your New pgvector Database Connection Details**

```
PGHOST=gondola.proxy.rlwy.net
PGPORT=25309
PGUSER=postgres
PGPASSWORD=zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i
```

---

## **Step 1: Update Each Service's Database Connection**

For each service (`user-service`, `content-service`, `interview-service`):

### **1.1 Go to Service in Railway Dashboard**

1. Railway dashboard → Click on service (e.g., `content-service`)
2. Go to **"Variables"** tab

### **1.2 Update Database Variables**

Find and update these variables:

**Old values (pointing to old PostgreSQL):**
- `DB_HOST` = `<old-host>`
- `DB_PORT` = `<old-port>`
- `DB_USER` = `<old-user>`
- `DB_PASSWORD` = `<old-password>`

**New values (pointing to pgvector PostgreSQL):**
- `DB_HOST` = `gondola.proxy.rlwy.net`
- `DB_PORT` = `25309`
- `DB_USER` = `postgres`
- `DB_PASSWORD` = `zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i`

### **1.3 Update POSTGRES_* Variables (if they exist)**

Also update these (used by some services):

- `POSTGRES_HOST` = `gondola.proxy.rlwy.net`
- `POSTGRES_PORT` = `25309`
- `POSTGRES_USER` = `postgres`
- `POSTGRES_PASSWORD` = `zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i`

### **1.4 Save Changes**

Railway usually auto-saves, but make sure changes are saved.

---

## **Step 2: Update All 4 Services**

Repeat Step 1 for:
- ✅ `user-service`
- ✅ `content-service`
- ✅ `interview-service`
- ✅ `notification-service` (if it uses PostgreSQL)

---

## **Step 3: Redeploy Services**

For each service:

1. Railway dashboard → Service → **"Deployments"** tab
2. Click **"Redeploy"** button
3. Wait for deployment (2-5 minutes)
4. Check logs for errors

**Services to redeploy:**
- ✅ `user-service`
- ✅ `content-service`
- ✅ `interview-service`
- ✅ `notification-service`

---

## **Step 4: Verify Deployment**

Check deployment logs for each service - you should see:
- ✅ "Connected to PostgreSQL database"
- ✅ No "relation does not exist" errors
- ✅ No "extension vector is not available" errors
- ✅ Service starting normally

---

## **Step 5: Test Vector Functionality**

Connect and test:

```bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
export PGHOST=gondola.proxy.rlwy.net
export PGPORT=25309
export PGUSER=postgres
export PGPASSWORD='zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i'

psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_content
```

Then:

```sql
-- Test vector type
SELECT '[1,2,3]'::vector;

-- Test cosine distance
SELECT '[1,2,3]'::vector <=> '[4,5,6]'::vector as distance;

-- Check if you have posts with embeddings
SELECT COUNT(*) FROM scraped_posts WHERE embedding IS NOT NULL;
```

All should work! 🎉

---

## **Summary**

1. ✅ Update `DB_*` variables in all services → point to new pgvector database
2. ✅ Update `POSTGRES_*` variables (if they exist)
3. ✅ Redeploy all services
4. ✅ Verify deployment logs
5. ✅ Test vector functionality

**After this, your RAG functionality will work with vector similarity search!**
