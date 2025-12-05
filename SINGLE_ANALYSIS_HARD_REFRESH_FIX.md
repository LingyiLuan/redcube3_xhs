# Single Analysis Hard Refresh 404 Fix

## Problem Statement

After hard refresh, clicking "View Report" for a single analysis results in:
```
GET /api/content/batch/report/analysis-373 [HTTP/1.1 404 Not Found]
❌ API Error: 404 /batch/report/analysis-373
```

The report is also missing from the left sidebar.

## Root Cause Analysis

### 1. **Single Analysis is NOT Persisted to Backend Cache**

**Evidence from code:**

**Backend** (`analysisController.js` line 22-236):
- Single analysis saves to `analysis_results` table (line 47)
- Returns response directly (line 227)
- Does NOT save to `batch_analysis_cache` table
- Does NOT cache in Redis

**Batch analysis** (`analysisController.js` line 245-260):
- Saves to `batch_analysis_cache` table
- Caches in Redis with key `batch:${batchId}`
- Can be retrieved later via `/batch/report/:batchId`

### 2. **Frontend Store Only Loads Batch Analyses**

**Evidence from reportsStore.ts** (line 207-255):

```typescript
async function fetchReportsFromBackend() {
  // Line 219: Only fetches from /history endpoint
  const response = await fetch(`/api/content/history?userId=${authStore.userId}&limit=100`)

  // Line 238: Marks ALL as 'batch' if batch_id exists
  result: {
    ...analysis,
    type: analysis.batch_id ? 'batch' : 'single'
  }
}
```

**Backend** (`analysisQueries.js` line 49-115):

```javascript
async function getAnalysisHistory(userId, limit = 10, batchId = null) {
  // Line 52: ONLY queries batch_analysis_cache
  let query = 'SELECT * FROM batch_analysis_cache';

  // DOES NOT query analysis_results table for single analyses!
}
```

### 3. **The Complete Flow (What Happens)**

#### Successful Analysis (Before Hard Refresh)
1. User runs single analysis
2. Backend returns analysis with `id: 373`
3. Frontend creates report: `reportId: "report-373"`, `type: 'single'`
4. Report added to reportsStore in memory ✅
5. Report appears in sidebar ✅
6. Clicking "View Report" works (data in memory) ✅

#### After Hard Refresh
1. Browser reloads, reportsStore resets to empty array
2. reportsStore.initialize() calls fetchReportsFromBackend()
3. Backend queries `batch_analysis_cache` ONLY
4. Single analysis (id: 373) is NOT in batch_analysis_cache (it's in analysis_results)
5. reportsStore.reports = [] (empty, no single analyses loaded)
6. User navigates to `/reports/report-373`
7. ReportViewer looks for report with id: "report-373"
8. Report not found in store ❌
9. **BUG HERE:** ReportViewer tries to fetch from backend using wrong logic

#### The Frontend Fetch Logic Bug

**ReportViewer.vue** (line 271-295):

```typescript
// Line 272: Check if single analysis
const isSingleAnalysis = report.value?.result?.type === 'single'

// Line 275-279: Check if needs fetch
const needsFetch = !report.value ||
                   (!isSingleAnalysis && (
                     !report.value.result?.pattern_analysis ||
                     !report.value.result?.enhanced_intelligence
                   ))

// Line 281: WRONG - This doesn't run because report.value is undefined
if (needsFetch && props.reportId && !isSingleAnalysis) {
  const batchId = extractBatchId(props.reportId)
  await fetchReportFromBackend(batchId)
}
```

**The Logic Error:**
- `report.value` is `undefined` (not in store)
- `isSingleAnalysis = undefined?.result?.type === 'single'` → `false`
- `needsFetch = !undefined || ...` → `true`
- Condition `!isSingleAnalysis` → `true` (because it's false/undefined, not 'single')
- **Result: Tries to fetch single analysis from batch cache endpoint!**

---

## Solution

### Two Required Fixes:

### Fix 1: Load Single Analyses from Backend on Store Initialization

**Option A: Modify `getAnalysisHistory()` to Query Both Tables**

```javascript
// analysisQueries.js
async function getAnalysisHistory(userId, limit = 10, batchId = null) {
  // Query 1: Batch analyses from batch_analysis_cache
  const batchQuery = `
    SELECT
      batch_id as id,
      batch_id,
      data,
      cached_at as created_at,
      'batch' as analysis_type
    FROM batch_analysis_cache
    ORDER BY cached_at DESC
    LIMIT $1
  `;

  const batchResult = await pool.query(batchQuery, [limit]);

  // Query 2: Single analyses from analysis_results
  const singleQuery = `
    SELECT
      id,
      original_text,
      company,
      role,
      outcome,
      difficulty_level,
      created_at,
      user_id,
      'single' as analysis_type
    FROM analysis_results
    WHERE user_id = $1 AND batch_id IS NULL
    ORDER BY created_at DESC
    LIMIT $2
  `;

  const singleResult = await pool.query(singleQuery, [userId, limit]);

  // Combine and return both
  return {
    batch: batchResult.rows,
    single: singleResult.rows
  };
}
```

**Option B: Create Separate Endpoint for Single Analysis History**

```javascript
// New endpoint: GET /api/content/single-analysis/history?userId=X
router.get('/single-analysis/history', optionalAuth, getSingleAnalysisHistory);

async function getSingleAnalysisHistory(req, res) {
  const userId = req.user?.id || req.query.userId;
  const limit = parseInt(req.query.limit) || 100;

  const query = `
    SELECT
      id,
      original_text,
      company,
      role,
      outcome,
      difficulty_level,
      created_at
    FROM analysis_results
    WHERE user_id = $1 AND batch_id IS NULL
    ORDER BY created_at DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [userId, limit]);
  res.json(result.rows);
}
```

### Fix 2: Prevent Wrong Endpoint Call in ReportViewer

**ReportViewer.vue** - Fix the detection logic:

```typescript
// BEFORE (WRONG):
const isSingleAnalysis = report.value?.result?.type === 'single'

