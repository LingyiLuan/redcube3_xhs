# 🔧 Fix: pgvector Extension Not Available

## **Problem**

You're getting:
```
ERROR: extension "vector" is not available
```

This means you deployed **standard PostgreSQL** instead of **PostgreSQL with pgvector**.

---

## **Solution: Deploy Correct pgvector Template**

### **Option 1: Deploy Railway's pgvector Template (Recommended)**

1. **In Railway dashboard:**
   - Go to your project
   - Click **"New"** button (top right)
   - Select **"Deploy Template"** or **"Template"**

2. **Search for pgvector:**
   - Search: `pgvector`
   - Look for: **"PostgreSQL + pgvector"** or **"pgvector"**
   - Click on it

3. **Deploy:**
   - Click **"Deploy"** or **"Deploy Now"**
   - Wait for deployment (1-2 minutes)

4. **Verify:**
   - The new service should be named something like:
     - `pgvector`
     - `PostgreSQL + pgvector`
     - `postgres-pgvector`

5. **Delete old PostgreSQL:**
   - Once new pgvector service is active
   - Delete the old standard PostgreSQL service
   - (Or keep both temporarily for migration)

---

### **Option 2: Use Railway's pgvector Template URL**

1. **Go directly to:**
   - https://railway.com/deploy/pgvector
   - Or: https://railway.com/template/pgvector

2. **Click "Deploy Now"**

3. **Select your project** when prompted

4. **Wait for deployment**

---

### **Option 3: Check Current Service**

**If you already have a PostgreSQL service:**

1. **Check service name:**
   - Is it called just "PostgreSQL" or "Postgres"?
   - If yes, that's the standard one (no pgvector)

2. **Check service details:**
   - Click on the service
   - Look for description or template name
   - Should mention "pgvector" if correct

3. **If wrong template:**
   - Deploy new pgvector template (Option 1 or 2)
   - Get connection details from NEW service
   - Delete old service after migration

---

## **After Deploying Correct Template**

1. **Get NEW connection details:**
   - Railway dashboard → pgvector service → Variables tab
   - Copy: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`

2. **Connect to NEW database:**
   ```bash
   export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
   railway connect postgres
   ```

3. **Test pgvector:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
   
   Should work without errors!

---

## **How to Tell Which Template You Have**

**Standard PostgreSQL (no pgvector):**
- Service name: "PostgreSQL" or "Postgres"
- Template: "PostgreSQL" (no mention of pgvector)
- Error: "extension vector is not available"

**pgvector PostgreSQL (correct):**
- Service name: "pgvector" or "PostgreSQL + pgvector"
- Template: "PostgreSQL + pgvector" or "pgvector"
- Works: `CREATE EXTENSION vector;` succeeds

---

## **Next Steps**

1. Deploy correct pgvector template (Option 1 or 2 above)
2. Get connection details from NEW service
3. Continue with import steps from `IMPORT_TO_RAILWAY_STEPS.md`

**The key is: you need Railway's pgvector template, not standard PostgreSQL!**
