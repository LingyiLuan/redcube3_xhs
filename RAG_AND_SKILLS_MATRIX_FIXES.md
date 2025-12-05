# RAG Determinism & Skills Matrix Fixes

**Date**: November 12, 2025
**Status**: ✅ BOTH FIXES APPLIED AND DEPLOYED

---

## Issues Fixed

### Issue 1: RAG Vector Search Non-Deterministic
**Problem**: Reports showing different data on every refresh despite same seed posts
**Root Cause**: pgvector similarity search using `ORDER BY embedding <=> $1::vector` without stable tiebreaker
**Impact**: When multiple posts have identical/similar distance scores, PostgreSQL returns them in random order

### Issue 2: Skills Priority Matrix Shows "0 posts"
**Problem**: Component displays "Based on 0 interview posts" despite showing skill dots
**Root Cause**: `totalPosts` prop not passed from parent component (MultiPostPatternReport.vue)
**Impact**: Users can't trust if the data is real or how many posts it represents

---

## Fixes Applied

### Fix 1: RAG Vector Search Stable Tiebreaker ✅

**File**: `/services/content-service/src/controllers/analysisController.js`
**Line**: 348

**Change**:
```javascript
// BEFORE (non-deterministic):
ORDER BY embedding <=> $1::vector
LIMIT $2

// AFTER (deterministic):
ORDER BY embedding <=> $1::vector, post_id ASC
LIMIT $2
```

**How it works**:
- Primary sort: Vector similarity (cosine distance)
- Secondary sort: `post_id ASC` (stable tiebreaker)
- Result: Same embedding query → same posts in same order, always

**Deployment**:
```bash
docker cp services/content-service/src/controllers/analysisController.js \
  redcube3_xhs-content-service-1:/app/src/controllers/analysisController.js
docker restart redcube3_xhs-content-service-1
```

**Verification**:
```bash
docker exec redcube3_xhs-content-service-1 \
  grep -A 2 "ORDER BY embedding" /app/src/controllers/analysisController.js
# Output: ORDER BY embedding <=> $1::vector, post_id ASC ✅
```

---

### Fix 2: Skills Priority Matrix Total Posts Prop ✅

**File**: `/vue-frontend/src/components/ResultsPanel/MultiPostPatternReport.vue`
**Line**: 706

**Change**:
```vue
<!-- BEFORE (missing totalPosts): -->
<SkillsPriorityMatrix :skills="skillsForPriorityMatrix" />

<!-- AFTER (with totalPosts): -->
<SkillsPriorityMatrix :skills="skillsForPriorityMatrix" :totalPosts="benchmarkPostsCount" />
```

**Data Flow**:
1. Backend computes `total_posts_analyzed` in pattern_analysis summary
2. Frontend receives it in `props.patterns.summary.total_posts_analyzed`
3. `benchmarkPostsCount` computed property extracts it (line 1295-1298)
4. Now passed to SkillsPriorityMatrix component as `totalPosts` prop
5. Component displays correct count instead of defaulting to 0

**Deployment**:
- Frontend: Auto-deployed via Vite HMR (hot module replacement)
- No manual deployment needed

---

## Testing Instructions

### Test 1: RAG Determinism
1. Open any batch analysis report
2. Note the exact data in all sections (skills, companies, questions, etc.)
3. Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+F5)
4. **Expected**: All data should be IDENTICAL
5. **Before fix**: Data would change slightly on each refresh

### Test 2: Skills Priority Matrix Post Count
1. Open any batch analysis report with skills data
2. Scroll to "Skills Priority Matrix" section
3. Look at the subtitle: "Showing N skills • Based on X interview posts"
4. **Expected**: X should match the "total posts analyzed" shown in summary
5. **Before fix**: X was always 0

### Test 3: Comprehensive Determinism Check
Run the same batch analysis 3 times in a row:
```bash
# Refresh 1
curl http://localhost:5173/batch-analysis/{id} > output1.json

# Refresh 2
curl http://localhost:5173/batch-analysis/{id} > output2.json

# Refresh 3
curl http://localhost:5173/batch-analysis/{id} > output3.json

# Compare
diff output1.json output2.json  # Should be IDENTICAL
diff output2.json output3.json  # Should be IDENTICAL
```

