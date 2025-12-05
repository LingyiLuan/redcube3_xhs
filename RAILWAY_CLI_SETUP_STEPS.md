# 🚂 Railway CLI Setup - Step by Step

## **Step 1: Login to Railway**

Run this command in your terminal:

```bash
railway login
```

This will:
- Open your browser
- Ask you to authorize Railway CLI
- Complete login automatically

---

## **Step 2: Link to Your Project**

Run this command:

```bash
railway link
```

This will:
- Show a list of your Railway projects
- Ask you to select the project (the one with your services)
- Link your current directory to that project

---

## **Step 3: Port Forward PostgreSQL**

Run this command:

```bash
railway connect postgres
```

This will:
- Create a port forward from Railway's PostgreSQL to your local machine
- Show you the connection details (usually localhost:5432)
- Keep running (don't close this terminal window!)

---

## **Step 4: Create Databases (In a NEW Terminal Window)**

**Open a NEW terminal window** (keep the port forwarding one running), then run:

```bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
PGPASSWORD=wBhiiTjKelhyWOLaxkzsXnClEYKdlJLb psql -h localhost -p 5432 -U postgres -d postgres
```

Then run these SQL commands:

```sql
CREATE DATABASE redcube_content;
CREATE DATABASE redcube_users;
CREATE DATABASE redcube_interviews;
CREATE DATABASE redcube_notifications;
```

Verify:

```sql
\l
```

Exit:

```sql
\q
```

---

## **Complete Command Sequence:**

**Terminal 1 (Port Forwarding - Keep Running):**
```bash
railway connect postgres
```

**Terminal 2 (Create Databases):**
```bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
PGPASSWORD=wBhiiTjKelhyWOLaxkzsXnClEYKdlJLb psql -h localhost -p 5432 -U postgres -d postgres
```

Then in psql:
```sql
CREATE DATABASE redcube_content;
CREATE DATABASE redcube_users;
CREATE DATABASE redcube_interviews;
CREATE DATABASE redcube_notifications;
\l
\q
```

---

## **Let's Start:**

Run these commands one by one:

1. `railway login`
2. `railway link`
3. `railway connect postgres` (keep this running)
4. In a new terminal: connect with psql and create databases

Let me know when you've completed steps 1-3, and I'll help you create the databases!
