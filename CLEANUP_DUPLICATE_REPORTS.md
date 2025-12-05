# Clean Up Duplicate Reports - CRITICAL FIX

**Date**: November 13, 2025
**Status**: 🚨 URGENT - Required before testing

---

## The Root Cause Found!

Your console logs revealed the issue:

```
[ReportViewer] 📊 All reports in store: 289  ← 289 REPORTS!!!
  - Report: report-batch_1_635d2e9acd488c04, batchId: batch_1_635d2e9acd488c04
  - Report: batch-batch_1_635d2e9acd488c04, batchId: batch_1_635d2e9acd488c04  ← DUPLICATE!
  - Report: report-batch_1_635d2e9acd488c04, batchId: batch_1_635d2e9acd488c04  ← DUPLICATE!
  - Report: batch-batch_1762990813913_ptw5mve5t  ← OLD RANDOM ID!
```

**The problem:**
1. You have **289 old reports** cluttering localStorage
2. **Multiple reports with the SAME batchId** but different data
3. **Old reports with random (non-deterministic) batchIds** still in storage
4. When viewing, you're randomly getting one of the duplicates (which has different data)

**This is why the data keeps changing!**

---

## What I Fixed

### 1. Deduplication Logic in reportsStore.ts

Added logic in [reportsStore.ts:83-109](vue-frontend/src/stores/reportsStore.ts#L83-L109) to prevent duplicate reports:

```typescript
function addReport(report: AnalysisReport) {
  // CRITICAL FIX: Check for existing report with same batchId
  // Same batchId = same content = same report, so UPDATE instead of DUPLICATE
  if (report.batchId) {
    const existingIndex = reports.value.findIndex(r => r.batchId === report.batchId)

    if (existingIndex !== -1) {
      console.log('[ReportsStore] ⚠️ Report with same batchId already exists, updating:', report.batchId)
      // Update the existing report with new data (keeping the same position)
      reports.value[existingIndex] = report
      console.log('[ReportsStore] ✅ Report updated (no duplicate created)')
      saveToLocalStorage()
      return
    }
  }

  // No existing report found, add new one
  reports.value.unshift(report)
  saveToLocalStorage()
}
```

**What this does:**
- Before adding a new report, checks if one with the same batchId already exists
- If exists → UPDATE the existing report (don't create duplicate)
- If doesn't exist → Add new report normally

**This prevents future duplicates, but doesn't clean up the existing 289 reports!**

---

## Clean Up Steps (DO THIS NOW)

### Option 1: Complete Clean Slate (Recommended)

**This will delete ALL 289 reports and start fresh.**

1. **Open browser DevTools → Console**

2. **Run this command:**
   ```javascript
   localStorage.removeItem('reports')
   console.log('✅ All reports cleared!')
   ```

3. **Hard refresh the page** (Cmd+Shift+R)

4. **Verify it's clean:**
   ```javascript
   const data = JSON.parse(localStorage.getItem('reports') || '{"reports":[]}')
   console.log('Reports count:', data.reports?.length || 0)  // Should be 0
   ```

5. **Test the workflow:**
   - Run workflow with 3 test posts
   - View report → Take screenshot
   - Refresh page
   - View report again → Should be IDENTICAL

### Option 2: Keep Only Deterministic Reports (Selective Cleanup)

**This keeps only reports with deterministic batchIds (no random timestamps).**

1. **Open browser DevTools → Console**

2. **Run this cleanup script:**
   ```javascript
   // Load existing reports
   const data = JSON.parse(localStorage.getItem('reports') || '{"reports":[]}')
   const oldCount = data.reports.length
   console.log('Old reports count:', oldCount)

   // Filter: Keep only reports with deterministic batchIds
   // Deterministic batchIds look like: batch_1_a3f9c2e4b1d8 (content hash)
   // Random batchIds look like: batch_1762990813913_ptw5mve5t (timestamp + random)
   const deterministicReports = data.reports.filter(r => {
     // Keep if batchId doesn't contain timestamp (long number)
     if (!r.batchId) return false
     const hasTimestamp = /\d{13,}/.test(r.batchId)  // 13+ digit number = timestamp
     return !hasTimestamp
   })

   console.log('Deterministic reports count:', deterministicReports.length)
   console.log('Removed:', oldCount - deterministicReports.length)

   // Save cleaned data
   data.reports = deterministicReports
   localStorage.setItem('reports', JSON.stringify(data))
   console.log('✅ Cleanup complete!')
   ```

3. **Hard refresh the page** (Cmd+Shift+R)

4. **Verify:**
   ```javascript
   const data = JSON.parse(localStorage.getItem('reports'))
   console.log('Cleaned reports:', data.reports.length)
   data.reports.forEach(r => console.log(`  - ${r.id}, batchId: ${r.batchId}`))
   ```

### Option 3: Remove Only Duplicates (Keep Unique batchIds)

**This removes duplicate reports, keeping only the most recent one for each batchId.**

1. **Open browser DevTools → Console**

2. **Run this deduplication script:**
   ```javascript
   // Load existing reports
   const data = JSON.parse(localStorage.getItem('reports') || '{"reports":[]}')
   const oldCount = data.reports.length
   console.log('Old reports count:', oldCount)

   // Deduplicate by batchId (keep most recent for each batchId)
   const seenBatchIds = new Set()
   const uniqueReports = []

   for (const report of data.reports) {
     if (!report.batchId) {
       uniqueReports.push(report)  // Keep reports without batchId
       continue
     }

     if (!seenBatchIds.has(report.batchId)) {
       seenBatchIds.add(report.batchId)
       uniqueReports.push(report)
     } else {
       console.log('Removing duplicate:', report.id, 'batchId:', report.batchId)
     }
   }

   console.log('Unique reports count:', uniqueReports.length)
   console.log('Removed duplicates:', oldCount - uniqueReports.length)

   // Save deduplicated data
   data.reports = uniqueReports
   localStorage.setItem('reports', JSON.stringify(data))
   console.log('✅ Deduplication complete!')
   ```

3. **Hard refresh the page** (Cmd+Shift+R)

---

## Recommended Approach

I recommend **Option 1 (Complete Clean Slate)** because:

1. **Simplest**: One command, completely clean
2. **Most effective**: Removes all old data including random batchIds
3. **Fresh start**: No confusion from old reports
4. **Fast**: Starts working immediately

You can always regenerate reports by running workflows again. With the deduplication fix I just added, new reports won't duplicate!

---

## After Cleanup: Testing Steps

### 1. Run Fresh Workflow

**Use these EXACT 3 test posts** (save them for reuse):
```
Post A: "I interviewed at Google for SWE role"
Post B: "Meta asked LeetCode hard questions"
Post C: "Amazon focused on system design"
```

**Expected console logs:**
```
[AnalysisNode] ✅ Using backend deterministic batchId: batch_1_XXXXXXXX
[ReportsStore] Report added: report-batch_1_XXXXXXXX
```

**Note the exact batchId!** Write it down.

### 2. View Report (First Time)

**Expected console logs:**
```
[ReportViewer] 📊 All reports in store: 1  ← Only 1 report now!
  - Report: report-batch_1_XXXXXXXX, batchId: batch_1_XXXXXXXX
[ReportViewer] ✅ Using report from localStorage (deterministic data)
```

**Take a screenshot of the scatter plot!**

### 3. Refresh and View Again

**Hard refresh** (Cmd+Shift+R), navigate back, click "View Report"

**Expected:**
- Console shows SAME batchId
- Only 1 report in store
- Scatter plot IDENTICAL to screenshot

### 4. Re-run Workflow (Same Posts)

**Run workflow AGAIN with EXACT SAME 3 posts**

**Expected console logs:**
```
[ReportsStore] ⚠️ Report with same batchId already exists, updating: batch_1_XXXXXXXX  ← NEW!
[ReportsStore] ✅ Report updated (no duplicate created)  ← NEW!
```

**Expected result:**
- Still only 1 report in localStorage
- Data is identical
- No duplicates created

### 5. Verify Backend Cache

```bash
docker logs redcube3_xhs-content-service-1 --tail 50 | grep -E "(deterministic batchId|Cache HIT)"
```

**Expected:**
```
[Batch Analysis] Generated deterministic batchId: batch_1_XXXXXXXX
[Cache HIT] Using cached pattern_analysis for batch batch_1_XXXXXXXX  ← Cache working!
```

---

## Success Criteria

After cleanup and testing:

✅ **Only 1 report in localStorage** (or a small number if you run multiple different analyses)
✅ **No duplicates** - Each batchId appears only once
✅ **Deterministic batchIds** - No timestamps, only content hashes
✅ **Identical data on refresh** - Scatter plot doesn't change
✅ **Update instead of duplicate** - Re-running workflow updates existing report
✅ **Cache hits** - Backend returns cached data for same posts

---

## Why This Fixes the Changing Data Problem

### Before (The Issue)

1. Run workflow with posts A, B, C
2. Creates `report-batch_1_AAAA` with data X
3. Run workflow AGAIN with posts A, B, C
4. Creates `report-batch_1_AAAA` again (DUPLICATE!) with data Y
5. Run workflow AGAIN
6. Creates `report-batch_1_AAAA` again (DUPLICATE!) with data Z
7. Now you have 3 reports with same batchId but different data
8. When viewing, you randomly see X, Y, or Z → **Data keeps changing!**

### After (The Fix)

1. Run workflow with posts A, B, C
2. Creates `report-batch_1_AAAA` with data X
3. Run workflow AGAIN with posts A, B, C
4. Finds existing `report-batch_1_AAAA` → **UPDATES IT** (no duplicate)
5. Run workflow AGAIN
6. Finds existing `report-batch_1_AAAA` → **UPDATES IT** (no duplicate)
7. You always have exactly 1 report with batchId AAAA
8. When viewing, you always see the same report → **Data is consistent!**

Plus, with backend cache hitting, the data itself should be identical (same scatter plot positions, same everything).

---

## What to Do Right Now

1. **Run Option 1 cleanup** (clear all reports)
2. **Test with fresh workflow** (3 specific test posts)
3. **Report back:**
   - How many reports after cleanup?
   - Did scatter plot stay identical on refresh?
   - Did you see the "Report updated (no duplicate created)" message on second run?
   - Are there any errors in console?

---

**Status**: Fix applied, waiting for cleanup and testing.
