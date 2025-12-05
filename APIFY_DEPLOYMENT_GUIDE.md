# Apify Enhanced Scraper Deployment Guide

**Date:** October 10, 2025
**Status:** Ready for Production Deployment

---

## 📋 Pre-Deployment Checklist

### ✅ What's Ready
- [x] Enhanced scraper code written (`main-enhanced.js`)
- [x] Configuration file created (`input-enhanced.json`)
- [x] Metadata extraction service operational
- [x] Database schema enhanced (42 columns, 26 indexes)
- [x] Content service integration complete
- [x] Labeling UI built and tested
- [x] Database cleaned (0 posts, fresh start)

### ⏳ What You Need
- [ ] Apify account with API token
- [ ] Reddit API credentials (OAuth2)
- [ ] Content service URL (webhook for data ingestion)

---

## 🚀 Deployment Steps

### Step 1: Apify Account Setup

**1.1 Login to Apify**
```
https://console.apify.com/
```

**1.2 Get Your API Token**
```
Settings → Integrations → API Tokens
Copy your personal API token
```

**1.3 Create New Actor**
```
Actors → Create new Actor → From code
Name: redcube-reddit-scraper-enhanced
```

### Step 2: Upload Scraper Code

**2.1 Upload Main File**
```
File: main.js
Content: Copy from /apify-actor/main-enhanced.js
```

**2.2 Upload Package.json**
```json
{
  "name": "redcube-reddit-scraper-enhanced",
  "version": "2.0.0",
  "description": "Enhanced Reddit scraper with multi-subreddit support and metadata extraction",
  "main": "main.js",
  "dependencies": {
    "apify": "^3.1.0",
    "got-scraping": "^3.2.0"
  },
  "scripts": {
    "start": "node main.js"
  }
}
```

**2.3 Configure Input Schema**
```json
{
  "title": "Enhanced Reddit Scraper Input",
  "type": "object",
  "schemaVersion": 1,
  "properties": {
    "subreddits": {
      "title": "Subreddits to scrape",
      "type": "array",
      "description": "List of subreddit names (without r/)",
      "editor": "stringList",
      "default": ["cscareerquestions", "ExperiencedDevs", "leetcode", "csMajors"]
    },
    "postsPerSubreddit": {
      "title": "Posts per subreddit",
      "type": "integer",
      "description": "Number of posts to scrape from each subreddit",
      "default": 50,
      "minimum": 1,
      "maximum": 100
    },
    "sortBy": {
      "title": "Sort order",
      "type": "string",
      "description": "How to sort posts",
      "default": "new",
      "enum": ["hot", "new", "top", "rising"],
      "enumTitles": ["Hot", "New", "Top", "Rising"]
    },
    "includeComments": {
      "title": "Include comments",
      "type": "boolean",
      "description": "Fetch top comments for each post",
      "default": true
    },
    "maxCommentsPerPost": {
      "title": "Max comments per post",
      "type": "integer",
      "description": "Number of top comments to fetch",
      "default": 10,
      "minimum": 0,
      "maximum": 50
    },
    "filterInterviewOnly": {
      "title": "Filter interview posts only",
      "type": "boolean",
      "description": "Only scrape posts related to interviews",
      "default": true
    },
    "minWordCount": {
      "title": "Minimum word count",
      "type": "integer",
      "description": "Skip posts shorter than this",
      "default": 100,
      "minimum": 0
    }
  },
  "required": ["subreddits"]
}
```

### Step 3: Configure Reddit API Credentials

**3.1 Add Secrets to Apify**
```
Settings → Environment Variables → Add Variable

Name: REDDIT_CLIENT_ID
Value: [Your Reddit App Client ID]

Name: REDDIT_CLIENT_SECRET
Value: [Your Reddit App Client Secret]

Name: REDDIT_USERNAME
Value: [Your Reddit Username]

Name: REDDIT_PASSWORD
Value: [Your Reddit Password]
```

**3.2 Get Reddit Credentials**
```
1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Select "script" type
4. Name: RedCube Interview Scraper
5. Redirect URI: http://localhost:8080
6. Copy Client ID and Secret
```

### Step 4: Configure Webhook (Data Ingestion)

**4.1 Add Content Service URL**
```
Settings → Environment Variables → Add Variable

Name: WEBHOOK_URL
Value: http://YOUR_SERVER:8080/api/content/agent/scrape
```