---

## Technical Details

### Why pgvector Needs Stable Tiebreaker

pgvector uses cosine distance operator `<=>` which returns float values:
- Distance: 0.0 = identical vectors
- Distance: 1.0 = completely different vectors
- Multiple posts can have distance 0.123456789 (exact same similarity)

Without tiebreaker:
```sql
SELECT * FROM posts ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector LIMIT 10;
-- Returns: random subset of posts with similar distances
```

With tiebreaker:
```sql
SELECT * FROM posts
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector, post_id ASC
LIMIT 10;
-- Returns: deterministic subset (same posts every time)
```

### Why Skills Matrix Showed 0

Vue component props have default values:
```typescript
interface Props {
  skills: Skill[]
  totalPosts?: number  // Optional
}

const props = withDefaults(defineProps<Props>(), {
  totalPosts: 0  // Defaults to 0 if not provided
})
```

Parent component had the data but didn't pass it:
```typescript
// Line 1295-1298: Data exists in computed property
const benchmarkPostsCount = computed(() => {
  return props.patterns.summary?.total_posts_analyzed || 0
})

// Line 706: But wasn't being passed to child component
<SkillsPriorityMatrix :skills="skillsForPriorityMatrix" />
// ❌ Missing: :totalPosts="benchmarkPostsCount"
```

---

## Impact

### User Experience
✅ Reports now bookmarkable/shareable (same URL = same report)
✅ Consistent data across refreshes builds trust
✅ Skills Priority Matrix shows actual post count
✅ No more "Why did my data change?" confusion

### Technical Benefits
✅ Deterministic output enables caching
✅ Easier to debug (reproducible results)
✅ Better for testing and QA
✅ Reduces backend load (can cache pattern_analysis)

### Performance
- **Backend**: Negligible impact (post_id already indexed)
- **Frontend**: Zero impact (just passing existing computed value)

---

## Files Modified

### Backend (1 file)
- `services/content-service/src/controllers/analysisController.js`
  - Line 348: Added `, post_id ASC` to RAG query

### Frontend (1 file)
- `vue-frontend/src/components/ResultsPanel/MultiPostPatternReport.vue`
  - Line 706: Added `:totalPosts="benchmarkPostsCount"` prop

**Total**: 2 files, 2 lines changed

---

## Deployment Status

### Backend
- ✅ File updated locally
- ✅ Copied to Docker container
- ✅ Service restarted successfully
- ✅ All 7 schedulers running
- ✅ Verified fix deployed in container

### Frontend
- ✅ File updated locally
- ✅ Auto-deployed via Vite HMR
- ✅ No restart required

---

## Related Previous Fixes

This session builds on previous determinism fixes:
1. Frontend hash-based seeded jitter (MultiPostPatternReport.vue)
2. Backend deterministic fallback query (replaced `ORDER BY RANDOM()`)
3. Backend stable sort tiebreakers (8 locations in analysisController.js)

All documented in: [DETERMINISTIC_REPORT_FIXES_COMPLETE.md](DETERMINISTIC_REPORT_FIXES_COMPLETE.md)

---

## Rollback Procedure

If issues arise, revert changes:

### Backend
```bash
cd /Users/luan02/Desktop/redcube3_xhs
git checkout services/content-service/src/controllers/analysisController.js
docker cp services/content-service/src/controllers/analysisController.js \
  redcube3_xhs-content-service-1:/app/src/controllers/analysisController.js
docker restart redcube3_xhs-content-service-1
```

### Frontend
```bash
cd /Users/luan02/Desktop/redcube3_xhs/vue-frontend
git checkout src/components/ResultsPanel/MultiPostPatternReport.vue
# Vite HMR will auto-reload
```

---

## Verification Checklist

- [x] RAG query has stable tiebreaker in local file
- [x] RAG query has stable tiebreaker in Docker container
- [x] Skills Priority Matrix receives totalPosts prop
- [x] Backend service restarted successfully
- [x] All 7 schedulers running
- [ ] User testing: RAG determinism verified
- [ ] User testing: Skills Matrix shows correct post count

---

**Implemented By**: Claude Code
**Session Date**: November 12, 2025
**Ready for**: User testing and validation
