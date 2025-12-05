# Debug: batchId Flow Tracing

## The Problem

User's exact scenario:
1. Run analysis → See report A
2. Refresh page → Goes to workflow
3. Click "View Report" button → See report B (DIFFERENT DATA!)

## What I Found

The `ReportViewer` is **ALWAYS fetching from backend** on mount (line 190-194):

```typescript
onMounted(async () => {
  if (report.value?.batchId) {
    console.log('[ReportViewer] Report found locally, fetching deterministic data from backend cache')
    await fetchReportFromBackend(report.value.batchId) // ← FETCHES EVERY TIME!
  }
})
```

This OVERWRITES localStorage with backend data. If the backend returns different data each time, the report changes.

## Critical Question

**Is the backend returning the same batchId in the response that was used to cache the data?**

The flow should be:
1. Frontend calls POST /analyze/batch
2. Backend generates `batchId = batch_1_HASH`
3. Backend saves to cache with key `batch_1_HASH`
4. Backend returns response with `batchId: "batch_1_HASH"`
5. Frontend stores report with `batchId: "batch_1_HASH"`
6. Frontend later calls GET /batch/report/batch_1_HASH
7. Backend returns cached data for `batch_1_HASH`

**But if step 4 is missing the batchId**, then step 6 fails!

## Action Required

User needs to check browser console when clicking "View Report":

1. Open DevTools → Console
2. Click "View Report" button
3. Look for these logs:

**What we want to see:**
```
[ResultsNode] Matched report by batchId: batch_1_XXXXXXXXXX report-batch_1_XXXXXXXXXX
[ResultsNode] Navigating to report: report-batch_1_XXXXXXXXXX
[ReportViewer] Report found locally, fetching deterministic data from backend cache
[ReportViewer] Fetching report from backend cache: batch_1_XXXXXXXXXX
[ReportViewer] Received cached report: {pattern_analysis: {...}}
[ReportViewer] ✅ Report added to store from backend cache
```

**If you see different batchIds** → That's the problem!
**If you see "Report not found locally"** → localStorage was cleared
**If backend returns 404** → Cache miss (backend issue)

## Testing Command

Run this in browser console when on the report:
```javascript
const reports = JSON.parse(localStorage.getItem('reports') || '[]')
console.log('All reports:', reports.map(r => ({id: r.id, batchId: r.batchId})))
```

Then check if the batchIds match what the backend is using.
