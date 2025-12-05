# Single Analysis LocalStorage Fix - Complete Data Persistence

## Problem

After hard refresh, single analysis reports showed ONLY the overview section (company, role, outcome) and the "Generate Learning Map" button. All other sections (Benchmark, Skills, Questions, Similar Experiences) disappeared.

**Root Cause:**
1. The `analysis_results` table **doesn't exist** in the database
2. Backend `getSingleAnalysisHistory()` returns minimal metadata only
3. Full analysis data (pattern_analysis, skills, questions, etc.) is NOT stored in backend
4. After refresh, reports only have basic metadata → sections can't render

## Solution: localStorage Cache

Since the backend doesn't have a table to store complete single analysis data, we use localStorage to cache the full report when it's created.

### How It Works

1. **On Analysis Creation** - When user runs single analysis:
   - Backend returns complete analysis data (overview, benchmark, skills, questions, similar experiences)
   - Frontend adds report to reportsStore
   - Report is also saved to localStorage with key: `single-analysis-report-{id}`

2. **After Hard Refresh** - When page reloads:
   - reportsStore calls `fetchReportsFromBackend()`
   - Backend returns minimal metadata (company, role, outcome)
   - Store tries to load full report from localStorage
   - If found → use full cached data ✅
   - If not found → create minimal report (only overview section)

### Implementation

**File:** `vue-frontend/src/stores/reportsStore.ts`

#### New Function 1: Save to localStorage
```typescript
function saveSingleAnalysisToLocalStorage(report: AnalysisReport) {
  try {
    const key = `single-analysis-${report.id}`
    localStorage.setItem(key, JSON.stringify(report))
    console.log('[ReportsStore] Saved single analysis to localStorage:', key)
  } catch (error) {
    console.error('[ReportsStore] Failed to save single analysis to localStorage:', error)
  }
}
```

#### New Function 2: Load from localStorage
```typescript
function loadSingleAnalysisFromLocalStorage(reportId: string): AnalysisReport | null {
  try {
    const key = `single-analysis-${reportId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      const report = JSON.parse(saved)
      console.log('[ReportsStore] Loaded single analysis from localStorage:', key)
      return report
    }
  } catch (error) {
    console.error('[ReportsStore] Failed to load single analysis from localStorage:', error)
  }
  return null
}
```

#### Modified `addReport()` - Save on creation
```typescript
function addReport(report: AnalysisReport) {
  // ... existing code ...

  // Save single analysis to localStorage for persistence (survives page refresh)
  if (report.result?.type === 'single') {
    saveSingleAnalysisToLocalStorage(report)
  }
}
```

#### Modified `fetchReportsFromBackend()` - Load on refresh
```typescript
// Convert single analyses to report format
// Try to load full data from localStorage first, fallback to minimal metadata
const singleReports: AnalysisReport[] = singleData.map((analysis: any) => {
  const reportId = `report-${analysis.id}`
  const cached = loadSingleAnalysisFromLocalStorage(reportId)

  if (cached) {
    // Use cached full report data from localStorage
    console.log('[ReportsStore] Using full single analysis from localStorage:', reportId)
    return cached
  }

  // Fallback: Create minimal report with basic metadata only
  console.log('[ReportsStore] No cached data, creating minimal report:', reportId)
  return {
    id: reportId,
    result: {
      id: analysis.id,
      overview: {
        company: analysis.company,
        role: analysis.role,
        outcome: analysis.outcome,
        difficulty: analysis.difficulty,
      },
      type: 'single'
    },
    ...
  }
})
```

---

## Data Flow

### Before Fix (BROKEN)
1. User runs single analysis
2. Backend returns full data
3. Frontend stores in memory only
4. **Hard Refresh** → memory cleared
5. Store fetches minimal metadata from backend
6. Only overview section shows ❌

### After Fix (WORKING)
1. User runs single analysis
2. Backend returns full data
3. Frontend stores in memory AND localStorage ✅
4. **Hard Refresh** → memory cleared
5. Store fetches minimal metadata from backend
6. Store checks localStorage for full data
7. Full data found → all sections show ✅

---

## localStorage Keys

**Format:** `single-analysis-report-{id}`

**Examples:**
- `single-analysis-report-373`
- `single-analysis-report-421`

**Data Stored:** Complete AnalysisReport object
```typescript
{
  id: "report-373",
  nodeId: "node-373",
  workflowId: "default-workflow",
  timestamp: "2025-11-19T...",
  analysisId: 373,
  result: {
    id: 373,
    type: "single",
    overview: { company, role, outcome, difficulty, ... },
    benchmark: { successRate, difficulty, stageBreakdown },
    skills: { tested: [...] },
    questions: [...],
    similarExperiences: [...]
  },
  isRead: false
}
```

---

## Advantages of localStorage Solution

✅ **Simple** - No database schema changes needed
✅ **Fast** - Instant load, no API calls
✅ **Reliable** - Works offline
✅ **Per-device** - Each browser has its own cache

---

## Limitations

❌ **Not cross-device** - Cache doesn't sync across browsers/devices
❌ **Can be cleared** - User can clear browser data
❌ **Storage limit** - localStorage has ~5-10MB limit per domain
❌ **No multi-user** - Different users on same browser share same cache

---

## Future Enhancement: Backend Cache Table

For production, consider creating a proper backend cache:

### Option 1: New Table `single_analysis_cache`
```sql
CREATE TABLE single_analysis_cache (
  analysis_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  analysis_data JSONB NOT NULL,  -- Full report data
  created_at TIMESTAMP DEFAULT NOW(),
  cached_at TIMESTAMP DEFAULT NOW()
);
```

### Option 2: Modify Existing Endpoint
Update `getSingleAnalysisHistory()` to:
1. Fetch `original_text` from `analysis_results`
2. Re-run analysis pipeline (embedding + RAG + pattern extraction)
3. Return full analysis data

**Pros:** Consistent with batch analysis
**Cons:** Expensive (re-runs AI for every load)

---

## Testing

### Test Case 1: Fresh Analysis ✅
1. Run single analysis
2. Verify all sections show
3. Check localStorage has `single-analysis-report-{id}` key
4. Hard refresh
5. **Result:** All sections still show ✅

### Test Case 2: Clear localStorage ⚠️
1. Run single analysis
2. Hard refresh - works ✅
3. Clear localStorage manually
4. Hard refresh again
5. **Result:** Only overview shows (expected - no cache)

### Test Case 3: Multiple Analyses ✅
1. Run 3 single analyses
2. Hard refresh
3. **Result:** All 3 reports in sidebar with full data ✅

---

## Files Modified

### Frontend
1. **vue-frontend/src/stores/reportsStore.ts**
   - Added `saveSingleAnalysisToLocalStorage()` function
   - Added `loadSingleAnalysisFromLocalStorage()` function
   - Modified `addReport()` to save to localStorage
   - Modified `fetchReportsFromBackend()` to load from localStorage
   - Exposed `loadSingleAnalysisFromLocalStorage` in store API

---

## Success Criteria

- ✅ Single analysis reports saved to localStorage on creation
- ✅ Full report data loaded from localStorage after refresh
- ✅ All sections (overview, benchmark, skills, questions, similar experiences) visible after refresh
- ✅ Falls back to minimal data if localStorage empty
- ✅ No errors in console
- ✅ Works across multiple analyses

---

## Notes

**Why not backend storage?**
- The `analysis_results` table doesn't exist in database
- Creating it requires schema migration
- localStorage is faster for MVP

**When to move to backend?**
- When users need cross-device sync
- When users need analysis history beyond localStorage limits
- When multi-user support is needed
