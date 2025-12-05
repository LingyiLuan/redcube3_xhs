# Complete Determinism Test - End-to-End Audit

**Date**: November 13, 2025
**Status**: 🔧 READY FOR TESTING

---

## Changes Applied

### Backend (✅ Deployed)
**File:** `services/content-service/src/controllers/analysisController.js`

```javascript
// Lines 1-11: Added crypto import
const crypto = require('crypto');

// Lines 107-116: Deterministic batchId generation
const contentHash = crypto
  .createHash('sha256')
  .update(posts.map(p => p.text).sort().join('|'))
  .digest('hex')
  .substring(0, 16);
const batchId = `batch_${userId}_${contentHash}`;

logger.info(`[Batch Analysis] Generated deterministic batchId: ${batchId}`);
```

**What this does:**
- Same posts → Same SHA-256 hash → Same batchId
- Includes userId to prevent cross-user cache leakage
- No more `Date.now()` or `Math.random()`

### Frontend (✅ Updated)
**File:** `vue-frontend/src/components/Nodes/AnalysisNode.vue`

**BEFORE (Line 133):**
```javascript
const batchId = result.batchId || `batch-${Date.now()}`  // ❌ Random fallback!
```

**AFTER (Lines 134-141):**
```javascript
const batchId = result.batchId  // ✅ Use backend's deterministic batchId

if (!batchId) {
  console.error('[AnalysisNode] ERROR: Backend did not return batchId!', result)
  throw new Error('Backend did not return batchId - this should never happen')
}

console.log('[AnalysisNode] ✅ Using backend deterministic batchId:', batchId)
```

**What this does:**
- No more random fallback
- Always uses backend's content-based batchId
- Errors if backend fails to provide batchId (fail-fast)

---

## Complete Data Flow Audit

### 1. Workflow Execution
**File:** `vue-frontend/src/stores/workflowStore.ts:571-644`

```typescript
async function executeBatchAnalysis(inputNodes: WorkflowNode[]) {
  const posts = inputNodes.map(node => ({
    id: node.id,
    text: node.data.content || ''
  }))

  const batchResult = await analysisService.analyzeBatch(...)

  return {
    ...
    batchId: batchResult.batchId // ← Includes backend's batchId
  }
}
```

**Status:** ✅ Correct - passes backend batchId through

### 2. Backend Processing
**File:** `services/content-service/src/controllers/analysisController.js:95-268`

```javascript
async function analyzeBatchPosts(req, res) {
  const { posts } = value;

  // Generate deterministic batchId
  const contentHash = crypto.createHash('sha256')
    .update(posts.map(p => p.text).sort().join('|'))
    .digest('hex')
    .substring(0, 16);
  const batchId = `batch_${userId}_${contentHash}`;

  // Check cache
  const cachedData = await getCachedBatchData(batchId);

  if (cachedData && cachedData.patternAnalysis) {
    // CACHE HIT: Return cached data
    return res.json({
      ...result,
      batchId: batchId
    });
  } else {
    // CACHE MISS: Generate analysis
    patternAnalysis = await computeMultiPostPatterns(...);
    await saveBatchCache(batchId, userPostEmbeddings, patternAnalysis, ...);

    return res.json({
      ...result,
      batchId: batchId
    });
  }
}
```

**Status:** ✅ Correct - returns batchId in response

### 3. Analysis Node Creates Report
**File:** `vue-frontend/src/components/Nodes/AnalysisNode.vue:119-163`

```typescript
const result = await workflowStore.executeBatchAnalysis(validNodes)

const batchId = result.batchId // ← From backend

const reportData = {
  id: `report-${batchId}`, // ← Use batchId as report ID
  batchId: batchId,
  result: {
    ...result,
    pattern_analysis: result.pattern_analysis,
    individual_analyses: result.individual_analyses
  }
}

reportsStore.addReport(reportData) // ← Save to localStorage
```

**Status:** ✅ Correct - uses backend batchId, saves to localStorage

### 4. Report Viewer Loads Report
**File:** `vue-frontend/src/components/ResultsPanel/ReportViewer.vue:189-202`

```typescript
onMounted(async () => {
  if (report.value?.batchId) {
    console.log('[ReportViewer] Report found locally, fetching from backend cache')
    await fetchReportFromBackend(report.value.batchId)
  }
})

async function fetchReportFromBackend(batchId: string) {
  const cachedReport = await analysisService.getCachedBatchReport(batchId)

  reportsStore.addReport({
    id: `batch-${batchId}`,
    batchId: batchId,
    result: {
      pattern_analysis: cachedReport.pattern_analysis,
      individual_analyses: cachedReport.individual_analyses
    }
  })
}
```

**Status:** ✅ Correct - fetches from backend cache using same batchId

