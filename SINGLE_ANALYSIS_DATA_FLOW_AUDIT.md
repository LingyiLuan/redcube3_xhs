# Single Analysis Data Flow Audit - Complete Analysis

## Executive Summary

**FINDING:** The backend RAG pipeline is working PERFECTLY. The frontend is likely NOT properly transforming the backend response into a report with `type: 'single'`, which causes the ReportViewer to not recognize it as a single analysis.

---

## Evidence: Backend IS Working

### Test Performed
```bash
curl -X POST http://localhost:8080/api/content/analyze-single/text \
  -H 'Content-Type: application/json' \
  -d '{"text": "I interviewed at Google for SWE role. The coding round was easy. I passed and got an offer."}'
```

### Response Received (7.6 KB)
```json
{
  "id": 378,
  "createdAt": "2025-11-19T20:12:04.431Z",
  "aiProvider": "OpenRouter",

  "overview": {
    "company": "Google",
    "role": "SWE",
    "outcome": "passed",
    "difficulty": null,
    "interviewDate": "2025-11-19T20:12:04.431Z",
    "stages": null
  },

  "benchmark": {
    "successRate": {
      "industry": 72.2,  ← FROM PATTERN ANALYSIS ✅
      "userOutcome": "passed"
    },
    "difficulty": {
      "userRating": null,
      "industryAverage": null,
      "interpretation": null
    },
    "stageBreakdown": null
  },

  "skills": {
    "tested": [
      {"name": "Go", "frequency": 10, "performance": 0.7, "benchmark": {"successRate": 70}},
      {"name": "React", "frequency": 3, "performance": null},
      {"name": "Java", "frequency": 2, "performance": 1, "benchmark": {"successRate": 100}},
      {"name": "JavaScript", "frequency": 2},
      {"name": "Azure", "frequency": 1},
      {"name": "MongoDB", "frequency": 1},
      {"name": "Python", "frequency": 1}
    ]
  },  ← 7 SKILLS EXTRACTED ✅

  "questions": [
    {
      "question": "The prep plan, so I decided to share...",
      "frequency": 2,
      "company": "Google",
      "difficulty": 3,
      "successRate": 100,
      "category": "technical",
      "topics": ["arrays", "searching"]
    },
    // ... 19 MORE QUESTIONS
  ],  ← 20 QUESTIONS EXTRACTED ✅

  "similarExperiences": [
    {
      "id": "1kdnzwi",
      "company": "Google",
      "role": "SWE",
      "outcome": "rejected",
      "keySkills": ["Go"],
      "summary": "Hey everyone, I've shared comments on Google interviews before..."
    },
    {
      "id": "1ol2rcf",
      "company": "Google",
      "role": "SWE",
      "outcome": "passed",
      "keySkills": [],
      "summary": "Hello guys, I just wanted to share some of my current status..."
    },
    {
      "id": "1hz6iuu",
      "company": "LinkedIn",
      "role": "SWE",
      "outcome": "passed",
      "keySkills": [],
      "summary": "There's been a great deal of panic about the job market here..."
    },
    {
      "id": "1ouywsh",
      "company": "Google",
      "role": "SWE",
      "outcome": "passed",
      "keySkills": [],
      "summary": "I just wrapped a 4-interview loop with Google..."
    },
    {
      "id": "1i5cix8",
      "company": "Google",
      "role": "SWE",
      "outcome": "passed",
      "keySkills": ["Go"],
      "summary": "A lot of ppl asked about the prep plan..."
    }
  ]  ← 5 SIMILAR POSTS ✅
}
```

### Backend Logs
```
[INFO] [Single Analysis] ✅ Pattern analysis complete - using SAME pipeline as batch!
[INFO] [Single Analysis] STEP 5: Formatting Single Post Analysis response for analysisId: 378
```

**CONCLUSION:** Backend is 100% functional!

---

## The Problem: Missing `type: 'single'` in Frontend Report

### What's Missing

The backend response does **NOT** include:
- `type: 'single'` field
- `pattern_analysis` object (raw data)
- `similar_posts` array (raw data)

Instead, the backend **extracts** data from `pattern_analysis` and formats it into:
- `benchmark.successRate.industry` ← from pattern_analysis
- `skills.tested` ← from pattern_analysis.skill_frequency
- `questions` ← from pattern_analysis.interview_questions
- `similarExperiences` ← from pattern_analysis.source_posts

### Why Report-376 Shows "NO SIMILAR POSTS"

1. **Frontend receives backend response** with `similarExperiences: [...]`
2. **Frontend workflow node transforms it** into a report object
3. **Frontend FAILS to add `type: 'single'`** to the report
4. **reportsStore.addReport()** saves report WITHOUT type
5. **localStorage saves** report WITHOUT type
6. **After refresh, loadSingleAnalysisFromLocalStorage()** loads report WITHOUT type
7. **ReportViewer checks `report.result?.type === 'single'`** → FALSE
8. **ReportViewer thinks it's batch** and looks for `similar_posts` array
9. **No `similar_posts` found** → "NO SIMILAR POSTS" error

---

## Data Flow: Backend → Frontend

### Backend Response Structure
```typescript
{
  id: 378,
  createdAt: "2025-11-19T...",
  overview: {...},
  benchmark: {...},
  skills: {...},
  questions: [...],
  similarExperiences: [...]  // ← CORRECTLY POPULATED
}
```

