# "Unknown" Outcome Analysis

**Date**: November 8, 2025
**Context**: User noticed 77.6% of scraped posts are marked as "unknown" outcome

---

## 📊 Current State

### Outcome Distribution (4,660 total posts):
- **Positive**: 542 posts (11.6%) - Clear success signals
- **Negative**: 501 posts (10.8%) - Clear failure signals
- **Unknown**: 3,617 posts (77.6%) ⚠️ - **No clear outcome detected**

### Posts with Embeddings:
- **2,658 posts** have vector embeddings (57.0% of total)
- Used for RAG (Retrieval Augmented Generation) similarity search

---

## 🔍 What is "Unknown" Outcome?

### Detection Logic

The `potential_outcome` field is set during post scraping using **keyword matching** in [redditApiService.js:248-276](../services/content-service/src/services/redditApiService.js#L248-L276):

```javascript
detectOutcome(post) {
  const text = `${post.title} ${post.selftext}`.toLowerCase();

  // Positive signals
  const positiveKeywords = [
    'got offer', 'accepted offer', 'received offer', 'offer accepted',
    'passed', 'passed interview', 'got the job', 'hired',
    'successful', 'success', 'went well', 'positive experience',
    'moving forward', 'next round', 'final round'
  ];

  // Negative signals
  const negativeKeywords = [
    'rejected', 'rejection', 'didn\'t get', 'did not get',
    'failed', 'bombing', 'bombed', 'terrible',
    'ghosted', 'no response', 'heard nothing',
    'bad experience', 'horrible', 'awful'
  ];

  const positiveScore = positiveKeywords.filter(kw => text.includes(kw)).length;
  const negativeScore = negativeKeywords.filter(kw => text.includes(kw)).length;

  if (positiveScore > negativeScore) {
    return { outcome: 'positive', confidence: Math.min(0.9, 0.6 + (positiveScore * 0.1)) };
  } else if (negativeScore > positiveScore) {
    return { outcome: 'negative', confidence: Math.min(0.9, 0.6 + (negativeScore * 0.1)) };
  } else {
    return { outcome: 'unknown', confidence: 0.5 };  // ← 77.6% of posts fall here
  }
}
```

### When Posts Are Marked "Unknown":

1. **No outcome keywords found** - Post doesn't mention success or failure explicitly
2. **Equal positive/negative signals** - Ambiguous posts (rare)
3. **Posts about interview preparation** - Questions, tips, study plans
4. **Posts seeking advice** - "How to prepare for Google interview?"
5. **General discussion** - Salary discussions, career advice, leetcode tips

### Example "Unknown" Posts:

```
1. [leetcode] Looking for Leetcode study partners around 2000 contest rating
2. [leetcode] Off by 1 errors
3. [csMajors] Adobe intern Interview (asking questions, not reporting outcome)
4. [csMajors] Coding Interview IMC (preparation advice)
5. [csMajors] Palantir response after Recruiter Call (waiting for outcome)
```

**All have confidence score**: 0.5 (50%)

---

## ⚠️ Impact on Analysis Quality

### Does "Unknown" Affect RAG Analysis Precision?

**Answer**: **Minimal to No Impact** ✅

Here's why:

### 1. **RAG Retrieval Doesn't Filter by Outcome**

The RAG system retrieves similar posts based on **vector similarity**, not outcome classification.

From [analysisController.js:288-292](../services/content-service/src/controllers/analysisController.js#L288-L292):

```sql
SELECT
  post_id, title, body_text, role_type, level,
  metadata->>'company' as company,
  outcome, tech_stack, frameworks, interview_topics,
  created_at,
  (embedding <=> $1::vector) as distance
FROM scraped_posts
WHERE embedding IS NOT NULL  -- ✅ Only filters by embedding existence
ORDER BY embedding <=> $1::vector  -- ✅ Orders by similarity, NOT outcome
LIMIT $2
```

**No filtering by `potential_outcome`** - all posts with embeddings are eligible.

### 2. **Unknown Posts Still Contain Valuable Information**

Even though they don't report final outcomes, "unknown" posts often contain:

- ✅ **Interview questions** - "I was asked to design Instagram feed ranking"
- ✅ **Technical topics** - "Leetcode hard problems on dynamic programming"
- ✅ **Company-specific insights** - "Google asked about distributed systems"
- ✅ **Role/level information** - "Adobe intern interview", "L5 offer"
- ✅ **Tech stack mentions** - "AWS architecture patterns", "React framework"

These are **highly relevant** for pattern analysis!

### 3. **"Unknown" Posts Are Often High-Quality**

Posts asking questions or sharing preparation strategies often contain:
- Detailed technical content
- Specific company/role mentions
- Interview process insights
- Community discussion with valuable comments

### 4. **Pattern Analysis Filters Strategically**

When generating weekly briefings, the system **does filter** out "unknown" posts:

From [agentService.js:554-556](../services/content-service/src/services/agentService.js#L554-L556):

```javascript
// Get top 3 most relevant posts (by confidence and outcome)
const topPosts = posts
  .filter(p => p.potential_outcome !== 'unknown')  // ✅ Filtered here
  .sort((a, b) => b.confidence_score - a.confidence_score)
  .slice(0, 3)
```

This ensures user-facing summaries focus on **actionable outcomes**.

---

## 📈 Current Usage in Batch Analysis

When you run batch analysis with 3 posts:

### Before Optimization (Old):
- **Seed posts**: 3
- **RAG posts retrieved**: 50 × 3 = 150 posts
- **Expected "unknown" posts**: ~116 (77.6% of 150)
- **Expected "positive/negative"**: ~34 (22.4% of 150)

### After Optimization (Current):
- **Seed posts**: 3
- **RAG posts retrieved**: 20 × 3 = 60 posts
- **Expected "unknown" posts**: ~47 (77.6% of 60)
- **Expected "positive/negative"**: ~13 (22.4% of 60)

### Why This Is Fine:

The pattern analysis in [ragAnalysisService.js](../services/content-service/src/services/ragAnalysisService.js) extracts:

1. **Company mentions** - Extracted from text, not outcome
2. **Role types** - Extracted via NLP, not outcome
3. **Skills/tech stack** - Extracted from content, not outcome
4. **Interview topics** - Extracted from discussion, not outcome
5. **Comparative patterns** - Similarity analysis, not outcome-dependent

**Outcome classification is NOT required** for most insights!

---

## 🎯 When "Unknown" Matters

The `potential_outcome` field is primarily useful for:

### 1. **Weekly Briefings** (Success Stories)
- Filter to show only "positive" outcomes (offers, successes)
- Already implemented in `agentService.js`

### 2. **Success Rate Calculations**
From [agentService.js:521-524](../services/content-service/src/services/agentService.js#L521-L524):

```javascript
const positiveCount = posts.filter(p => p.potential_outcome === 'positive').length;
const negativeCount = posts.filter(p => p.potential_outcome === 'negative').length;
const totalWithOutcome = positiveCount + negativeCount;
const successRate = totalWithOutcome > 0
  ? ((positiveCount / totalWithOutcome) * 100).toFixed(1)
  : 'N/A';
```

**Success rate**: 542 positive / (542 + 501) = **52.0%**

This excludes "unknown" posts, which is correct.

### 3. **User Filtering**
Users can filter scraped posts by outcome via:
```bash
curl 'http://localhost:8080/api/content/agent/scraped-posts?outcome=positive'
curl 'http://localhost:8080/api/content/agent/scraped-posts?outcome=negative'
curl 'http://localhost:8080/api/content/agent/scraped-posts?outcome=unknown'
```

---

## ✅ Conclusion: No Action Needed

### Summary:

1. **77.6% "unknown" is NORMAL** for interview/career discussion forums
   - Most posts are questions, discussions, or preparation tips
   - Not every post reports a final interview outcome

2. **"Unknown" posts are still valuable** for RAG analysis
   - Contains interview questions, topics, companies, roles
   - Similarity matching works regardless of outcome classification

3. **RAG retrieval doesn't filter by outcome**
   - All posts with embeddings are eligible
   - Ranked purely by vector similarity

4. **Outcome filtering is applied where it matters**
   - Weekly briefings (success stories)
   - Success rate calculations
   - User-facing summaries

### Recommendation:

**Keep the current system as-is.** The high "unknown" percentage does NOT reduce analysis quality.

---

## 🔧 Optional Enhancements (Future)

If you want to **reduce** the "unknown" percentage in the future:

### Option 1: Add More Keywords
Expand the keyword lists in `detectOutcome()` to catch more edge cases:
```javascript
positiveKeywords: [
  // ... existing ...
  'advanced to', 'cleared', 'aced', 'nailed',
  'start date', 'signed offer', 'onboarding'
]

negativeKeywords: [
  // ... existing ...
  'withdrawn', 'declined', 'cancelled', 'no longer',
  'passed on', 'silent rejection'
]
```

**Expected improvement**: 77.6% → 70-75% unknown

### Option 2: Use LLM-Based Classification
Replace keyword matching with LLM classification:
```javascript
const prompt = `Classify this post's outcome as positive/negative/unknown:
"${post.title}"

Return JSON: {"outcome": "positive|negative|unknown", "confidence": 0.0-1.0}`;

const classification = await callOpenRouter(prompt);
```

**Expected improvement**: 77.6% → 40-60% unknown
**Cost**: ~$0.0001 per post (~$0.47 for all 4,660 posts)
**Speed impact**: ~2-3 seconds per 10 posts

### Option 3: Hybrid Approach
1. Use keyword matching first (fast, free)
2. If "unknown", use LLM classification for high-engagement posts (upvotes > 10)
3. Cache results to avoid re-classification

**Expected improvement**: 77.6% → 55-65% unknown
**Cost**: Minimal (~$0.10-0.20 total)

---

## 📊 Statistics Snapshot

```json
{
  "total_posts": 4660,
  "outcomes": {
    "positive": 542,    // 11.6% - "Got offer from Google"
    "negative": 501,    // 10.8% - "Rejected after final round"
    "unknown": 3617     // 77.6% - "How to prepare for Meta interview?"
  },
  "posts_with_embeddings": 2658,  // 57.0% ready for RAG
  "success_rate": "52.0%",         // Among posts with known outcomes
  "avg_confidence": 0.54
}
```

**Status**: ✅ System working as designed. No precision issues detected.
