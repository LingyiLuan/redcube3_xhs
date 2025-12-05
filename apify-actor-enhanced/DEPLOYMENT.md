# How to Deploy This Actor to Apify

## Step-by-Step Deployment Instructions

### Step 1: Login to Apify Console
1. Go to https://console.apify.com/
2. Login with your account (or create a free account)

### Step 2: Create New Actor

**Option A: Using Apify CLI (Recommended - Fastest)**
```bash
# Install Apify CLI globally
npm install -g apify-cli

# Login to Apify
apify login

# Navigate to this directory
cd /Users/luan02/Desktop/redcube3_xhs/apify-actor-enhanced

# Create and push the actor
apify push
```

**Option B: Using Apify Console (Manual)**

1. Click "Actors" in left sidebar
2. Click "Create new" button (top right)
3. Click "Empty project"
4. Name it: `redcube-reddit-scraper-enhanced`
5. Click "Create"

### Step 3: Upload Actor Files

**Using Apify Console:**

1. Go to your newly created actor
2. Click on "Source" tab
3. Upload these files:
   - `package.json`
   - `Dockerfile`
   - `README.md`
   - `INPUT_SCHEMA.json`
   - `.actor/actor.json`
   - `src/main.js`

**File Structure in Apify:**
```
/
├── .actor/
│   └── actor.json
├── src/
│   └── main.js
├── Dockerfile
├── INPUT_SCHEMA.json
├── package.json
└── README.md
```

### Step 4: Configure Reddit API Credentials

1. Go to Settings → Environment Variables
2. Add these variables:

```
REDDIT_CLIENT_ID = your_reddit_app_client_id
REDDIT_CLIENT_SECRET = your_reddit_app_client_secret
REDDIT_USERNAME = your_reddit_username
REDDIT_PASSWORD = your_reddit_password
```

**How to get Reddit credentials:**
1. Go to https://www.reddit.com/prefs/apps
2. Scroll down and click "create another app..."
3. Fill in:
   - **name**: RedCube Scraper
   - **App type**: Select "script"
   - **description**: (leave blank or add your own)
   - **about url**: (leave blank)
   - **redirect uri**: http://localhost:8080
4. Click "create app"
5. Copy the values:
   - **Client ID**: The string under "personal use script"
   - **Client Secret**: The string next to "secret"

### Step 5: Build the Actor

1. Click "Build" tab
2. Click "Build" button
3. Wait for build to complete (~1-2 minutes)
4. Check for any errors in the build log

### Step 6: Test Run

**Test with minimal configuration:**

1. Click "Input" tab
2. Use this test configuration:
```json
{
  "subreddits": ["cscareerquestions"],
  "postsPerSubreddit": 5,
  "sortBy": "new",
  "includeComments": true,
  "maxCommentsPerPost": 5,
  "filterInterviewOnly": false,
  "minWordCount": 50
}
```

3. Click "Start" button
4. Monitor the "Log" tab for progress
5. Check "Dataset" tab for scraped posts

**Expected result:** 5 posts from r/cscareerquestions

### Step 7: Verify Data Quality

Check the Dataset tab and verify each post has:
- ✅ `postId`
- ✅ `title`
- ✅ `bodyText`
- ✅ `comments` array (if includeComments=true)
- ✅ `word_count`

### Step 8: Production Run

Once test is successful, use full configuration:

```json
{
  "subreddits": [
    "cscareerquestions",
    "ExperiencedDevs",
    "leetcode",
    "csMajors",
    "webdev",
    "backend"
  ],
  "postsPerSubreddit": 50,
  "sortBy": "new",
  "includeComments": true,
  "maxCommentsPerPost": 10,
  "filterInterviewOnly": true,
  "minWordCount": 100
}
```

### Step 9: Set Up Webhook (Optional)

To send data directly to your content service:

1. Go to Settings → Integrations → Webhooks
2. Add webhook URL: `http://YOUR_SERVER:8080/api/content/agent/scrape`
3. Event: `ACTOR.RUN.SUCCEEDED`
4. This will automatically send scraped data to your backend

### Step 10: Schedule Daily Runs

1. Go to "Schedules" tab
2. Click "Create new schedule"
3. Configure:
   - **Name**: Daily Interview Scrape
   - **Cron expression**: `0 2 * * *` (2 AM daily)
   - **Timezone**: America/Los_Angeles (PST)
   - **Input**: Use your production configuration from Step 8
4. Click "Save"

## Troubleshooting

### Build Fails
- Check that all files are uploaded correctly
- Verify `package.json` is valid JSON
- Check build logs for specific errors

### No Posts Scraped
- Verify Reddit credentials are correct
- Check that app type is "script" not "web app"
- Try with `filterInterviewOnly: false` for testing

### Authentication Error (401)
- Double-check Reddit username/password
- Ensure no special characters in environment variables
- Try creating a new Reddit app

### Rate Limit Errors
- The scraper includes 1-second delays
- If still hitting limits, reduce `postsPerSubreddit`

### Missing Comments
- Verify `includeComments: true`
- Check that posts have `num_comments > 0`
- Some posts may have all deleted comments

## Quick Reference

**Apify CLI Commands:**
```bash
# Login
apify login

# Push updates
apify push

# Run locally
apify run

# Check status
apify info
```

**Useful Links:**
- Apify Console: https://console.apify.com/
- Reddit Apps: https://www.reddit.com/prefs/apps
- Apify Docs: https://docs.apify.com/

## Cost Tracking

Monitor your usage:
1. Go to Billing → Usage
2. Check "Compute units" used
3. Free tier: $5/month = ~10,000 compute units

**Estimated costs:**
- Test run (5 posts): ~1-2 compute units
- Production run (300 posts): ~10-20 compute units
- Daily runs: ~$1-2/month

## Next Steps After Deployment

1. ✅ Actor deployed and running
2. ✅ Daily schedule configured
3. → Monitor first 24 hours of data collection
4. → Check database for scraped posts
5. → Verify metadata extraction is working
6. → Start manual labeling in UI
7. → Scale to all 30+ subreddits

## Support

If you encounter issues:
1. Check actor logs in Apify console
2. Verify environment variables are set correctly
3. Test with minimal configuration first
4. Check [ERROR_NOTEBOOK.md](../../ERROR_NOTEBOOK.md) for common issues