### 5. Backend Returns Cached Data
**File:** `services/content-service/src/controllers/analysisController.js:336-384`

```javascript
async function getCachedBatchReport(req, res) {
  const { batchId } = req.params;

  const cachedData = await getCachedBatchData(batchId);

  if (!cachedData) {
    return res.status(404).json({ message: 'No cached report found' });
  }

  return res.json({
    batchId: batchId,
    pattern_analysis: cachedData.patternAnalysis,
    individual_analyses: individualAnalyses
  });
}
```

**Status:** ✅ Correct - returns cached data for same batchId

---

## Expected Flow (Same 3 Posts)

### First Execution

1. **User runs workflow with posts A, B, C**
   - Frontend sends: `{posts: [{text: "A"}, {text: "B"}, {text: "C"}]}`

2. **Backend generates batchId**
   - `contentHash = SHA256("A|B|C") = "a3f9c2e4b1d8e7f5"`
   - `batchId = "batch_1_a3f9c2e4b1d8"`
   - Logs: `[Batch Analysis] Generated deterministic batchId: batch_1_a3f9c2e4b1d8`

3. **Backend checks cache**
   - `getCachedBatchData("batch_1_a3f9c2e4b1d8")` → MISS (first time)
   - Logs: `[Cache MISS] Generating new analysis for batch batch_1_a3f9c2e4b1d8`

4. **Backend generates analysis**
   - Generates embeddings
   - Retrieves RAG posts
   - Computes pattern_analysis
   - Saves to cache: `saveBatchCache("batch_1_a3f9c2e4b1d8", ...)`
   - Logs: `[Cache SAVE] Saved cache for batch batch_1_a3f9c2e4b1d8`

5. **Backend returns response**
   ```json
   {
     "batchId": "batch_1_a3f9c2e4b1d8",
     "pattern_analysis": { ... },
     "individual_analyses": [ ... ]
   }
   ```

6. **Frontend creates report**
   - AnalysisNode receives batchId: `"batch_1_a3f9c2e4b1d8"`
   - Creates report: `id: "report-batch_1_a3f9c2e4b1d8"`
   - Saves to localStorage
   - Logs: `[AnalysisNode] ✅ Using backend deterministic batchId: batch_1_a3f9c2e4b1d8`

7. **User views report**
   - Report displays with scatter plot dots at positions (1,2), (3,4), (5,6)

### Second Execution (SAME posts A, B, C)

1. **User runs workflow AGAIN with posts A, B, C**
   - Frontend sends: `{posts: [{text: "A"}, {text: "B"}, {text: "C"}]}`

2. **Backend generates batchId**
   - `contentHash = SHA256("A|B|C") = "a3f9c2e4b1d8e7f5"` ← SAME HASH!
   - `batchId = "batch_1_a3f9c2e4b1d8"` ← SAME ID!
   - Logs: `[Batch Analysis] Generated deterministic batchId: batch_1_a3f9c2e4b1d8`

3. **Backend checks cache**
   - `getCachedBatchData("batch_1_a3f9c2e4b1d8")` → HIT! ✅
   - Logs: `[Cache HIT] Using cached pattern_analysis for batch batch_1_a3f9c2e4b1d8`

4. **Backend returns cached data** (no regeneration!)
   ```json
   {
     "batchId": "batch_1_a3f9c2e4b1d8",
     "pattern_analysis": { ... }, // ← SAME data from cache
     "individual_analyses": [ ... ] // ← SAME data from cache
   }
   ```

5. **Frontend creates report**
   - AnalysisNode receives SAME batchId: `"batch_1_a3f9c2e4b1d8"`
   - Creates report: `id: "report-batch_1_a3f9c2e4b1d8"` ← SAME ID!
   - **localStorage already has this report** → Updates it
   - Logs: `[AnalysisNode] ✅ Using backend deterministic batchId: batch_1_a3f9c2e4b1d8`

6. **User views report**
   - Report displays IDENTICAL data
   - Scatter plot dots at SAME positions (1,2), (3,4), (5,6) ✅

### Page Refresh

1. **User refreshes browser**
   - localStorage persists: `report-batch_1_a3f9c2e4b1d8`

2. **ReportViewer loads**
   - Finds report in localStorage
   - `batchId = "batch_1_a3f9c2e4b1d8"`
   - Logs: `[ReportViewer] Report found locally, fetching from backend cache`

3. **Frontend fetches from backend**
   - `GET /api/content/batch/report/batch_1_a3f9c2e4b1d8`

4. **Backend returns cached data**
   - Logs: `[Cache HIT] Retrieved cached data for batch batch_1_a3f9c2e4b1d8`
   - Returns SAME pattern_analysis from cache

5. **Report displays**
   - Scatter plot dots at SAME positions (1,2), (3,4), (5,6) ✅
   - All data IDENTICAL

---

## Testing Instructions

