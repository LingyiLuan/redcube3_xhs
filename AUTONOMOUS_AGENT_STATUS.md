# 🤖 Autonomous Scraping Agent - Status & Monitoring

## ✅ Current Status: **ACTIVE & RUNNING**

### Automated Schedulers
| Scheduler | Status | Schedule | Details |
|-----------|--------|----------|---------|
| **6-Hour Scraping** | ✅ Active | `0 */6 * * *` | 100 posts every 6 hours = **400 posts/day** |
| **Daily Scraping** | ✅ Active | `0 2 * * *` | 200 posts at 2:00 AM = **200 posts/day** |
| **Embedding Generation** | ✅ Active | `0 * * * *` | Generate embeddings every hour |
| **NLP Extraction** | ✅ Active | `0 */2 * * *` | Extract metadata every 2 hours |

**Total Collection**: **600 posts/day** = **4,200 posts/week** = **~18,000 posts/month**

---

## 🎯 Verification Commands

### 1. Check Agent Status
```bash
curl -X GET 'http://localhost:8080/api/content/agent/status'
```

**Expected Response:**
```json
{
  "success": true,
  "agent": {
    "enabled": true,
    "scheduledJobs": [
      {"name": "weeklyBriefings", "running": true},
      {"name": "dailyDataCollection", "running": true}
    ],
    "apifyConfigured": true
  }
}
```

### 2. Check Scraper Statistics (Most Important)
```bash
curl -X GET 'http://localhost:8080/api/content/agent/stats' | python3 -m json.tool
```

**Key Metrics to Watch:**
- `totalPosts` - Should increase over time
- `todayCount` - Should show today's scraped posts
- `postsWithEmbeddings` - Should be close to totalPosts
- `scraperMode` - Should be `"reddit"` (FREE)
- `autoScrapingEnabled` - Should be `true`
- `recentActivity` - Shows scraping per day

### 3. Check Container Logs
```bash
# See all scheduler activity
docker logs redcube3_xhs-content-service-1 2>&1 | grep Scheduler

# See scraping activity
docker logs redcube3_xhs-content-service-1 2>&1 | grep "SCRAPER\|REDDIT"

# See recent activity (last 50 lines)
docker logs redcube3_xhs-content-service-1 --tail 50
```

### 4. Manually Trigger Scraping (Test)
```bash
curl -X POST 'http://localhost:8080/api/content/agent/scrape' \
  -H 'Content-Type: application/json' \
  -d '{"subreddit":"cscareerquestions","numberOfPosts":10}'
```

### 5. Database Query (Direct Check)
```bash
# Connect to database
docker exec -it redcube_postgres psql -U postgres -d redcube_content

# Check total posts
SELECT COUNT(*) as total_posts FROM scraped_posts;

# Check posts scraped today
SELECT COUNT(*) as today_posts
FROM scraped_posts
WHERE DATE(scraped_at) = CURRENT_DATE;

# Check recent scraping activity (last 7 days)
SELECT DATE(scraped_at) as date, COUNT(*) as posts
FROM scraped_posts
WHERE scraped_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(scraped_at)
ORDER BY date DESC;

# Check posts with embeddings
SELECT
  COUNT(*) as total_posts,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings
FROM scraped_posts;

# Exit database
\q
```

---

## 📊 Current Statistics (as of 2025-10-29)

```json
{
  "totalPosts": 288,
  "postsWithEmbeddings": 286,
  "todayCount": 101,
  "scraperMode": "reddit",
  "autoScrapingEnabled": true,
  "companyCoverage": [
    {"company": "Amazon", "count": 26},
    {"company": "Google", "count": 3}
  ],
  "recentActivity": [
    {"date": "2025-10-30", "count": 101},
    {"date": "2025-10-24", "count": 40},
    {"date": "2025-10-23", "count": 49}
  ]
}
```

---

## 🔍 How to Know if It's Working

### ✅ Signs Agent is Working:
1. **`todayCount` increases** - Check this number throughout the day
2. **`recentActivity` shows today's date** - Confirms recent scraping
3. **Container logs show scraping** - Look for `🕷️ [SCRAPER]` messages
4. **No error messages** - Check logs for `❌` or `ERROR`
5. **Database count increases** - Direct SQL query shows growth

### ❌ Signs Agent is NOT Working:
1. `todayCount` stays at 0 all day
2. `recentActivity` doesn't show today's date
3. Container logs show errors like `❌ [Scheduler]`
4. `totalPosts` hasn't increased in days
5. Container keeps restarting (check `docker ps`)

---

## ⏰ Scraping Schedule Breakdown

### Current Time: Your Local Time
- **Container Timezone**: America/Los_Angeles (PST/PDT)

### Schedule:
| Time (PST) | Event | Posts |
|------------|-------|-------|
| 2:00 AM | Daily scraping | 200 posts |
| 6:00 AM | 6-hour scraping | 100 posts |
| 12:00 PM | 6-hour scraping | 100 posts |
| 6:00 PM | 6-hour scraping | 100 posts |
| 12:00 AM | 6-hour scraping | 100 posts |