**4.2 Update main-enhanced.js (if needed)**
```javascript
// At the end of main.js, add webhook call
const webhookUrl = process.env.WEBHOOK_URL;
if (webhookUrl) {
  await got.post(webhookUrl, {
    json: {
      subreddit: 'multi',
      numberOfPosts: totalScraped,
      scrapedPosts: allPosts
    }
  });
}
```

### Step 5: Test Run

**5.1 Start with Small Test**
```json
{
  "subreddits": ["cscareerquestions"],
  "postsPerSubreddit": 5,
  "includeComments": true,
  "maxCommentsPerPost": 5
}
```

**5.2 Run Actor**
```
Click "Start" button
Monitor logs for errors
Check dataset for scraped posts
```

**5.3 Verify Data in Database**
```sql
-- Check posts were ingested
SELECT COUNT(*) FROM scraped_posts;

-- Check metadata extraction worked
SELECT
  title,
  role_type,
  level,
  company,
  interview_stage
FROM scraped_posts
LIMIT 5;
```

### Step 6: Scale to Production

**6.1 Update Input for Full Scraping**
```json
{
  "subreddits": [
    "cscareerquestions",
    "ExperiencedDevs",
    "leetcode",
    "csMajors",
    "webdev",
    "backend",
    "MachineLearning",
    "MLQuestions",
    "dataengineering",
    "datascience",
    "ProductManagement",
    "devops",
    "kubernetes"
  ],
  "postsPerSubreddit": 50,
  "sortBy": "new",
  "includeComments": true,
  "maxCommentsPerPost": 10,
  "filterInterviewOnly": true,
  "minWordCount": 100
}
```

**6.2 Configure Schedule**
```
Schedules → Create new schedule
Name: Daily Reddit Scrape
Cron: 0 2 * * *  (2 AM daily)
Actor: redcube-reddit-scraper-enhanced
```

---

## 🔧 Troubleshooting

### Issue 1: Reddit API Authentication Failed
**Error:** `401 Unauthorized`
**Solution:**
```
1. Verify Reddit credentials are correct
2. Check app type is "script" not "web app"
3. Ensure username/password don't have special characters
4. Try creating a new Reddit app
```

### Issue 2: No Posts Scraped
**Error:** Dataset is empty
**Solution:**
```
1. Check subreddit names are correct (no r/ prefix)
2. Verify sortBy parameter ("new" is safest)
3. Check filterInterviewOnly isn't too restrictive
4. Lower minWordCount to 50
```

### Issue 3: Metadata Not Extracted
**Error:** Posts have NULL in role_type, level, etc.
**Solution:**
```
1. Check content service logs: docker logs redcube3_xhs-content-service-1
2. Verify metadata extraction service is loaded
3. Check extraction patterns in constants.js
4. Test with a known post (e.g., title with "Google L4 SWE")
```

### Issue 4: Comments Not Fetched
**Error:** comment_count is 0
**Solution:**
```
1. Verify includeComments is true
2. Check Reddit API rate limits (may need delay)
3. Ensure posts have num_comments > 0
4. Check fetchComments() function in main.js
```

---

## 📊 Monitoring & Validation

### Key Metrics to Track

**1. Scraping Success Rate**
```
Target: >95% of attempted posts scraped
Monitor: Apify run logs
Alert: If success rate drops below 90%
```

**2. Metadata Extraction Rate**
```
Target: >80% of posts have role_type
Query: SELECT COUNT(*) FILTER (WHERE role_type IS NOT NULL) * 100.0 / COUNT(*) FROM scraped_posts;
Alert: If extraction rate drops below 70%
```

**3. Data Quality**
```
Target: >90% of posts have level, company, or tech_stack
Query: SELECT COUNT(*) FILTER (WHERE level IS NOT NULL OR company IS NOT NULL OR tech_stack IS NOT NULL) * 100.0 / COUNT(*) FROM scraped_posts;
```

**4. Daily Collection Volume**
```
Target: 1,500 posts/day (30 subreddits × 50 posts)
Query: SELECT DATE(scraped_at) as date, COUNT(*) FROM scraped_posts WHERE scraped_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(scraped_at);
```

### Validation Queries

