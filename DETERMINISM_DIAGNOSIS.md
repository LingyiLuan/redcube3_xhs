# Determinism Issue Diagnosis

**Date**: November 13, 2025
**Status**: 🔍 ROOT CAUSE IDENTIFIED

---

## User's Issue

"the data still changing, the whole report data changed everytime i refreshed the page"

---

## Investigation Summary

### 1. Which Report Component is Being Used?

**Answer: v1 (MultiPostPatternReport.vue)**

Evidence:
- [useReportFeatureFlag.ts:12](vue-frontend/src/composables/useReportFeatureFlag.ts:12) - `DEFAULT_ROLLOUT_PERCENTAGE = 0.0`
- This means 0% rollout for v2, so v1 is the default
- [ReportViewer.vue:30-39](vue-frontend/src/components/ResultsPanel/ReportViewer.vue:30-39) - v2 loads if `useRefactoredVersion` is true, otherwise v1

**Status**:
- ✅ v1 already has deterministic jitter (from previous session in DETERMINISTIC_REPORT_FIXES_COMPLETE.md)
- ✅ v2 now also has deterministic jitter (just added in this session)

---

### 2. Is the Backend Cache Code Deployed?

**Answer: YES**

Evidence:
```bash
$ docker exec redcube3_xhs-content-service-1 grep -n "getCachedBatchData" /app/src/controllers/analysisController.js
159:      const cachedData = await getCachedBatchData(batchId);
350:    const cachedData = await getCachedBatchData(batchId);
1354:async function getCachedBatchData(batchId) {
```

**Status**: ✅ Cache functions exist and are called

---

### 3. Is the Cache Actually Being Used?

**Answer: NO**

Evidence:
```bash
$ docker logs redcube3_xhs-content-service-1 --tail 50 | grep -E "(Cache hit|Cache miss|Cached batch)"
# No output - cache is not being hit
```

**Status**: ❌ Cache logs never appear, meaning cache code path is not executing

---

## ROOT CAUSE

### The Problem

**The workflow execution ALWAYS calls `/analyze/batch` which generates NEW analysis every time**

Here's the actual flow:

1. **User runs workflow with 3 seed posts**
   - Workflow AnalysisNode executes
   - Calls `POST /api/content/analyze/batch`
   - Backend generates NEW embeddings for user posts (non-deterministic HuggingFace API)
   - Backend generates NEW pattern_analysis
   - Backend saves to cache (first time) or updates cache
   - Returns fresh data to frontend

2. **Frontend stores in localStorage**
   - Workflow node stores result in reportsStore
   - Report is saved to localStorage
   - **This is the data being displayed**

3. **User clicks "View Report"**
   - ReportViewer loads
   - Finds report in localStorage (from step 2)
   - `onMounted()` calls `fetchReportFromBackend()` to get cached data
   - BUT: The workflow was just executed, so the "cached" data is actually the SAME fresh data

4. **User refreshes page**
   - Page reloads
   - ReportViewer loads
   - Finds report in localStorage (stale data from workflow execution)
   - `onMounted()` tries to fetch from backend cache
   - BUT: localStorage data may be shown before backend fetch completes
   - OR: Backend cache contains the SAME non-deterministic data from the last workflow run

### Why Data Keeps Changing

**Every time you run the workflow:**
- New embeddings are generated (HuggingFace API is non-deterministic)
- New RAG retrieval happens (with different embeddings)
- New pattern_analysis is computed (with different RAG posts)
- Cache is updated with this NEW data
- Frontend shows this NEW data

**The cache is working, but it's caching non-deterministic data!**

---

## The Missing Piece

### What the Cache Was Supposed to Do

The cache was designed to ensure that:
1. **First analysis**: Generate embeddings → Retrieve RAG posts → Compute patterns → Save to cache
2. **Subsequent views**: Use cached embeddings → Use cached pattern_analysis → Return same data

### What's Actually Happening

