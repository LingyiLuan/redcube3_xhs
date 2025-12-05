# 🚀 Complete LeetCode Integration Plan

**Date:** 2025-11-16
**Objective:** Replace calculated difficulty with LeetCode-matched difficulty for interview questions

---

## Problem Statement

**Current Issue:**
- All questions show 3/5 difficulty (no variation)
- Database stores string difficulty ('easy', 'medium', 'hard') but code expected numeric (1-5)
- Self-reported difficulty is subjective and unreliable

**User Need:**
- Users want to see **LeetCode difficulty** (Easy/Medium/Hard)
- Users want **direct links** to practice on LeetCode
- Difficulty should match the **actual LeetCode problem**, not calculated

---

## Phase 1: Scrape Full LeetCode Database

### Method: LeetCode GraphQL API (Official, Free, No Authentication)

**Endpoint:** `https://leetcode.com/graphql`

**Data Retrieved:**
- ~3185 total questions
- Question ID, title, title_slug
- Difficulty (Easy/Medium/Hard)
- Topic tags (Arrays, Dynamic Programming, etc.)
- Stats (acceptance rate)
- Premium status

### Implementation

**File:** `/services/content-service/src/scripts/scrapeLeetCode.js`

**Key Functions:**
1. `scrapeAllLeetCodeQuestions()` - GraphQL query to fetch all questions
2. `normalizeDifficulty()` - Convert 'Easy'→2, 'Medium'→3, 'Hard'→4
3. `saveLeetCodeQuestions()` - Store in PostgreSQL `leetcode_questions` table
4. `enrichWithCompanyData()` - OPTIONAL: Fetch company tags (slow, 3000+ API calls)

**Database Schema:**
```sql
CREATE TABLE leetcode_questions (
  id SERIAL PRIMARY KEY,
  leetcode_id INTEGER UNIQUE NOT NULL,
  frontend_id INTEGER,
  title TEXT NOT NULL,
  title_slug TEXT UNIQUE NOT NULL,
  difficulty VARCHAR(20) NOT NULL,           -- 'Easy', 'Medium', 'Hard'
  difficulty_numeric INTEGER NOT NULL,       -- 2, 3, 4
  is_premium BOOLEAN DEFAULT FALSE,
  topic_tags JSONB DEFAULT '[]',
  companies JSONB DEFAULT '[]',
  stats JSONB,
  url TEXT,                                  -- https://leetcode.com/problems/{title_slug}/
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Run Command:**
```bash
docker exec -it redcube3_xhs-content-service-1 node /app/src/scripts/scrapeLeetCode.js
```

**Expected Output:**
- ✅ Scraped 3185 LeetCode questions
- 💾 Saved to PostgreSQL (leetcode_questions table)
- 📄 Backup JSON: /app/src/data/leetcode_questions.json

**Time Estimate:** 2-3 minutes

---

## Phase 2: Matching Algorithm

### Hybrid Approach: Text Matching + LLM Fallback

**Strategy:**
1. **Exact Match (30-40%)** - Direct title match, 100% accurate
2. **Keyword Match (30-40%)** - Extract keywords, find best match
3. **Fuzzy Match (10-15%)** - String similarity for typos/variations
4. **Semantic Match (5-10%)** - Embeddings-based (optional, future)
5. **LLM Fallback (5-10%)** - GPT-4 identifies question (expensive, last resort)

**Target Accuracy:** 85-90% total match rate

### Implementation

**File:** `/services/content-service/src/services/leetcodeMatcherService.js`

**Core Function:**
```javascript
async function matchQuestionToLeetCode(questionText, questionType) {
  // Returns: { matched, leetcode_id, title, difficulty, url, confidence, method }
}
```

**Matching Methods:**

1. **Exact Match** (fastest, 100% accurate)
   - Normalize both texts, compare directly
   - SQL: `WHERE LOWER(REPLACE(title, '-', ' ')) = $1`

2. **Keyword Match** (very fast, ~80% accurate)
   - Extract important keywords (nouns, verbs)
   - SQL: `WHERE LOWER(title) LIKE '%keyword1%' AND LOWER(title) LIKE '%keyword2%'`
   - Confidence = % of keywords matched

3. **Fuzzy Match** (fast, handles typos)
   - Use `string-similarity` package
   - Compare extracted text to all LeetCode titles
   - Threshold: 0.75+ confidence

4. **LLM Match** (slowest, most expensive)
   - Use GPT-4o-mini to identify the LeetCode problem
   - Prompt: "Given this question, what's the LeetCode title?"
   - Threshold: 0.65+ confidence

**Dependencies:**
```bash
npm install string-similarity
```

---

## Phase 3: Integration into Question Extraction

### Update Analysis Controller

**File:** `/services/content-service/src/controllers/analysisController.js`

**Changes (around line 1804):**

```javascript
const { matchQuestionToLeetCode } = require('../services/leetcodeMatcherService');

