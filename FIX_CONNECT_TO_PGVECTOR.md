# 🔧 Fix: Connect to Correct pgvector Service

## **Problem**

You deployed pgvector template and it's active, but `CREATE EXTENSION vector;` fails.

**This means you're connecting to the WRONG PostgreSQL service** (the old standard one, not the new pgvector one).

---

## **Solution: Connect to Correct Service**

### **Step 1: Identify Service Names**

In Railway dashboard, you should see **TWO PostgreSQL services**:
1. **Old one:** "PostgreSQL" or "Postgres" (standard, no pgvector)
2. **New one:** "pgvector" or "PostgreSQL + pgvector" (has pgvector)

**Note the exact name of the pgvector service.**

---

### **Step 2: Connect to Correct Service**

**Option A: Using Railway CLI with service name**

```bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Connect to specific pgvector service
railway connect postgres --service <pgvector-service-name>
```

Replace `<pgvector-service-name>` with the actual name from Railway dashboard.

**Example:**
```bash
railway connect postgres --service pgvector
# or
railway connect postgres --service postgres-pgvector
```

**Option B: Get connection details directly (Most Reliable)**

1. **In Railway dashboard:**
   - Click on your **pgvector service** (the one that says "Active")
   - Go to **"Variables"** tab
   - Copy these values:
     - `PGHOST`
     - `PGPORT` (usually 5432)
     - `PGUSER` (usually postgres)
     - `PGPASSWORD`

2. **Connect directly with psql:**
   ```bash
   export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
   
   # Set variables (use values from Railway)
   export PGHOST=<your-pghost-from-railway>
   export PGPORT=5432
   export PGUSER=postgres
   export PGPASSWORD=<your-pgpassword-from-railway>
   
   # Connect
   psql -h $PGHOST -p $PGPORT -U $PGUSER -d railway
   ```

---

### **Step 3: Test pgvector Extension**

Once connected (you should see `railway=#` or `postgres=#`), test:

```sql
-- This should work now!
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

You should see a row with `extname = 'vector'` - **no errors!**

---

## **How to Tell Which Service You're Connected To**

**Wrong service (standard PostgreSQL):**
- Error: `extension "vector" is not available`
- Service name: "PostgreSQL" or "Postgres" (no pgvector mention)

**Correct service (pgvector PostgreSQL):**
- `CREATE EXTENSION vector;` works
- Service name: "pgvector" or mentions "pgvector"

---

## **Quick Fix Right Now**

**Get connection details from Railway dashboard:**

1. Click on **pgvector service** (not the old PostgreSQL)
2. Variables tab → Copy `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`
3. Connect directly:

```bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
psql -h <PGHOST> -p <PGPORT> -U <PGUSER> -d railway
```

Then test:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**This should work!** 🎉