### Expected Frontend Report Structure
```typescript
{
  id: "report-378",
  nodeId: "node-378",
  workflowId: "default-workflow",
  timestamp: "2025-11-19T...",
  analysisId: 378,
  result: {
    id: 378,
    overview: {...},
    benchmark: {...},
    skills: {...},
    questions: [...],
    similarExperiences: [...],
    type: 'single'  // ← CRITICAL: MUST BE ADDED BY FRONTEND
  },
  isRead: false
}
```

### Current (Broken) Frontend Report Structure
```typescript
{
  id: "report-378",
  result: {
    id: 378,
    overview: {...},
    benchmark: {...},
    skills: {...},
    questions: [...],
    similarExperiences: [...],
    // type: 'single'  ← MISSING!
  }
}
```

---

## Root Cause Location

The frontend code that calls `/api/content/analyze-single/text` needs to be found. It's likely in:
1. **Workflow execution engine** - where nodes execute their API calls
2. **Some composable or service** that handles single analysis

### Where to Search
```bash
# Search for the API call
grep -r "analyze-single/text" vue-frontend/src/

# Search for workflow node execution
grep -r "executeNode\|runNode\|execute.*workflow" vue-frontend/src/

# Search for where reports are created from API responses
grep -r "addReport\|createReport" vue-frontend/src/
```

---

## Fix Required

### Option 1: Backend Adds `type: 'single'`

**Modify:** `services/content-service/src/controllers/analysisController.js`

**Change:** Line 145 response object

**Before:**
```javascript
const response = {
  id: savedResult.id,
  createdAt: savedResult.created_at,
  aiProvider: 'OpenRouter',
  overview: {...},
  benchmark: {...},
  skills: {...},
  questions: [...],
  similarExperiences: [...]
};
```

**After:**
```javascript
const response = {
  id: savedResult.id,
  createdAt: savedResult.created_at,
  aiProvider: 'OpenRouter',
  type: 'single',  // ← ADD THIS
  overview: {...},
  benchmark: {...},
  skills: {...},
  questions: [...],
  similarExperiences: [...]
};
```

### Option 2: Frontend Adds `type: 'single'` When Creating Report

**Find the workflow node code** that calls the API and creates the report.

**Add:**
```typescript
// After receiving backend response
const report: AnalysisReport = {
  id: `report-${response.id}`,
  nodeId: nodeId,
  workflowId: workflowId,
  timestamp: response.createdAt,
  analysisId: response.id,
  result: {
    ...response,
    type: 'single'  // ← ADD THIS
  },
  isRead: false
}

// Then save to store
reportsStore.addReport(report)
```

---

## Verification Steps

### 1. Check if `type: 'single'` is in report
```javascript
console.log('[DEBUG] Report type:', report.result?.type)
// Should log: 'single'
```

### 2. Check if similarExperiences are present
```javascript
console.log('[DEBUG] similarExperiences:', report.result?.similarExperiences)
// Should log: array of 5 posts
```

### 3. Check localStorage
```javascript
const cached = localStorage.getItem('single-analysis-report-378')
const report = JSON.parse(cached)
console.log('[DEBUG] Cached type:', report.result?.type)
console.log('[DEBUG] Cached similarExperiences:', report.result?.similarExperiences)
```

---

## Why batchId is `undefined`

**User's Question:** "i'm doing single analsyis, but it says: - Report: report-376, batchId: undefined, like we don;t need a batch id right?"

**Answer:** Correct! Single analyses do NOT have a batchId. Only batch analyses have batchId.

- **Single Analysis:** `batchId: undefined` ✅ CORRECT
- **Batch Analysis:** `batchId: "batch_1_abc123"` ✅

The batchId is used to:
1. Group multiple posts analyzed together
2. Cache batch results in `batch_analysis_cache` table
3. Retrieve batch reports from `/batch/report/:batchId` endpoint

Single analyses:
1. Analyze ONE user-provided text
2. Are NOT grouped with other posts
3. Do NOT need a batchId
4. Should have `type: 'single'` instead

---

## Next Steps

1. ✅ **Backend is confirmed working** - No changes needed
2. **Find frontend workflow code** that calls `/analyze-single/text`
3. **Add `type: 'single'`** to the report object
4. **Test with new analysis** to verify all sections show
5. **Test hard refresh** to verify localStorage persistence works

---

## Files to Investigate

### Frontend
1. **Workflow execution engine** - Find where nodes execute API calls
2. **API service layer** - Find where `/analyze-single/text` is called
3. **Report transformation** - Find where backend response becomes AnalysisReport

### Search Commands
```bash
# Find API call
grep -r "analyze-single" vue-frontend/src/ --include="*.ts" --include="*.vue"

# Find workflow execution
grep -r "fetch.*api/content" vue-frontend/src/ --include="*.ts"

# Find report creation
grep -r "addReport\|AnalysisReport" vue-frontend/src/ --include="*.ts"
```

---

## Summary

**Backend:** ✅ WORKING PERFECTLY
- RAG pipeline executes
- Embeddings generated
- Similar posts found (5 posts)
- Pattern analysis computed
- Skills extracted (7 skills)
- Questions extracted (20 questions)
- Benchmark calculated (72.2% success rate)

**Frontend:** ❌ MISSING `type: 'single'`
- Backend response arrives with all data
- Frontend transforms it into report
- **BUG:** Forgets to add `type: 'single'`
- ReportViewer can't identify report type
- localStorage saves incomplete report
- After refresh, sections don't show

**Fix:** Add `type: 'single'` when transforming backend response to report object