**Total**: 600 posts/day

---

## 🐛 Troubleshooting

### Problem: No posts scraped today
```bash
# Check if container is running
docker ps | grep content-service

# Check for errors
docker logs redcube3_xhs-content-service-1 --tail 100 | grep ERROR

# Manually trigger scraping
curl -X POST 'http://localhost:8080/api/content/agent/scrape' \
  -H 'Content-Type: application/json' \
  -d '{"numberOfPosts":5}'
```

### Problem: Reddit API failing
```bash
# Test Reddit API connection
curl -X GET 'http://localhost:8080/api/content/agent/test-reddit'

# Check Reddit credentials in docker-compose.yml
grep REDDIT /Users/luan02/Desktop/redcube3_xhs/docker-compose.yml
```

### Problem: Scheduler not running
```bash
# Check environment variables
docker exec redcube3_xhs-content-service-1 env | grep -E "ENABLE_SCHEDULER|ENABLE_AUTO_SCRAPING|SCRAPER_MODE"

# Should show:
# ENABLE_SCHEDULER=true
# ENABLE_AUTO_SCRAPING=true
# SCRAPER_MODE=reddit
```

---

## 📈 Expected Growth

| Timeframe | Expected Posts | Calculation |
|-----------|----------------|-------------|
| 1 day | +600 posts | 200 (daily) + 400 (6-hour) |
| 1 week | +4,200 posts | 600/day × 7 days |
| 1 month | ~18,000 posts | 600/day × 30 days |

**Note**: Actual numbers may vary based on:
- Reddit post availability
- Duplicate filtering
- Interview-related content filtering

---

## 🔧 Configuration

### Docker Compose Environment Variables
```yaml
environment:
  - SCRAPER_MODE=reddit              # Use Reddit API (FREE)
  - ENABLE_AUTO_SCRAPING=true        # Enable 6-hour scraping
  - ENABLE_SCHEDULER=true            # Enable all schedulers
  - REDDIT_CLIENT_ID=${REDDIT_CLIENT_ID}
  - REDDIT_SECRET=${REDDIT_SECRET}
  - REDDIT_USER=${REDDIT_USER}
  - REDDIT_PASS=${REDDIT_PASS}
```

### Scheduler Files
- **6-Hour Scraping**: `/src/services/schedulerService.js` (line 20-46)
- **Daily Scraping**: `/src/services/scheduler.js` (line 58-84)
- **Scheduler Init**: `/src/app.js` (line 17-28)

---

## 📝 Quick Status Check Script

Save this as `check-agent.sh`:

```bash
#!/bin/bash

echo "🤖 Autonomous Agent Status Check"
echo "================================"
echo ""

echo "1️⃣ Scraper Statistics:"
curl -s 'http://localhost:8080/api/content/agent/stats' | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']['overall']
print(f\"   Total Posts: {data['totalPosts']}")
print(f\"   Today's Posts: {data['todayCount']}")
print(f\"   With Embeddings: {data['postsWithEmbeddings']}")
print(f\"   Scraper Mode: {data.get('scraperMode', 'N/A')}")
print(f\"   Auto-Scraping: {data.get('autoScrapingEnabled', 'N/A')}")
"

echo ""
echo "2️⃣ Container Status:"
docker ps | grep content-service | awk '{print "   Status: "$7" (Up "$8" "$9")"}'

echo ""
echo "3️⃣ Recent Logs (Scheduler):"
docker logs redcube3_xhs-content-service-1 2>&1 | grep Scheduler | tail -3

echo ""
echo "4️⃣ Recent Logs (Scraping):"
docker logs redcube3_xhs-content-service-1 2>&1 | grep "SCRAPER\|REDDIT" | tail -3

echo ""
echo "✅ Status check complete!"
```

Make it executable:
```bash
chmod +x check-agent.sh
./check-agent.sh
```

---

## 💡 Pro Tips

1. **Check stats API regularly** - Best way to monitor growth
2. **Set up a cron job** to run `check-agent.sh` hourly
3. **Monitor `todayCount`** - If it stays 0, something's wrong
4. **Check after 2 AM PST** - Daily scraping should have run
5. **Reddit API is FREE** - No need to worry about costs!

---

## 🎯 Next Steps

1. ✅ **[DONE]** Reddit API scraper implemented
2. ✅ **[DONE]** Auto-scraping enabled (600 posts/day)
3. ⏳ **[PENDING]** Refactor IndustrialLandingPage System Status Modal
4. 📋 **[PENDING]** Implement 3-Stage Company-Aware RAG Algorithm
5. 📋 **[PENDING]** Expand Scraping Targets (FAANG + Finance + Startups)

---

**Status**: ✅ Autonomous Agent is ACTIVE and scraping!
**Cost**: $0/month (Reddit API is FREE)
**Collection Rate**: 600 posts/day = 4,200 posts/week
