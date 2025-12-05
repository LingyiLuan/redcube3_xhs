# 🔧 Fix Database Issues - Step by Step

## **What I Fixed:**

### **Fix 1: Added Missing Environment Variables**

I updated `railway-content-service.env` to include both:
- `DB_*` variables (for main database connection)
- `POSTGRES_*` variables (for services like trendingService, interviewIntelService, etc.)

**Why:** Some services use `POSTGRES_HOST`, `POSTGRES_USER`, etc., but the env file only had `DB_*` variables.

---

## **Step 1: Update Environment Variables in Railway**

1. **Go to Railway dashboard**
2. **Click on content-service**
3. **Go to "Settings" → "Variables"**
4. **Click "Raw Editor" or edit variables**
5. **Add these new variables:**

```
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_PORT=${{Postgres.PGPORT}}
POSTGRES_DB=redcube_content
POSTGRES_USER=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
```

**Or copy the entire updated `railway-content-service.env` file** (I've already updated it with these variables)

---

## **Step 2: Create Missing Tables**

**Make sure `railway connect postgres` is running in another terminal**, then run:

```bash
cd ~/Desktop/redcube3_xhs
./create_missing_tables.sh
```

This will create the `scraped_posts` table and other missing tables.

---

## **Step 3: Redeploy content-service**

After updating environment variables and creating tables:

1. **Go to Railway dashboard**
2. **Click on content-service**
3. **Go to "Deployments" tab**
4. **Click "..." on latest deployment**
5. **Click "Redeploy"**

---

## **Summary:**

1. ✅ **Updated env file** - Added `POSTGRES_*` variables
2. ⏭️ **Update Railway variables** - Add the new variables
3. ⏭️ **Run create_missing_tables.sh** - Create tables
4. ⏭️ **Redeploy service** - Apply changes

Let me know when you've updated the variables, and I'll help you create the tables!
