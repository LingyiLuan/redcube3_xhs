# 🚂 Railway Deployment Guide

## **Step-by-Step Guide to Deploy Backend to Railway**

This guide will help you deploy your microservices backend to Railway so your app runs 24/7 even when your laptop is off.

---

## **Prerequisites**

- ✅ GitHub account with your code pushed
- ✅ Railway account (sign up at https://railway.app)
- ✅ All environment variables ready (see `.railway.env.example`)

---

## **Step 1: Create Railway Account & Project**

1. **Sign up for Railway:**
   - Go to https://railway.app
   - Click "Start a New Project"
   - Sign up with GitHub (recommended)

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `redcube3_xhs`
   - Railway will clone your repo

---

## **Step 2: Set Up PostgreSQL Database**

1. **Add PostgreSQL Service:**
   - In Railway dashboard, click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway will create a PostgreSQL database

2. **Get Database Connection String:**
   - Click on the PostgreSQL service
   - Go to "Variables" tab
   - Copy the `DATABASE_URL` value
   - This will be used automatically by Railway

3. **Note the Database Details:**
   - Railway provides: `${{Postgres.DATABASE_URL}}`
   - This contains: `postgresql://user:password@host:port/dbname`

---

## **Step 3: Set Up Redis Cache**

1. **Add Redis Service:**
   - In Railway dashboard, click "+ New"
   - Select "Database" → "Redis"
   - Railway will create a Redis instance

2. **Get Redis Connection String:**
   - Click on the Redis service
   - Go to "Variables" tab
   - Copy the `REDIS_URL` value
   - This will be used automatically by Railway

---

## **Step 4: Deploy Services**

### **Option A: Deploy Individual Services (Recommended for Microservices)**

Railway works best when you deploy each service separately:

1. **Deploy API Gateway:**
   - Click "+ New" → "GitHub Repo"
   - Select your repo
   - Set root directory: `/api-gateway`
   - Railway will detect Dockerfile and deploy

2. **Deploy User Service:**
   - Click "+ New" → "GitHub Repo"
   - Select your repo
   - Set root directory: `/services/user-service`
   - Railway will detect Dockerfile and deploy

3. **Deploy Content Service:**
   - Click "+ New" → "GitHub Repo"
   - Select your repo
   - Set root directory: `/services/content-service`
   - Railway will detect Dockerfile and deploy

4. **Deploy Interview Service:**
   - Click "+ New" → "GitHub Repo"
   - Select your repo
   - Set root directory: `/services/interview-service`
   - Railway will detect Dockerfile and deploy

5. **Deploy Notification Service:**
   - Click "+ New" → "GitHub Repo"
   - Select your repo
   - Set root directory: `/services/notification-service`
   - Railway will detect Dockerfile and deploy

### **Option B: Deploy with Docker Compose (Alternative)**

Railway also supports Docker Compose, but it's more complex:

1. **Create Railway Service:**
   - Click "+ New" → "GitHub Repo"
   - Select your repo
   - Railway will detect `docker-compose.yml`

2. **Configure Services:**
   - Railway will try to deploy all services
   - You may need to configure each service separately

**Note:** Option A (individual services) is recommended for better control and scaling.

---

## **Step 5: Configure Environment Variables**

### **How Railway Detects Variables:**

Railway automatically detects environment variables from:
- ✅ Your `docker-compose.yml` file (it reads the `environment:` sections)
- ✅ Your source code (if you use `process.env.VARIABLE_NAME`)

**What Railway Already Found:**
- Railway scanned your `docker-compose.yml` and found all the variables you defined
- These are shown in the "Variables" tab for each service
- **You don't need to manually add variables that Railway already detected!**

### **What You Need to Do:**

1. **Check What Railway Found:**
   - Go to each service in Railway dashboard
   - Click "Variables" tab
   - See what variables Railway auto-detected from your `docker-compose.yml`

2. **Fill in the Values:**
   - Railway found the variable **names** but they have placeholder/empty values
   - You need to **replace the values** with your actual secrets/keys
   - Example: If Railway shows `GOOGLE_CLIENT_ID=` (empty), you need to fill it with your actual Google OAuth client ID

3. **Add Railway Service References:**
   - For Database: Railway provides variables like `${{Postgres.PGHOST}}` automatically
   - For Redis: Railway provides `${{Redis.REDIS_URL}}` automatically
   - **You need to add these references** to connect to Railway's managed services

### **Step-by-Step for User Service:**

1. **Go to User Service → Variables tab**

2. **For Database Connection:**
   - Railway auto-detected `DB_HOST`, `DB_PORT`, etc. from your `docker-compose.yml`
   - **Replace the values** with Railway's Postgres service references:
     - `DB_HOST` → Click "Reference Variable" → Select `Postgres` → Select `PGHOST`
     - `DB_PORT` → Reference `Postgres.PGPORT`
     - `DB_NAME` → Reference `Postgres.PGDATABASE`
     - `DB_USER` → Reference `Postgres.PGUSER`
     - `DB_PASSWORD` → Reference `Postgres.PGPASSWORD`
   - **OR** Railway might auto-provide `DATABASE_URL` - check if your code uses that instead

3. **For Redis Connection:**
   - Railway auto-detected `REDIS_URL` from your `docker-compose.yml`
   - **Replace the value** with Railway's Redis reference:
     - `REDIS_URL` → Reference `Redis.REDIS_URL`

4. **For OAuth (Fill in Your Actual Values):**
   - Railway found `GOOGLE_CLIENT_ID` but it's empty
   - **Fill it with your actual Google OAuth client ID** (from Google Cloud Console)
   - Same for `GOOGLE_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, etc.
   - **Update callback URLs** to use your Railway API domain:
     - `GOOGLE_CALLBACK_URL=https://your-railway-api.up.railway.app/api/auth/google/callback`
     - (Replace `your-railway-api.up.railway.app` with your actual Railway API Gateway URL)

5. **For Other Variables:**
   - Fill in `SESSION_SECRET` with a random string (min 32 characters)
   - Set `SESSION_COOKIE_SECURE=true`
   - Set `SESSION_COOKIE_DOMAIN=.labzero.io`
   - Set `FRONTEND_URL=https://labzero.io`
   - Fill in email credentials if you use email features

### **Quick Reference - Variables to Fill:**

**User Service Variables:**
```bash
# Database - Use Railway's Postgres references (see step 2 above)
# Redis - Use Railway's Redis reference (see step 3 above)

# OAuth - Fill with YOUR actual values:
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-secret-here
GOOGLE_CALLBACK_URL=https://your-railway-api.up.railway.app/api/auth/google/callback

LINKEDIN_CLIENT_ID=your-actual-linkedin-client-id-here
LINKEDIN_CLIENT_SECRET=your-actual-linkedin-secret-here
LINKEDIN_CALLBACK_URL=https://your-railway-api.up.railway.app/api/auth/linkedin/callback

# Session - Fill with YOUR values:
SESSION_SECRET=generate-a-random-32-character-secret-here
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_DOMAIN=.labzero.io
FRONTEND_URL=https://labzero.io

# Email - Fill with YOUR values:
GMAIL_USER=your-actual-email@gmail.com
GMAIL_APP_PASSWORD=your-actual-gmail-app-password
SMTP_PORT=587
```

**Important Notes:**
- ✅ Railway **already found** the variable names from your code
- ✅ You just need to **fill in the values** (replace placeholders with real values)
- ✅ Use Railway's "Reference Variable" feature for Database/Redis connections
- ✅ Update callback URLs to use your Railway API domain (not localhost)

### **Content Service:**
```bash
# Database
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# Redis
REDIS_URL=${{Redis.REDIS_URL}}

# AI APIs
OPENROUTER_API_KEY=your-openrouter-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
OPENAI_API_KEY=your-openai-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key

# Environment
NODE_ENV=production
ENABLE_SCHEDULER=true
SCRAPER_MODE=reddit

# Apify (Optional)
APIFY_API_TOKEN=your-apify-api-token
APIFY_ACTOR_ID=your-apify-actor-id

# Reddit (Optional)
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_SECRET=your-reddit-secret
REDDIT_USER=your-reddit-username
REDDIT_PASS=your-reddit-password

ENABLE_AUTO_SCRAPING=false

# Lemon Squeezy
LEMON_SQUEEZY_API_KEY=your-lemon-squeezy-api-key
LEMON_SQUEEZY_STORE_ID=your-store-id
LS_VARIANT_PRO_MONTHLY=your-variant-id
LS_VARIANT_PRO_ANNUAL=your-variant-id
LS_VARIANT_PREMIUM_MONTHLY=your-variant-id
LS_VARIANT_PREMIUM_ANNUAL=your-variant-id
LEMON_SQUEEZY_WEBHOOK_SECRET=your-webhook-secret
TRIAL_PERIOD_DAYS=14
```

### **Interview Service & Notification Service:**
```bash
# Database
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# Redis
REDIS_URL=${{Redis.REDIS_URL}}
```

**How to Set Variables in Railway:**
1. Click on a service
2. Go to "Variables" tab
3. Click "+ New Variable"
4. Add each variable one by one
5. Or use "Raw Editor" to paste all at once

---

## **Step 6: Configure Service URLs**

Railway assigns each service a public URL. You need to:

1. **Get Service URLs:**
   - Click on each service
   - Go to "Settings" → "Networking"
   - Copy the "Public Domain" (e.g., `api-gateway-production.up.railway.app`)

2. **Update API Gateway Configuration:**
   - In `api-gateway/nginx.conf`, update upstream servers:
   ```nginx
   upstream user-service {
       server user-service-production.up.railway.app:443;
   }
   
   upstream content-service {
       server content-service-production.up.railway.app:443;
   }
   ```

3. **Set Custom Domain (Optional):**
   - In Railway, go to service → "Settings" → "Networking"
   - Click "Custom Domain"
   - Add: `api.labzero.io`
   - Railway will provide DNS records to add to Cloudflare

---

## **Step 7: Deploy & Test**

1. **Trigger Deployment:**
   - Railway auto-deploys on git push
   - Or click "Deploy" button in Railway dashboard

2. **Check Logs:**
   - Click on each service
   - Go to "Deployments" tab
   - Click on latest deployment
   - Check "Logs" for errors

3. **Test API:**
   ```bash
   # Test health endpoint
   curl https://api.labzero.io/api/health
   
   # Test content service
   curl https://api.labzero.io/api/content/health
   ```

---

## **Step 8: Database Migration**

1. **Export Local Database:**
   ```bash
   docker exec redcube_postgres pg_dump -U postgres -d redcube_main > backup.sql
   docker exec redcube_postgres pg_dump -U postgres -d redcube_users > backup-users.sql
   docker exec redcube_postgres pg_dump -U postgres -d redcube_content > backup-content.sql
   ```

2. **Import to Railway PostgreSQL:**
   - Get Railway PostgreSQL connection string
   - Use `psql` or Railway's database interface:
   ```bash
   psql $DATABASE_URL < backup.sql
   psql $DATABASE_URL < backup-users.sql
   psql $DATABASE_URL < backup-content.sql
   ```

3. **Run Migrations:**
   - Connect to Railway PostgreSQL
   - Run any pending migrations from `shared/database/init/`

---

## **Step 9: Update OAuth Callback URLs**

1. **Google OAuth:**
   - Go to https://console.cloud.google.com/apis/credentials
   - Update "Authorized redirect URIs":
     - `https://api.labzero.io/api/auth/google/callback`

2. **LinkedIn OAuth:**
   - Go to https://www.linkedin.com/developers/apps
   - Update "Authorized redirect URLs":
     - `https://api.labzero.io/api/auth/linkedin/callback`

---

## **Step 10: Update Cloudflare Tunnel**

1. **Update Tunnel Configuration:**
   - Edit `cloudflare-tunnel-config.yml`:
   ```yaml
   tunnel: labzero
   credentials-file: /Users/luan02/.cloudflared/credentials.json
   
   ingress:
     - hostname: labzero.io
       service: https://your-vercel-frontend.vercel.app
     
     - hostname: api.labzero.io
       service: https://api-gateway-production.up.railway.app
     
     - service: http_status:404
   ```

2. **Restart Tunnel:**
   ```bash
   pkill -f cloudflared
   cloudflared tunnel --config cloudflare-tunnel-config.yml run labzero
   ```

---

## **Troubleshooting**

### **Service Won't Start:**
- Check logs in Railway dashboard
- Verify environment variables are set
- Check database connection string

### **Database Connection Failed:**
- Verify `DATABASE_URL` is correct
- Check PostgreSQL service is running
- Verify network connectivity

### **Redis Connection Failed:**
- Verify `REDIS_URL` is correct
- Check Redis service is running

### **OAuth Callbacks Not Working:**
- Verify callback URLs match exactly
- Check `FRONTEND_URL` is set correctly
- Verify `SESSION_COOKIE_DOMAIN` includes `.labzero.io`

---

## **Cost Estimate**

- **Hobby Plan**: $5/month + usage (~$0.10/GB RAM, ~$0.000463/GB-hour)
- **Pro Plan**: $20/month + usage
- **Estimated Monthly Cost**: ~$15-30/month for beta

---

## **Next Steps**

1. ✅ Deploy frontend to Vercel (see `VERCEL_DEPLOYMENT_GUIDE.md`)
2. ✅ Set up monitoring (Sentry, UptimeRobot)
3. ✅ Test all endpoints
4. ✅ Update DNS records

---

## **Support**

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