**Check recent scrape:**
```sql
SELECT
  DATE(scraped_at) as date,
  COUNT(*) as posts,
  COUNT(*) FILTER (WHERE role_type IS NOT NULL) as with_role,
  COUNT(*) FILTER (WHERE level IS NOT NULL) as with_level,
  COUNT(DISTINCT subreddit) as subreddits
FROM scraped_posts
WHERE scraped_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE(scraped_at);
```

**Check data quality:**
```sql
SELECT
  role_type,
  level,
  COUNT(*) as count
FROM scraped_posts
WHERE scraped_at >= NOW() - INTERVAL '24 hours'
  AND role_type IS NOT NULL
GROUP BY role_type, level
ORDER BY count DESC;
```

**Check subreddit coverage:**
```sql
SELECT
  subreddit,
  COUNT(*) as posts,
  COUNT(*) FILTER (WHERE role_type IS NOT NULL) as with_metadata
FROM scraped_posts
WHERE scraped_at >= NOW() - INTERVAL '24 hours'
GROUP BY subreddit
ORDER BY posts DESC;
```

---

## 💰 Cost Estimation

### Apify Costs
**Free Tier:**
- $5 credit/month
- ~10,000 actor runs
- Good for testing

**Paid Plan:**
- ~$0.25 per 1,000 actor compute units
- 1 scrape run ≈ 10-50 compute units
- Daily scraping ≈ $0.01-0.05/day
- Monthly: ~$1-2

### Reddit API
- Free for personal use
- Rate limit: 60 requests/minute
- Our usage: Well within limits with delays

### Total Estimated Cost
**Testing Phase:** $0 (free tier)
**Production (daily scraping):** $1-2/month

---

## 📈 Expected Results

### Week 1
- **Posts collected:** ~10,500 (1,500/day × 7 days)
- **With metadata:** ~8,400 (80% extraction rate)
- **Unique roles:** 15-20
- **Unique companies:** 30-50

### Week 2
- **Total posts:** ~21,000
- **Labeled posts:** 100+ (manual labeling via UI)
- **Ready for:** Phase 5.2 (embeddings)

### Week 3-4
- **Total posts:** 30,000+
- **Labeled posts:** 500+
- **ML training:** Ready to retrain prediction models

---

## ✅ Deployment Checklist

**Pre-Deployment:**
- [ ] Apify account created
- [ ] Reddit API app created
- [ ] Credentials configured in Apify secrets
- [ ] Test run completed successfully (5 posts)
- [ ] Data verified in database
- [ ] Metadata extraction confirmed working

**Production Deployment:**
- [ ] Full subreddit list configured (30+)
- [ ] Daily schedule set (2 AM PST)
- [ ] Webhook configured for auto-ingestion
- [ ] Monitoring alerts set up
- [ ] Error logging configured

**Post-Deployment:**
- [ ] Monitor first 24 hours closely
- [ ] Verify data quality daily
- [ ] Check metadata extraction rate
- [ ] Start manual labeling workflow
- [ ] Document any issues in ERROR_NOTEBOOK.md

---

## 🎯 Success Criteria

**Infrastructure:**
- ✅ Scraper runs daily without manual intervention
- ✅ >95% scraping success rate
- ✅ >80% metadata extraction rate
- ✅ <1% error rate

**Data Quality:**
- ✅ 1,500+ posts collected daily
- ✅ Consistent data structure (all 42 columns)
- ✅ Deep comments on >90% of posts
- ✅ 30+ subreddits active

**Timeline:**
- ✅ 5,000 posts within 1 week
- ✅ 500+ labeled posts within 2 weeks
- ✅ Ready for Phase 5.2 within 3 weeks

---

## 📞 Support & Documentation

**Apify Documentation:**
- https://docs.apify.com/
- https://docs.apify.com/academy

**Reddit API:**
- https://www.reddit.com/dev/api/
- https://github.com/reddit-archive/reddit/wiki/OAuth2

**Internal Docs:**
- [PHASE_5_IMPLEMENTATION_PLAN.md](PHASE_5_IMPLEMENTATION_PLAN.md)
- [PHASE_5_ENHANCED_METADATA.md](PHASE_5_ENHANCED_METADATA.md)
- [ERROR_NOTEBOOK.md](ERROR_NOTEBOOK.md)

---

**Prepared by:** Claude (Phase 5.1 Implementation)
**Last Updated:** October 10, 2025
**Status:** Ready for deployment 🚀
