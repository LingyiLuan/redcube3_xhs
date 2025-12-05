# Caching Strategy & Debugging Guide

**Date**: November 13, 2025
**Status**: 🔍 Investigating why data still changes

---

## What's Actually Saved to localStorage

### Answer: EVERYTHING

Looking at [reportsStore.ts:31-42](vue-frontend/src/stores/reportsStore.ts#L31-L42):

```typescript
function saveToLocalStorage() {
  try {
    const state = {
      reports: reports.value,  // ← FULL report objects
      activeReportId: activeReportId.value
    }
    localStorage.setItem('reports', JSON.stringify(state))
  }
}
```

**What this means:**

localStorage stores the **ENTIRE report object** including:
- `id`: Report ID (e.g., "report-batch_1_a3f9c2e4b1d8")
- `batchId`: Content-based deterministic ID (e.g., "batch_1_a3f9c2e4b1d8")
- `result.pattern_analysis`: ALL chart data
  - Scatter plot coordinates
  - Company rankings
  - Skills frequency
  - Interview patterns
  - Success factors
  - Emotional intelligence
  - Everything you see in the UI
- `result.individual_analyses`: Per-post analysis for your 3 seed posts
- `timestamp`: When created
- All computed metrics

**This is NOT just an ID - it's the complete report with all data!**

---

## Real-World Caching Strategy (Best Practices)

### Industry Standard: Hybrid Approach

Most production applications use a **multi-layer caching strategy**:

```
┌─────────────────────────────────────────────────┐
│  1. Content-Based ID (Deterministic Key)       │
│     Same content → Same ID → Cache hit          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  2. Backend Cache (Source of Truth)             │
│     - PostgreSQL table with batchId as key      │
│     - Stores pattern_analysis, embeddings       │
│     - Persistent, reliable, shareable           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  3. Frontend Cache (Performance Layer)          │
│     - localStorage for instant access           │
│     - Avoids unnecessary API calls               │
│     - Works offline                              │
└─────────────────────────────────────────────────┘
```

### The Flow We've Implemented

#### First Workflow Execution (Cache Miss)

```
1. User runs workflow with 3 seed posts
   ↓
2. Frontend sends: {posts: [{text: "A"}, {text: "B"}, {text: "C"}]}
   ↓
3. Backend generates deterministic batchId
   contentHash = SHA256("A|B|C") = "a3f9c2e4b1d8"
   batchId = "batch_1_a3f9c2e4b1d8"
   ↓
4. Backend checks cache → MISS (first time)
   ↓
5. Backend generates embeddings, retrieves RAG posts, computes patterns
   ↓
6. Backend saves to cache:
   INSERT INTO batch_analysis_cache (batch_id, pattern_analysis, ...)
   VALUES ('batch_1_a3f9c2e4b1d8', {all the data}, ...)
   ↓
7. Backend returns:
   {
     batchId: "batch_1_a3f9c2e4b1d8",
     pattern_analysis: {...},
     individual_analyses: [...]
   }
   ↓
8. Frontend saves to localStorage:
   reports: [{
     id: "report-batch_1_a3f9c2e4b1d8",
     batchId: "batch_1_a3f9c2e4b1d8",
     result: {pattern_analysis: {...}, individual_analyses: [...]}
   }]
   ↓
9. User views Report A → Scatter dots at positions (1,2), (3,4), (5,6)
```

#### Second View (After Refresh)

```
1. User refreshes browser
   ↓
2. ReportViewer loads
   ↓
3. Checks reportsStore (populated from localStorage on app init)
   ↓
4. Finds report with ID "report-batch_1_a3f9c2e4b1d8"
   ↓
5. Displays SAME data from localStorage
   ↓
6. User should see SAME Report A with dots at (1,2), (3,4), (5,6)
```

#### Re-running Workflow with SAME Posts

```
1. User runs workflow AGAIN with SAME 3 posts
   ↓
2. Backend generates batchId
   contentHash = SHA256("A|B|C") = "a3f9c2e4b1d8" ← SAME!
   batchId = "batch_1_a3f9c2e4b1d8" ← SAME!
   ↓
3. Backend checks cache → HIT! ✅
   ↓
4. Backend returns cached pattern_analysis (no regeneration)
   ↓
5. Frontend creates report with SAME ID: "report-batch_1_a3f9c2e4b1d8"
   ↓
6. localStorage already has this ID → Updates it (or keeps it)
   ↓
7. User should see SAME Report A with dots at (1,2), (3,4), (5,6)
```

---

## Why Data Might Still Be Changing

### Hypothesis 1: Multiple Reports with Different batchIds

**Scenario:**
- Workflow execution 1 creates: `report-batch_1_AAAA`
- Workflow execution 2 creates: `report-batch_1_BBBB` (different batchId!)
- User alternates between viewing these two DIFFERENT reports

**Root Cause:**
- If batchId is not truly deterministic (still has random component)
- OR if user is testing with slightly different posts each time
- OR if post order/whitespace differs

**How to Check:**
Open browser console when clicking "View Report" and look for:
```
[ReportViewer] ===== REPORT VIEWER MOUNTED =====
[ReportViewer] props.reportId: report-batch_1_XXXXXXXXXX
[ReportViewer] Report batchId: batch_1_XXXXXXXXXX
[ReportViewer] 📊 All reports in store: 3
  - Report: report-batch_1_AAAA, batchId: batch_1_AAAA
  - Report: report-batch_1_BBBB, batchId: batch_1_BBBB  ← DIFFERENT!
  - Report: report-batch_1_CCCC, batchId: batch_1_CCCC  ← DIFFERENT!
```

**If you see multiple different batchIds** → Backend is still generating random IDs!

### Hypothesis 2: localStorage Being Cleared

**Scenario:**
- Report saved correctly
- localStorage gets cleared somehow
- ReportViewer fetches from backend, which returns different data

**How to Check:**
```
[ReportViewer] 💾 localStorage reports count: 0  ← Empty!
[ReportViewer] ⚠️ Report not found in localStorage, fetching from backend
```

**Causes:**
- Browser privacy settings
- Incognito mode
- Manual clear
- Another tab clearing storage

### Hypothesis 3: Report Object Being Mutated

**Scenario:**
- Report saved correctly with deterministic data
- Some reactive Vue code mutates the object
- localStorage saves the mutated version

**How to Check:**
Look for logs showing the SAME batchId but DIFFERENT data:
```
[ReportViewer] Report batchId: batch_1_AAAA  (same)
[ReportViewer] Pattern analysis: {...different data...}
```

### Hypothesis 4: Backend Returning Different Data for Same batchId

**Scenario:**
- batchId is deterministic: `batch_1_AAAA`
- But backend cache is returning different data each time
- OR backend cache is being regenerated incorrectly

**How to Check:**
```bash
# Check backend logs
docker logs redcube3_xhs-content-service-1 --tail 100 | grep -E "(deterministic batchId|Cache HIT|Cache MISS)"
```

**Expected for same posts:**
```
[Batch Analysis] Generated deterministic batchId: batch_1_AAAA
[Cache HIT] Using cached pattern_analysis for batch batch_1_AAAA
```

**Bad sign:**
```
[Batch Analysis] Generated deterministic batchId: batch_1_AAAA
[Cache MISS] Generating new analysis for batch batch_1_AAAA  ← Should be HIT!
```

---

## Debugging Steps (DO THIS NOW)

### Step 1: Run Workflow and Check Console

1. **Open browser DevTools → Console**
2. **Run workflow with 3 specific test posts** (save them for reuse):
   ```
   Post A: "I interviewed at Google for SWE role"
   Post B: "Meta asked LeetCode hard questions"
   Post C: "Amazon focused on system design"
   ```
3. **Look for these logs in console:**

**Expected:**
```
[AnalysisNode] ✅ Using backend deterministic batchId: batch_1_XXXXXXXX
[AnalysisNode] Creating batch report: {...}
[ReportsStore] Report added: report-batch_1_XXXXXXXX
```

**Note the exact batchId!** Write it down: `batch_1_________________`

### Step 2: View Report (First Time)

1. **Click "View Report" button**
2. **Check console logs:**

**Expected:**
```
[ReportViewer] ===== REPORT VIEWER MOUNTED =====
[ReportViewer] props.reportId: report-batch_1_XXXXXXXX  ← Same as Step 1!
[ReportViewer] Report batchId: batch_1_XXXXXXXX  ← Same as Step 1!
[ReportViewer] 📊 All reports in store: 1
  - Report: report-batch_1_XXXXXXXX, batchId: batch_1_XXXXXXXX
[ReportViewer] ✅ Using report from localStorage (deterministic data)
```

3. **Take a screenshot of the scatter plot** (note exact dot positions)

### Step 3: Refresh Page

1. **Hard refresh** (Cmd+Shift+R)
2. **Navigate back to workflow**
3. **Click "View Report" again**
4. **Check console logs:**

**Expected:**
```
[ReportViewer] props.reportId: report-batch_1_XXXXXXXX  ← SAME batchId!
[ReportViewer] Report batchId: batch_1_XXXXXXXX  ← SAME batchId!
```

5. **Compare scatter plot with screenshot** - should be PIXEL PERFECT identical

**If different** → Something is wrong! Check:
- Are the batchIds the same?
- Is localStorage empty?
- Are there multiple reports with different IDs?

### Step 4: Re-run Workflow with SAME Posts

1. **Run workflow AGAIN** with EXACT SAME 3 posts
2. **Check backend logs:**

```bash
docker logs redcube3_xhs-content-service-1 --tail 50 | grep "deterministic batchId"
```

**Expected:**
```
[Batch Analysis] Generated deterministic batchId: batch_1_XXXXXXXX  ← SAME!
```

**If different** → Backend is NOT generating deterministic batchId!

3. **Check for cache hit:**

```bash
docker logs redcube3_xhs-content-service-1 --tail 50 | grep "Cache HIT"
```

**Expected:**
```
[Cache HIT] Using cached pattern_analysis for batch batch_1_XXXXXXXX
```

**If "Cache MISS"** → Cache is not working!

### Step 5: Check localStorage Directly

Open browser console and run:

```javascript
// Check what's in localStorage
const data = JSON.parse(localStorage.getItem('reports'))
console.log('Reports:', data.reports)

// Check specific report
data.reports.forEach(r => {
  console.log(`Report ID: ${r.id}`)
  console.log(`Batch ID: ${r.batchId}`)
  console.log(`Has pattern_analysis: ${!!r.result?.pattern_analysis}`)
  console.log(`Pattern analysis keys:`, Object.keys(r.result?.pattern_analysis || {}))
})
```

**Expected:**
- Should see 1 report (or maybe a few if you ran multiple times)
- All with the SAME batchId if you used the same posts
- `pattern_analysis` should be present and complete

---

## What to Report Back

Please run the debugging steps above and tell me:

1. **Are the batchIds the same across workflow runs?**
   - First run: `batch_1_________________`
   - Second run: `batch_1_________________`
   - Same? Different?

2. **How many reports are in localStorage?**
   - Run the localStorage check above
   - How many different batchIds?

3. **Is the backend generating deterministic batchIds?**
   - Check backend logs
   - Are they the same for same posts?

4. **Is the cache hitting?**
   - Check backend logs
   - Do you see "Cache HIT" on second run?

5. **What do the console logs show?**
   - Copy/paste the ReportViewer logs
   - Especially the batchId values

With this information, I can pinpoint exactly what's going wrong!

---

## Expected Caching Behavior (Summary)

### ✅ What SHOULD Happen

1. **Same posts → Same batchId** (content-based hash)
2. **Same batchId → Cache hit** (backend returns cached data)
3. **Same data → Same visualization** (scatter dots in same positions)
4. **localStorage persists** (report survives refresh)
5. **Report deterministic** (no changes without re-running workflow with different posts)

### ❌ What Should NOT Happen

1. **Same posts → Different batchId** (would mean hash is broken)
2. **Same batchId → Cache miss** (would mean cache not working)
3. **Same data → Different visualization** (would mean jitter is random)
4. **localStorage cleared** (would mean storage issue)
5. **Report changes on refresh** (would mean one of the above issues)

---

## Possible Fixes (Based on Debugging Results)

### If batchIds are different each time

**Problem:** Backend still has random component in batchId generation

**Fix:** Verify analysisController.js is using SHA-256 hash:
```bash
docker exec redcube3_xhs-content-service-1 grep -A 10 "deterministic batchId" /app/src/controllers/analysisController.js
```

Should see:
```javascript
const contentHash = crypto
  .createHash('sha256')
  .update(posts.map(p => p.text).sort().join('|'))
  .digest('hex')
  .substring(0, 16);
const batchId = `batch_${userId}_${contentHash}`;
```

### If batchIds are same but cache misses

**Problem:** Cache save/retrieve is broken

**Fix:** Check database:
```bash
docker exec redcube_postgres psql -U postgres -d redcube -c "SELECT batch_id, cached_at, cache_hits FROM batch_analysis_cache ORDER BY cached_at DESC LIMIT 5;"
```

### If localStorage is empty after refresh

**Problem:** Browser settings or storage quota

**Fix:**
- Check browser privacy settings
- Check if other tabs are clearing storage
- Check storage quota: `navigator.storage.estimate()`

### If data is different but batchIds match

**Problem:** Report object being mutated or backend returning inconsistent data

**Fix:** Add immutability checks, verify backend cache integrity

---

**Status**: Waiting for user to run debugging steps and report findings.