### Test 1: Console Log Verification

**Open browser DevTools → Console**

Run workflow and look for these logs:

**Backend (check Docker logs):**
```bash
docker logs redcube3_xhs-content-service-1 --tail 100 -f
```

Expected:
```
[Batch Analysis] Generated deterministic batchId: batch_1_XXXXXXXXXXXXXXXX
[Cache MISS] Generating new analysis for batch batch_1_XXXXXXXXXXXXXXXX
[Cache SAVE] Saved cache for batch batch_1_XXXXXXXXXXXXXXXX
```

**Frontend (check browser console):**
```
[AnalysisNode] ✅ Using backend deterministic batchId: batch_1_XXXXXXXXXXXXXXXX
[AnalysisNode] batchId: batch_1_XXXXXXXXXXXXXXXX
[AnalysisNode] result.batchId: batch_1_XXXXXXXXXXXXXXXX
```

### Test 2: Re-run with Same Posts

Run workflow AGAIN with EXACT SAME 3 posts.

**Expected backend logs:**
```
[Batch Analysis] Generated deterministic batchId: batch_1_XXXXXXXXXXXXXXXX  ← SAME ID!
[Cache HIT] Using cached pattern_analysis for batch batch_1_XXXXXXXXXXXXXXXX  ← CACHE HIT!
```

**Expected frontend logs:**
```
[AnalysisNode] ✅ Using backend deterministic batchId: batch_1_XXXXXXXXXXXXXXXX  ← SAME ID!
```

**Expected result:**
- Report shows IDENTICAL data
- Scatter plot dots in SAME positions
- No flashing or re-rendering

### Test 3: Page Refresh

Hard refresh browser (Cmd+Shift+R).

**Expected frontend logs:**
```
[ReportViewer] Report found locally, fetching from backend cache
[ReportViewer] Fetching report from backend cache: batch_1_XXXXXXXXXXXXXXXX
[ReportViewer] ✅ Report added to store from backend cache
```

**Expected backend logs:**
```
[Cache HIT] Retrieved cached data for batch batch_1_XXXXXXXXXXXXXXXX
```

**Expected result:**
- Report shows IDENTICAL data
- Instant load
- No changes

### Test 4: Different Posts

Run workflow with DIFFERENT posts (D, E, F).

**Expected:**
- NEW batchId: `batch_1_YYYYYYYYYYYYYYYY` (different hash)
- Cache MISS (new combination)
- NEW analysis generated
- DIFFERENT report (this is correct!)

---

## Success Criteria

✅ **Same posts → Same batchId**
```bash
# Run twice, check logs
docker logs redcube3_xhs-content-service-1 | grep "deterministic batchId"
# Should see SAME batchId for same posts
```

✅ **Cache hits on re-execution**
```bash
# Run twice, check logs
docker logs redcube3_xhs-content-service-1 | grep "Cache HIT"
# Should see cache hit on second run
```

✅ **Report data identical**
- Take screenshot of scatter plot on first run
- Re-run workflow with same posts
- Compare scatter plot → dots should be in EXACT same positions

✅ **No changes on refresh**
- View report
- Hard refresh
- Report should be identical (no flashing, no changes)

---

## Debugging Commands

### Check if backend code is deployed
```bash
docker exec redcube3_xhs-content-service-1 grep -A 5 "deterministic batchId" /app/src/controllers/analysisController.js
```

### Watch backend logs in real-time
```bash
docker logs redcube3_xhs-content-service-1 -f | grep -E "(deterministic|Cache|Batch Analysis)"
```

### Check cache table
```bash
docker exec redcube_postgres psql -U postgres -d redcube -c "SELECT batch_id, cached_at, cache_hits FROM batch_analysis_cache ORDER BY cached_at DESC LIMIT 10;"
```

### Check localStorage in browser
```javascript
// In browser console
JSON.parse(localStorage.getItem('reports'))
```

---

## If Data Still Changes

### Check these:

1. **Is backend using deterministic batchId?**
   ```bash
   docker logs redcube3_xhs-content-service-1 | grep "deterministic batchId"
   ```
   - If no logs → Code not deployed
   - If logs show different IDs for same posts → Hash function issue

2. **Is frontend using backend batchId?**
   ```
   Check browser console for:
   [AnalysisNode] ✅ Using backend deterministic batchId: ...
   ```
   - If seeing random ID → Frontend not using backend value

3. **Is cache working?**
   ```bash
   docker logs redcube3_xhs-content-service-1 | grep "Cache HIT"
   ```
   - If no hits on second run → Cache not working

4. **Are posts EXACTLY the same?**
   - Even whitespace differences change the hash
   - Use EXACT same posts for testing

---

**Status**: All fixes applied. Ready for end-to-end testing.

**Next**: User should run Test 1-4 and report results.
