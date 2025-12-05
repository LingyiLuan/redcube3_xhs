# 🔍 Step-by-Step: Verify Tables in Railway PostgreSQL

## **Step 1: Reconnect to Railway PostgreSQL**

**In Terminal 1, run:**

```bash
railway connect postgres
```

**You should see:**
```
railway=#
```

---

## **Step 2: Switch to redcube_content Database**

**In Terminal 1 (where you see `railway=#`), type:**

```sql
\c redcube_content
```

**You should see:**
```
You are now connected to database "redcube_content" as user "postgres".
redcube_content=#
```

---

## **Step 3: Count Total Tables**

**In Terminal 1 (where you see `redcube_content=#`), type:**

```sql
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

**This will show you the total number of tables.**

---

## **Step 4: Check Critical Tables**

**In Terminal 1, type:**

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'scraped_posts',
  'batch_analysis_cache',
  'assistant_conversations',
  'assistant_messages',
  'analysis_results',
  'user_workflows',
  'interview_questions'
)
ORDER BY table_name;
```

**This will show which critical tables exist.**

---

## **Step 5: Show All Tables (Optional)**

**If you want to see all tables:**

```sql
\dt
```

**This will list all tables (you can scroll to see them all).**

---

## **Summary:**

1. `railway connect postgres` - Reconnect
2. `\c redcube_content` - Switch database
3. Run the SQL queries above
4. Share the results!

**Start with Step 1!** 🚀
