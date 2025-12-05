# Interview Questions - Cache Issue Diagnosis & Fix

## Problem

After implementing pattern-based interview question extraction, the frontend shows:
```
[Interview Questions] ⚠️ No interview_questions found in patterns - showing empty state
```

## Root Cause

The batch analysis system uses **dual-layer caching**:

### 1. Backend Cache (PostgreSQL - batch_analysis_cache table)
- Caches `pattern_analysis` object per `batchId`
- `batchId` is deterministic: `batch_{userId}_{contentHash}`
- Same posts → Same batchId → Cache hit

### 2. Frontend Cache (localStorage)
- Caches entire batch report in browser
- Persists across page refreshes

**The Issue:**
- Batch analyses created BEFORE the interview_questions feature was added don't have the `interview_questions` field in their cached `pattern_analysis`
- When you run the same batch analysis again, it hits the OLD cache (without questions)
- Frontend checks for `props.patterns.interview_questions` → finds nothing → shows empty state

## Data Flow

```
User submits batch analysis
    ↓
Backend generates batchId: batch_1_c4cd14e70cfed0f3
    ↓
Check cache: getCachedBatchData(batchId)
    ↓
CACHE HIT! (line 179-196 in analysisController.js)
    ↓
Return cached pattern_analysis (WITHOUT interview_questions ❌)
    ↓
Frontend receives pattern_analysis without interview_questions
    ↓
fullQuestionBank.value checks: props.patterns.interview_questions
    ↓
Returns empty array → Shows warning
```

## Verification

### Check Backend Cache

```sql
SELECT
  batch_id,
  cached_at,
  (pattern_analysis::jsonb ? 'interview_questions') as has_interview_questions
FROM batch_analysis_cache
ORDER BY cached_at DESC;
```

**Result:**
```
batch_id                  | cached_at           | has_interview_questions
--------------------------+---------------------+------------------------
batch_1_137e556e545a62e1  | 2025-11-14 02:43:59 | t  ✅ NEW (with questions)
batch_1_1483327ba22070ef  | 2025-11-13 23:16:25 | f  ❌ OLD (no questions)
batch_1_c4cd14e70cfed0f3  | 2025-11-13 23:15:25 | f  ❌ OLD (no questions)
```

## Solution

### Step 1: Clear Old Backend Cache ✅ DONE

```sql
DELETE FROM batch_analysis_cache
WHERE (pattern_analysis::jsonb ? 'interview_questions') = false;
```

**Result:** Deleted 2 old cache entries

### Step 2: Clear Browser localStorage

**Option A - Clear All (Recommended):**
```javascript
// Open browser console (F12) and run:
localStorage.clear()
```

**Option B - Clear Specific Keys:**
```javascript
// Check what's cached:
Object.keys(localStorage).filter(k => k.includes('batch') || k.includes('report'))

// Remove specific batch reports:
Object.keys(localStorage)
  .filter(k => k.includes('batch'))
  .forEach(k => localStorage.removeItem(k))
```

### Step 3: Run Fresh Batch Analysis

1. Go to the UI batch analysis page
2. Submit posts for analysis
3. System will generate NEW cache with `interview_questions` ✅
4. Frontend will display questions correctly

## Verification After Fix

### Backend Logs (Should See):
```
[Pattern Analysis] Extracting interview questions using pattern matching...
⏱️  Interview Questions Extraction: 31.3ms
[Pattern Analysis] Extracted 221 unique questions from 226 raw questions
```

### Frontend Console (Should See):
```
[Interview Questions] ✅ Using 221 real pattern-extracted questions
[Skills Priority Matrix] Generated 10 skills with percentile ranking
```

### Database Verification:
```sql
SELECT
  batch_id,
  (pattern_analysis::jsonb -> 'interview_questions' -> 0 ->> 'text')::text as first_question
FROM batch_analysis_cache
ORDER BY cached_at DESC
LIMIT 1;
```

**Expected Output:**
```
batch_id                  | first_question
--------------------------+--------------------------------------------------------
batch_1_137e556e545a62e1  | Design a system to determine optimal batch sizes for...
```

## Future Prevention

### Option 1: Add Cache Versioning

Add a `cache_version` field to detect stale caches:

```javascript
const CACHE_VERSION = 2; // Increment when schema changes

async function getCachedBatchData(batchId) {
  const result = await pool.query(`
    SELECT * FROM batch_analysis_cache
    WHERE batch_id = $1 AND cache_version = $2
  `, [batchId, CACHE_VERSION]);

  // Returns null if cache_version mismatch → regenerates analysis
}
```

### Option 2: Validate Cache Schema

Check for required fields before using cache:

```javascript
if (cachedData && cachedData.patternAnalysis) {
  // Validate cache has all required fields
  const requiredFields = ['interview_questions', 'skill_frequency', 'company_trends'];
  const hasAllFields = requiredFields.every(field =>
    field in cachedData.patternAnalysis
  );

  if (hasAllFields) {
    // Use cache
    logger.info(`[Cache HIT] Valid cache for batch ${batchId}`);
    patternAnalysis = cachedData.patternAnalysis;
  } else {
    // Invalidate stale cache
    logger.warn(`[Cache STALE] Missing fields, regenerating for batch ${batchId}`);
    await invalidateBatchCache(batchId);
    // Fall through to regenerate analysis
  }
}
```

### Option 3: Add Cache Invalidation Endpoint

```javascript
// DELETE /api/content/batch/cache/:batchId
async function invalidateBatchCache(req, res) {
  const { batchId } = req.params;

  await pool.query(`
    DELETE FROM batch_analysis_cache WHERE batch_id = $1
  `, [batchId]);

  res.json({ message: `Cache invalidated for ${batchId}` });
}
```

## Summary

✅ **Fixed:** Deleted 2 old cache entries without `interview_questions`
⚠️ **Action Required:** Clear browser localStorage and run fresh batch analysis
✅ **Verified:** Remaining cache has 221 extracted questions
✅ **Future:** Consider adding cache versioning to auto-invalidate stale caches

---

**Issue Date:** November 14, 2025
**Status:** ✅ Backend cache cleared, user action required (clear browser localStorage)
**Impact:** Only affects batch analyses run BEFORE interview_questions feature was added