extractedQuestions.forEach(async question => {
  // ✅ NEW: Match question to LeetCode database
  const leetcodeMatch = await matchQuestionToLeetCode(question.text, question.type);

  const questionData = {
    text: question.text,
    company,
    category: question.type,

    // ✅ FIXED: Use LeetCode difficulty if matched
    difficulty: leetcodeMatch.matched
      ? leetcodeMatch.difficulty_numeric
      : convertDifficultyToNumeric(analysis.difficulty, question.type),

    // ✅ NEW: Store LeetCode metadata
    leetcode_id: leetcodeMatch.matched ? leetcodeMatch.leetcode_id : null,
    leetcode_url: leetcodeMatch.matched ? leetcodeMatch.url : null,
    leetcode_title: leetcodeMatch.matched ? leetcodeMatch.title : null,
    match_confidence: leetcodeMatch.confidence || 0,
    match_method: leetcodeMatch.method || 'none',

    // ... rest of fields
  };
});
```

**Database Migration:**
Add new fields to interview questions data structure (stored in JSONB pattern_analysis).

---

## Phase 4: Frontend UI - Clickable LeetCode Links

### Update Question Bank UI

**File:** `/vue-frontend/src/components/ResultsPanel/sections/InterviewQuestionsIntelligenceV1.vue`

**Changes:**

1. **Difficulty Badge Update:**
   - Show "Easy/Medium/Hard" instead of "3/5"
   - Add LeetCode logo badge for matched questions
   - Example: "Easy (LC #1)"

2. **LeetCode Link Button:**
   - Clickable orange button: "Practice on LeetCode →"
   - Opens in new tab
   - Shows match confidence: "95% match"

3. **Visual Design:**
   - LeetCode orange (#FFA116)
   - Hover effects
   - Match confidence indicator

**CSS Additions:**
```css
.leetcode-badge { background: #FFA116; color: white; }
.leetcode-link-btn { background: #FFA116; }
.leetcode-link-btn:hover { background: #FF8C00; }
```

---

## Phase 5: Testing & Validation

### Test Script

**File:** `/services/content-service/src/scripts/testLeetCodeMatching.js`

**Test Cases:**
- "Two Sum" → Should match LeetCode #1 (Easy)
- "Reverse a linked list" → Should match #206 (Easy)
- "Implement an LRU cache" → Should match #146 (Medium)
- "Design Twitter" → Should match #355 (Hard)
- "Median of two sorted arrays" → Should match #4 (Hard)

**Run:**
```bash
docker exec -it redcube3_xhs-content-service-1 node /app/src/scripts/testLeetCodeMatching.js
```

**Success Criteria:**
- 85%+ match rate
- <100ms average matching time (excluding LLM)
- Confidence scores >0.75 for matched questions

---

## Phase 6: Analytics & Monitoring

### SQL Queries

**Match Rate Analysis:**
```sql
-- Overall match statistics
SELECT
  CASE
    WHEN leetcode_id IS NOT NULL THEN 'Matched'
    ELSE 'Unmatched'
  END as match_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM interview_questions
GROUP BY match_status;

-- Matching method breakdown
SELECT
  match_method,
  COUNT(*) as count,
  AVG(match_confidence) as avg_confidence
FROM interview_questions
WHERE leetcode_id IS NOT NULL
GROUP BY match_method
ORDER BY count DESC;

-- Top unmatched questions for manual review
SELECT
  text,
  COUNT(*) as frequency,
  category
FROM interview_questions
WHERE leetcode_id IS NULL
GROUP BY text, category
ORDER BY frequency DESC
LIMIT 20;
```

---

## Implementation Checklist

### **Week 1: Database Setup** ✅
- [ ] Create `scrapeLeetCode.js` script
- [ ] Run scraper to populate `leetcode_questions` table (~3185 questions)
- [ ] Verify data in PostgreSQL
- [ ] Export JSON backup

### **Week 2: Matching Algorithm** 🔄
- [ ] Create `leetcodeMatcherService.js`
- [ ] Implement exact match
- [ ] Implement keyword match
- [ ] Implement fuzzy match
- [ ] Implement LLM fallback (optional)
- [ ] Write unit tests (`testLeetCodeMatching.js`)
- [ ] Run test suite (target: >85% accuracy)

### **Week 3: Backend Integration** 📝
- [ ] Install `string-similarity` package
- [ ] Update `analysisController.js` to call matcher
- [ ] Store LeetCode metadata in question objects
- [ ] Rebuild Docker containers
- [ ] Test end-to-end flow with sample batch

### **Week 4: Frontend UI** 🎨
- [ ] Update Question Bank cards with LeetCode badges
- [ ] Add clickable LeetCode links
- [ ] Add match confidence indicators
- [ ] Update difficulty display (Easy/Medium/Hard)
- [ ] Test UI in browser (Chrome, Firefox, Safari)

### **Week 5: Monitoring & Optimization** 📊
- [ ] Add analytics queries
- [ ] Review unmatched questions (top 20)
- [ ] Manually map top unmatched questions
- [ ] Optimize matching algorithm based on results
- [ ] Document matching accuracy metrics

---

## Expected Results

### Match Rate Targets
- **Exact match:** 30-40% of questions
- **Keyword match:** 30-40% of questions
- **Fuzzy match:** 10-15% of questions
- **LLM fallback:** 5-10% of questions
- **Total matched:** 85-90% of questions

### User Experience Improvements
**Before:**
```
Question: "Two Sum"
Difficulty: 3/5
Source: Reddit post
```

**After:**
```
Question: "Two Sum"
Difficulty: Easy (LeetCode #1)
Practice: [Practice on LeetCode →]
Match: 98% confidence
Source: Reddit post by u/username
```

### Performance Targets
- **Scraping time:** 2-3 minutes (one-time)
- **Matching time:** <100ms per question (avg)
- **Storage:** ~2MB for 3185 questions
- **Cost:** Nearly free (LLM fallback ~$0.001 per call)

---

## Cost Estimate

| Item | Cost |
|------|------|
| LeetCode Scraping | Free (public API) |
| Storage (3185 questions) | ~2MB (negligible) |
| LLM Matching (10% of questions) | ~$0.10 per batch |
| **Total per batch** | **~$0.10** |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ LEETCODE INTEGRATION FLOW                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. SCRAPING (One-time)                                          │
│     LeetCode GraphQL API                                         │
│            ↓                                                      │
│     leetcode_questions table (3185 rows)                         │
│                                                                   │
│  2. QUESTION EXTRACTION (Runtime)                                │
│     Reddit Post → AI Extract → "Two Sum"                         │
│            ↓                                                      │
│     leetcodeMatcherService.matchQuestionToLeetCode()             │
│            ↓                                                      │
│     Try: Exact → Keyword → Fuzzy → LLM                          │
│            ↓                                                      │
│     Return: {matched, leetcode_id, url, difficulty, confidence}  │
│                                                                   │
│  3. STORAGE (Pattern Analysis)                                   │
│     Store in question object:                                    │
│     {                                                             │
│       text: "Two Sum",                                           │
│       difficulty: 2,           // From LeetCode (Easy)           │
│       leetcode_id: 1,                                            │
│       leetcode_url: "https://leetcode.com/problems/two-sum/",   │
│       match_confidence: 0.98,                                    │
│       match_method: "exact"                                      │
│     }                                                             │
│                                                                   │
│  4. FRONTEND DISPLAY                                             │
│     Question Card:                                               │
│     ┌─────────────────────────────────┐                         │
│     │ Two Sum                          │                         │
│     │ Difficulty: Easy (LC #1) 🟢     │                         │
│     │ [Practice on LeetCode →]         │                         │
│     │ 98% match                        │                         │
│     └─────────────────────────────────┘                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

### Quantitative
- ✅ 85%+ questions matched to LeetCode
- ✅ <100ms average matching time
- ✅ <5% false positives (wrong matches)
- ✅ 95%+ user click-through rate on LeetCode links

### Qualitative
- ✅ Users trust difficulty ratings (standardized to LeetCode)
- ✅ Users can immediately practice matched questions
- ✅ Difficulty distribution shows real variation (not all 3/5)
- ✅ System is deterministic (same question = same match)

---

## Future Enhancements

1. **Semantic Matching with Embeddings**
   - Generate embeddings for all LeetCode questions
   - Use pgvector similarity search
   - Improve match rate to 95%+

2. **Company Tag Integration**
   - Show "Asked by Google, Amazon, Meta" on question cards
   - Requires company data scraping (slow, 3000+ API calls)

3. **Difficulty Calibration**
   - Track user success rates per question
   - Adjust difficulty based on actual outcomes
   - "This Easy question has 30% success rate → might be Medium"

4. **Question Similarity**
   - "Similar questions: 3Sum, 4Sum, Two Sum II"
   - Help users practice related problems

5. **Admin UI for Manual Matching**
   - Review unmatched questions
   - Manually map to LeetCode
   - Improve matching algorithm over time

---

## Related Files

### Backend
- `/services/content-service/src/scripts/scrapeLeetCode.js` (NEW)
- `/services/content-service/src/scripts/testLeetCodeMatching.js` (NEW)
- `/services/content-service/src/services/leetcodeMatcherService.js` (NEW)
- `/services/content-service/src/controllers/analysisController.js` (MODIFIED)
- `/services/content-service/src/data/leetcode_questions.json` (NEW - backup)

### Frontend
- `/vue-frontend/src/components/ResultsPanel/sections/InterviewQuestionsIntelligenceV1.vue` (MODIFIED)

### Database
- `leetcode_questions` table (NEW)
- `interview_questions` pattern_analysis JSONB (MODIFIED - add leetcode fields)

### Documentation
- `/docs/LEETCODE_INTEGRATION_PLAN.md` (THIS FILE)

---

## References

- LeetCode GraphQL Explorer: https://leetcode.com/graphql
- LeetCode Problems List: https://leetcode.com/problemset/all/
- String Similarity NPM: https://www.npmjs.com/package/string-similarity
- Our RAG System: Uses similar embedding-based matching for posts
- Our Interview Questions Extraction: `extractInterviewQuestions()` in analysisController.js

---

**Next Steps:** Start with Phase 1 (Scraper Implementation)
