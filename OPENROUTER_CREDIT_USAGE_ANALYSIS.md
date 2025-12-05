# OpenRouter Credit Usage Analysis

## 🔍 Summary

Your OpenRouter credits are being consumed primarily by **AUTOMATED LLM EXTRACTION** that runs every time posts are scraped. This is the biggest cost driver.

---

## 📊 Cost Breakdown (Estimated)

### 1. ⚠️ **AUTOMATIC LLM EXTRACTION** (BIGGEST COST)
**Location:** `services/content-service/src/services/agentService.js:474-704`
- **Function:** `processRelevantPostsWithLLM()`
- **When:** Automatically called after every scraping session
- **Frequency:** Every 30 minutes (when scrapers run)
- **Volume:** Processes up to **50 posts per scraping session**
- **Cost per call:** ~$0.001-0.005 per post (GPT-4o-mini, 5000 max_tokens)
- **Estimated daily cost:** 
  - 50 posts × 48 scraping sessions/day = **2,400 posts/day**
  - 2,400 × $0.003 = **~$7.20/day** or **~$216/month**

**Code Flow:**
```javascript
// In saveScrapedData() - line 465
await processRelevantPostsWithLLM(); // ← AUTOMATIC!

// In processRelevantPostsWithLLM() - line 506
const llmData = await analyzeText(postText); // ← EXPENSIVE!
```

---

### 2. **LLM Filter Service** (Medium Cost)
**Location:** `services/content-service/src/services/llmFilterService.js`
- **Function:** `classifyPostWithLLM()`
- **When:** Called for borderline posts (relevance score 30-60) during scraping
- **Frequency:** Every 30 minutes (when scrapers run)
- **Volume:** Only for borderline posts (maybe 10-20% of scraped posts)
- **Cost per call:** ~$0.0001-0.0003 (DeepSeek, 200 max_tokens)
- **Estimated daily cost:** 
  - 2,400 posts × 15% borderline = 360 posts
  - 360 × $0.0002 = **~$0.07/day** or **~$2/month**

**Code Flow:**
```javascript
// In saveScrapedData() - line 332
if (relevanceScore >= 30 && relevanceScore <= 60 && isLLMAvailable()) {
  const llmResult = await classifyPostWithLLM(post); // ← Called for borderline posts
}
```

---

### 3. **User-Initiated Analysis** (Expected Cost)
**Location:** `services/content-service/src/controllers/analysisController.js`
- **Functions:** `analyzeSinglePost()`, `analyzeBatch()`
- **When:** User clicks "Analyze" in UI
- **Frequency:** User-driven (low volume)
- **Cost per call:** ~$0.001-0.005 per post
- **Estimated daily cost:** Depends on user activity (likely <$1/day)

---

### 4. **AI Assistant** (Low Cost)
**Location:** `services/content-service/src/controllers/assistantController.js`
- **Function:** `queryAssistant()` → `analyzeWithOpenRouter()`
- **When:** User sends messages in AI Assistant
- **Frequency:** User-driven (low volume)
- **Cost per call:** ~$0.0001-0.001 (varies by prompt length)
- **Estimated daily cost:** Depends on user activity (likely <$0.50/day)

---

### 5. **Learning Map Enhancements** (Very Low Cost)
**Location:** `services/content-service/src/services/learningMapEnhancementsService.js`
- **Function:** `analyzeWithOpenRouter()`
- **When:** User generates learning maps
- **Frequency:** User-driven (very low volume)
- **Cost per call:** ~$0.001-0.002
- **Estimated daily cost:** <$0.10/day

---

## 🚨 **ROOT CAUSE: Automatic LLM Extraction Scheduler**

The **biggest cost driver** is the automatic LLM extraction that runs after every scraping session:

```javascript
// services/content-service/src/services/agentService.js:465
async function saveScrapedData(scrapedPosts) {
  // ... save posts ...
  
  // AUTOMATIC LLM EXTRACTION: Process all newly saved is_relevant=true posts
  await processRelevantPostsWithLLM(); // ← THIS IS THE PROBLEM!
}
```

**What it does:**
- After every scraping session (every 30 min), it finds up to 50 new relevant posts
- For each post, it calls `analyzeText()` which uses GPT-4o-mini with 5000 max_tokens
- This happens **automatically** without user interaction

**Why it's expensive:**
- Scrapers run every 30 minutes
- Each session scrapes 500+ posts from 8 Reddit subreddits + HN + Dev.to + Medium
- Even if only 10% are relevant, that's 50+ posts per session
- 48 sessions/day × 50 posts = **2,400 LLM calls/day**

---

## 💡 **Recommendations**

### Option 1: Disable Automatic LLM Extraction (IMMEDIATE FIX)
**Impact:** Saves ~$7/day (~$216/month)
**Action:** Comment out line 465 in `agentService.js`:
```javascript
// await processRelevantPostsWithLLM(); // DISABLED to save OpenRouter credits
```

### Option 2: Reduce Processing Batch Size
**Impact:** Saves ~50% (~$3.60/day)
**Action:** Change limit from 50 to 25 in `processRelevantPostsWithLLM()`:
```javascript
LIMIT 25  // Instead of 50
```

### Option 3: Process Only on Demand
**Impact:** Saves ~$7/day
**Action:** Remove automatic call, add manual trigger endpoint for admins

### Option 4: Use Cheaper Model for Auto-Extraction
**Impact:** Saves ~70% (~$2.16/day)
**Action:** Change `analyzeText()` to use `deepseek/deepseek-chat` instead of `gpt-4o-mini` for auto-extraction

### Option 5: Disable Auto-Scraping Temporarily
**Impact:** Saves all scraping-related costs
**Action:** Set `ENABLE_AUTO_SCRAPING=false` in `.env`

---

## 📈 **Current Scheduler Status**

Based on logs, these schedulers are **ACTIVE**:
- ✅ Scraper: Every 30 min (8 Reddit + HN + Dev.to + Medium)
- ✅ Backfill: Every 2 hours
- ✅ Targeted Scraper: Every 30 min
- ✅ Daily Collection: Every day at 2 AM
- ✅ Embeddings: Every hour
- ✅ Trending Scores: Every hour
- ✅ Benchmark Cache: Daily at 2 AM
- ✅ Weekly Briefings: Every Monday at 9 AM

**Total scraping volume:** ~500 posts × 8 subreddits + 200 HN + 300 Dev.to + 225 Medium = **~4,500 posts every 30 minutes**

Even if only 10% are relevant, that's **450 relevant posts every 30 minutes**, and the auto-LLM extraction processes 50 of them immediately.

---

## 🎯 **Quick Fix (Recommended)**

**Disable automatic LLM extraction immediately:**

1. Edit `services/content-service/src/services/agentService.js`
2. Find line 465: `await processRelevantPostsWithLLM();`
3. Comment it out: `// await processRelevantPostsWithLLM();`
4. Restart content-service: `docker compose restart content-service`

This will save ~$7/day while keeping all other functionality intact. Users can still trigger analysis manually, and you can process posts on-demand later.