1. **Every workflow execution**: Generate NEW embeddings → Retrieve NEW RAG posts → Compute NEW patterns → OVERWRITE cache
2. **View report**: Use cache (but cache contains the latest non-deterministic data from workflow execution)

### The Real Issue

**The workflow ALWAYS regenerates analysis instead of reusing cache**

When you click "Run" on the workflow:
- Backend receives POST /analyze/batch request
- Backend checks cache using batchId
- **BUT: batchId is generated from user post IDs**
- If you use the SAME 3 seed posts, you get the SAME batchId
- Cache SHOULD hit
- **So why isn't it hitting?**

---

## Debug Steps Required

### 1. Check if batchId is consistent
```bash
# Run workflow twice with same posts
# Check backend logs for batchId
docker logs redcube3_xhs-content-service-1 --tail 100 | grep "batchId"
```

### 2. Check if cache table has data
```sql
SELECT batch_id, cached_at, cache_hits FROM batch_analysis_cache ORDER BY cached_at DESC LIMIT 10;
```

### 3. Check cache hit/miss logs
```bash
# Enable debug logging or add more logs
docker logs redcube3_xhs-content-service-1 -f | grep -E "(Cache|batch)"
```

### 4. Check frontend localStorage
```javascript
// In browser console
console.log(localStorage.getItem('reports'))
console.log(localStorage.getItem('use_refactored_multipost_report'))
```

---

## Hypothesis

**I suspect the issue is one of the following:**

### Hypothesis A: batchId Changes Every Time ❌
- batchId is calculated from user post content or timestamps
- Even with same posts, batchId is different each time
- Cache never hits because key is always new

### Hypothesis B: Cache is Not Being Checked ❌
- `/analyze/batch` endpoint doesn't check cache
- Only `/batch/report/:batchId` checks cache
- Frontend never calls `/batch/report/:batchId` during workflow execution

### Hypothesis C: Frontend localStorage Override ❌
- Workflow stores result in localStorage
- ReportViewer displays localStorage data immediately
- Backend cache fetch happens but is ignored/overwritten

### Hypothesis D: Cache is Cleared/Invalidated ❌
- Something is clearing the cache between executions
- Or cache entries are expiring too quickly

---

## Solution Path

### Immediate Fix Options

#### Option 1: Don't Regenerate on Workflow Re-execution
**Modify AnalysisNode to check if analysis already exists for these posts**

Before calling `/analyze/batch`:
1. Calculate batchId from post IDs
2. Call `/batch/report/:batchId` to check if cached result exists
3. If exists → use cached data
4. If not exists → call `/analyze/batch` to generate new

#### Option 2: Make Backend Always Use Cache First
**Modify `/analyze/batch` endpoint to be cache-first**

Current flow:
```
POST /analyze/batch → Generate analysis → Save to cache → Return
```

New flow:
```
POST /analyze/batch → Check cache → If hit, return cached → If miss, generate → Save → Return
```

This is what the code SHOULD already be doing! Need to debug why it's not.

#### Option 3: Disable Workflow Re-execution for Same Posts
**Add UI warning: "Analysis already exists for these posts. View existing report?"**

This prevents the non-deterministic regeneration issue entirely.

---

## Next Steps

1. **Run diagnostic queries** to understand current state
2. **Add debug logging** to see why cache isn't hitting
3. **Test with same posts twice** and compare batchIds
4. **Check if analyzeBatch is actually checking cache** or if code path is different

---

## Files to Investigate

1. [analysisController.js:157-268](services/content-service/src/controllers/analysisController.js:157-268) - `analyzeBatch` function
2. [AnalysisNode.vue](vue-frontend/src/components/Nodes/AnalysisNode.vue) - Workflow execution
3. [ReportViewer.vue:189-200](vue-frontend/src/components/ResultsPanel/ReportViewer.vue:189-200) - Report loading logic

---

**Status**: Investigation ongoing - need user to run diagnostic tests
