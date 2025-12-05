# 🔍 Database Errors Diagnosis

## **Two Errors Found:**

### **Error 1: Password Authentication Failed**
```
password authentication failed for user "postgres"
```

### **Error 2: Table Does Not Exist**
```
relation "scraped_posts" does not exist
```

---

## **Root Cause Analysis:**

### **Error 1: Password Authentication Failed**

**What this means:**
- Service is trying to connect to PostgreSQL
- Using wrong password or credentials
- Railway's PostgreSQL uses different credentials than local

**Why this happens:**
- Environment variables might be wrong
- Using local credentials instead of Railway credentials
- Railway PostgreSQL password is different

**What to check:**
1. Railway dashboard → content-service → Variables
2. Check `DB_PASSWORD` - should use Railway reference: `${{Postgres.PGPASSWORD}}`
3. Check `DB_USER` - should use Railway reference: `${{Postgres.PGUSER}}`
4. Check `DB_HOST` - should use Railway reference: `${{Postgres.PGHOST}}`

### **Error 2: Table Does Not Exist**

**What this means:**
- Database `redcube_content` exists (we created it)
- But tables weren't created
- Migration didn't run successfully

**Why this happens:**
- Migrations we ran earlier might have failed silently
- Tables weren't created in `redcube_content` database
- Need to run migrations again

**What to check:**
1. Verify tables exist in `redcube_content` database
2. Check if migrations ran successfully
3. Re-run migrations if needed

---

## **What Needs to Be Fixed:**

### **Fix 1: Database Credentials**

**Check Railway environment variables:**
- `DB_HOST=${{Postgres.PGHOST}}` ✅ Should use Railway reference
- `DB_PORT=${{Postgres.PGPORT}}` ✅ Should use Railway reference
- `DB_NAME=redcube_content` ✅ Should be correct
- `DB_USER=${{Postgres.PGUSER}}` ✅ Should use Railway reference
- `DB_PASSWORD=${{Postgres.PGPASSWORD}}` ✅ Should use Railway reference

**If these are wrong:**
- Update environment variables in Railway
- Redeploy service

### **Fix 2: Create Tables**

**Tables need to be created:**
- `scraped_posts` table doesn't exist
- Other tables might also be missing
- Need to run migrations for `redcube_content` database

**How to fix:**
1. Connect to Railway PostgreSQL
2. Run migrations for `redcube_content` database
3. Specifically run `07-phase4-scraper-tables.sql` to create `scraped_posts`

---

## **Next Steps:**

1. **Check environment variables** in Railway dashboard
2. **Verify tables exist** in database
3. **Run missing migrations** if tables don't exist
4. **Redeploy service** after fixing

---

## **Summary:**

**Two issues:**
1. ❌ **Password authentication failed** - Wrong database credentials
2. ❌ **Tables don't exist** - Migrations didn't create tables

**Both need to be fixed:**
1. Fix environment variables (use Railway references)
2. Run migrations to create tables
3. Redeploy service

Let me know what you find in the environment variables, and I'll help you fix both issues!
