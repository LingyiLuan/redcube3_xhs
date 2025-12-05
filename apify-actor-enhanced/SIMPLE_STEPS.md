# Simple 3-Step Deployment Guide

## ✅ Your Actor is Ready!

Location: `/Users/luan02/Desktop/redcube3_xhs/apify-actor-enhanced/`

All files are prepared and ready to deploy. Just follow these 3 simple steps:

---

## 🚀 Step 1: Create Reddit App (5 minutes)

1. Go to: https://www.reddit.com/prefs/apps
2. Click "create another app..." (at the bottom)
3. Fill in:
   ```
   name: RedCube Scraper
   type: ● script  (SELECT THIS!)
   redirect uri: http://localhost:8080
   ```
4. Click "create app"
5. **Save these values:**
   ```
   Client ID: [under "personal use script"]
   Client Secret: [next to "secret"]
   ```

---

## 📤 Step 2: Upload to Apify (10 minutes)

### Option A: Using Apify CLI (Fastest!)

```bash
# Install CLI
npm install -g apify-cli

# Login to Apify
apify login

# Go to actor directory
cd /Users/luan02/Desktop/redcube3_xhs/apify-actor-enhanced

# Deploy!
apify push
```

**Done!** The actor is now live on Apify.

### Option B: Manual Upload (if CLI doesn't work)

1. Go to: https://console.apify.com/actors
2. Click "Create new" → "Empty project"
3. Name: `redcube-reddit-scraper-enhanced`
4. Upload these files from `/apify-actor-enhanced/`:
   - Drag and drop all files from the folder
   - Or click "Upload files" and select all

---

## 🔑 Step 3: Add Credentials (3 minutes)

In Apify Console:

1. Go to your actor → "Settings" tab
2. Scroll to "Environment variables"
3. Click "Add variable" and add these 4:

```
Name: REDDIT_CLIENT_ID
Value: [paste from Step 1]

Name: REDDIT_CLIENT_SECRET
Value: [paste from Step 1]

Name: REDDIT_USERNAME
Value: [your Reddit username]

Name: REDDIT_PASSWORD
Value: [your Reddit password]
```

4. Click "Save"

---

## ✅ Step 4: Test Run (2 minutes)

1. Click "Input" tab
2. Paste this:
```json
{
  "subreddits": ["cscareerquestions"],
  "postsPerSubreddit": 5
}
```

3. Click "Start" (green button)
4. Watch the "Log" tab - you should see:
   ```
   ✅ Successfully authenticated with Reddit
   📡 Fetching 5 posts from r/cscareerquestions...
   ✅ Successfully scraped 5 posts
   ```

5. Click "Dataset" tab - you should see 5 posts!

---

## 🎉 You're Done!

### What to do next:

**1. Check your database:**
```bash
docker exec redcube3_xhs-postgres-1 psql -U postgres -d redcube_content -c "SELECT COUNT(*) FROM scraped_posts;"
```

**2. Set up daily schedule:**
- In Apify: "Schedules" tab → "Create new"
- Cron: `0 2 * * *` (2 AM daily)
- Use this input:
```json
{
  "subreddits": [
    "cscareerquestions",
    "ExperiencedDevs",
    "leetcode",
    "csMajors"
  ],
  "postsPerSubreddit": 50,
  "includeComments": true,
  "maxCommentsPerPost": 10
}
```

**3. Start labeling:**
- Go to http://localhost:3002
- Click "🏷️ Data Labeling" tab
- Use keyboard: 1=Positive, 2=Negative, 3=Neutral, S=Skip

---

## 🆘 Troubleshooting

**"Authentication failed"**
→ Double-check Reddit credentials, make sure app type is "script"

**"No posts scraped"**
→ Try `filterInterviewOnly: false` in the input

**"Build failed"**
→ Make sure all files are uploaded correctly

---

## 📊 Expected Results

**After first run:**
- 5 test posts in database ✅
- Each post has metadata (role, level, company) ✅
- Comments included ✅

**After 1 day of daily scraping:**
- ~200 posts (4 subreddits × 50 posts)
- Ready to start labeling

**After 1 week:**
- ~1,400 posts
- 100+ labeled
- High-quality training data ready

---

## 🎯 Your Files

All files are in: `/Users/luan02/Desktop/redcube3_xhs/apify-actor-enhanced/`

```
apify-actor-enhanced/
├── DEPLOYMENT.md          ← Full deployment guide
├── SIMPLE_STEPS.md        ← This file
├── README.md              ← Actor documentation
├── package.json           ← Dependencies
├── Dockerfile             ← Build configuration
├── INPUT_SCHEMA.json      ← Input form definition
├── .actor/
│   └── actor.json         ← Apify metadata
└── src/
    └── main.js            ← Main scraper code
```

---

**Status:** ✅ Ready to deploy!
**Time needed:** ~20 minutes total
**Next step:** Go to https://console.apify.com/ and start Step 2!