// AFTER (CORRECT):
// Detect from reportId format instead of report data
const isSingleAnalysis = computed(() => {
  // If report exists in store, check its type
  if (report.value?.result?.type) {
    return report.value.result.type === 'single'
  }

  // If report NOT in store, infer from reportId format
  // Batch: "report-batch_123_abc"
  // Single: "report-373" (just a number)
  const idWithoutPrefix = props.reportId.replace('report-', '')
  return !idWithoutPrefix.startsWith('batch_')
})

// Then in onMounted:
onMounted(async () => {
  await waitForStoreToLoad()

  if (!report.value) {
    // Report not found after store loaded
    if (isSingleAnalysis.value) {
      // Don't try to fetch single analysis from batch endpoint
      console.warn('[ReportViewer] Single analysis report not found, cannot fetch')
      fetchError.value = 'This analysis is no longer available after page refresh.'
    } else {
      // Try to fetch batch report
      const batchId = extractBatchId(props.reportId)
      await fetchReportFromBackend(batchId)
    }
  }
})
```

---

## Implementation Plan

### Phase 1: Backend - Add Single Analysis History Endpoint ✅

1. Create new route: `GET /api/content/single-analysis/history`
2. Query `analysis_results` table for user's single analyses
3. Return array of single analysis metadata

### Phase 2: Frontend - Fetch Single Analyses on Store Init ✅

1. Modify `reportsStore.fetchReportsFromBackend()`:
   - Fetch batch analyses from `/history`
   - Fetch single analyses from `/single-analysis/history`
   - Merge both into reports array

2. Ensure proper type marking:
   - Batch: `type: 'batch'`
   - Single: `type: 'single'`

### Phase 3: Frontend - Fix ReportViewer Detection Logic ✅

1. Change `isSingleAnalysis` to use reportId format
2. Don't try to fetch single analyses from batch endpoint
3. Show helpful error message instead

---

## Alternative: Simpler localStorage-Only Approach

**Pros:**
- No backend changes needed
- Single analyses already work before refresh

**Cons:**
- Doesn't solve the core problem (reports lost after refresh)
- Poor UX (users lose analysis history)
- Doesn't match batch analysis behavior

**Verdict:** NOT RECOMMENDED - Backend persistence is the right solution

---

## Testing Plan

### Test Case 1: Fresh Single Analysis
1. Run single analysis
2. Verify report appears in sidebar
3. Click "View Report" - should work ✅
4. Hard refresh browser
5. **Verify:** Report still in sidebar ✅
6. Click "View Report" - should work ✅

### Test Case 2: Multiple Single Analyses
1. Run 3 single analyses
2. Hard refresh
3. **Verify:** All 3 reports in sidebar ✅

### Test Case 3: Mixed Batch + Single
1. Run 2 batch analyses
2. Run 2 single analyses
3. Hard refresh
4. **Verify:** All 4 reports in sidebar (2 batch + 2 single) ✅

### Test Case 4: Wrong Endpoint Not Called
1. Run single analysis
2. Hard refresh
3. Navigate to report URL
4. **Verify:** No 404 error for `/batch/report/analysis-XXX` ✅
5. **Verify:** Either loads successfully OR shows helpful error ✅

---

## Success Criteria

- ✅ Single analyses saved to `analysis_results` table
- ✅ Single analyses loaded from backend on store init
- ✅ Single analyses appear in sidebar after hard refresh
- ✅ Clicking "View Report" works after hard refresh
- ✅ No 404 errors from wrong endpoint calls
- ✅ Batch analyses continue working as before
- ✅ reportsStore correctly handles both types
