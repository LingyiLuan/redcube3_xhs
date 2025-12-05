# Batch Analysis Caching Implementation

**Date**: November 12, 2025
**Purpose**: Implement caching to ensure deterministic batch analysis reports

---

## Summary

Implemented caching system to solve non-deterministic report generation. The root cause was that user post embeddings were generated fresh on every request, causing different RAG results and different pattern_analysis outputs.

### Solution

1. **Cache user post embeddings** - Generate once, reuse forever
2. **Cache pattern_analysis results** - Compute once, return cached version
3. **Use batch_id as cache key** - Each batch analysis has unique ID

---

## Database Changes

### New Table: `batch_analysis_cache`

```sql
CREATE TABLE batch_analysis_cache (
  id SERIAL PRIMARY KEY,
  batch_id VARCHAR(100) UNIQUE NOT NULL,
  user_post_embeddings JSONB,  -- [{text, embedding}, ...]
  pattern_analysis JSONB,       -- Full pattern_analysis object
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  embedding_model VARCHAR(100),
  cache_hits INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Migration File**: `shared/database/init/19-batch-analysis-caching.sql`

---

## Backend Implementation

### File: `services/content-service/src/controllers/analysisController.js`

### New Helper Functions (to add at end of file):

```javascript
/**
 * Get cached batch analysis data
 * Returns { userPostEmbeddings, patternAnalysis } or null if not cached
 */
async function getCachedBatchData(batchId) {
  try {
    const result = await pool.query(`
      SELECT user_post_embeddings, pattern_analysis
      FROM batch_analysis_cache
      WHERE batch_id = $1
    `, [batchId]);

    if (result.rows.length === 0) {
      return null;
    }

    // Update cache hit counter and last accessed time
    await pool.query(`
      UPDATE batch_analysis_cache
      SET cache_hits = cache_hits + 1,
          last_accessed_at = CURRENT_TIMESTAMP
      WHERE batch_id = $1
    `, [batchId]);

    logger.info(`[Cache HIT] Retrieved cached data for batch ${batchId}`);
    return {
      userPostEmbeddings: result.rows[0].user_post_embeddings,
      patternAnalysis: result.rows[0].pattern_analysis
    };
  } catch (error) {
    logger.error(`[Cache] Error retrieving cache for batch ${batchId}:`, error.message);
    return null;
  }
}

/**
 * Save batch analysis data to cache
 */
async function saveBatchCache(batchId, userPostEmbeddings, patternAnalysis, embeddingModel) {
  try {
    await pool.query(`
      INSERT INTO batch_analysis_cache (
        batch_id,
        user_post_embeddings,
        pattern_analysis,
        embedding_model
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (batch_id) DO UPDATE SET
        user_post_embeddings = EXCLUDED.user_post_embeddings,
        pattern_analysis = EXCLUDED.pattern_analysis,
        embedding_model = EXCLUDED.embedding_model,
        cached_at = CURRENT_TIMESTAMP
    `, [
      batchId,
      JSON.stringify(userPostEmbeddings),
      JSON.stringify(patternAnalysis),
      embeddingModel
    ]);

    logger.info(`[Cache SAVE] Saved cache for batch ${batchId}`);
  } catch (error) {
    logger.error(`[Cache] Error saving cache for batch ${batchId}:`, error.message);
    // Don't throw - caching is optional enhancement
  }
}

/**
 * Retrieve similar posts using cached embeddings
 * @param {Array} userPostEmbeddings - [{text, embedding}, ...]
 * @param {Number} similarPerPost - Number of similar posts per user post
 * @returns {Array} Deduplicated similar posts
 */
async function retrieveSimilarPostsWithCachedEmbeddings(userPostEmbeddings, similarPerPost = 50) {
  const allSimilarPosts = [];
  const seenPostIds = new Set();

  for (const {text, embedding} of userPostEmbeddings) {
    try {
      // Find similar posts using the cached embedding
      const similarPosts = await findSimilarPostsByEmbedding(embedding, similarPerPost);

      // Add to collection (deduplicate by post_id)
      for (const similar of similarPosts) {
        if (!seenPostIds.has(similar.post_id)) {
          seenPostIds.add(similar.post_id);
          allSimilarPosts.push(similar);
        }
      }
    } catch (error) {
      logger.error(`[RAG Cached] Error retrieving similar posts: ${error.message}`);
    }
  }

  logger.info(`[RAG Cached] Retrieved ${allSimilarPosts.length} unique similar posts using cached embeddings`);
  return allSimilarPosts;
}
```

---

### Main Batch Analysis Function Changes

**Location**: `analyzeBatch` function, around line 100-250

**Add BEFORE STEP 3 (RAG Retrieval)**:

```javascript
// STEP 2.5: Check for cached data
console.time('⏱️  STEP 2.5: Cache Check');
const cachedData = await getCachedBatchData(batchId);
let userPostEmbeddings = null;
let patternAnalysis = null;

if (cachedData && cachedData.patternAnalysis) {
  logger.info(`[Batch Analysis] 🎯 CACHE HIT - Using cached pattern_analysis`);
  result.pattern_analysis = cachedData.patternAnalysis;
  result.rag_metadata = {
    seed_posts: savedAnalyses.length,
    rag_posts: cachedData.patternAnalysis.summary?.total_posts_analyzed - savedAnalyses.length || 0,
    total_posts: cachedData.patternAnalysis.summary?.total_posts_analyzed || savedAnalyses.length,
    seed_companies: Array.from(seedCompanies),
    cache_hit: true
  };
  console.timeEnd('⏱️  STEP 2.5: Cache Check');

  // Skip RAG retrieval and pattern analysis - we have cached results
  console.log('✅ Using cached pattern_analysis - skipping RAG & pattern computation');
} else {
  logger.info(`[Batch Analysis] ⚡ CACHE MISS - Generating fresh analysis`);
  console.timeEnd('⏱️  STEP 2.5: Cache Check');
```

**REPLACE STEP 3 (RAG Retrieval)** - around line 157-161:

```javascript
  // STEP 3: RAG Retrieval (with caching)
  console.time('⏱️  STEP 3: RAG Retrieval');
  logger.info(`[Batch Analysis] Retrieving similar posts from RAG database...`);

  let ragPosts;
  if (cachedData && cachedData.userPostEmbeddings) {
    // Use cached embeddings
    logger.info(`[Batch Analysis] Using ${cachedData.userPostEmbeddings.length} cached embeddings`);
    userPostEmbeddings = cachedData.userPostEmbeddings;
    ragPosts = await retrieveSimilarPostsWithCachedEmbeddings(userPostEmbeddings, 50);
  } else {
    // Generate fresh embeddings and cache them
    logger.info(`[Batch Analysis] Generating fresh embeddings for ${posts.length} user posts`);
    userPostEmbeddings = [];

    for (const post of posts) {
      const embedding = await generateEmbedding(post.text);
      userPostEmbeddings.push({
        text: post.text,
        embedding: embedding
      });
    }

    ragPosts = await retrieveSimilarPostsWithCachedEmbeddings(userPostEmbeddings, 50);
  }

  console.timeEnd('⏱️  STEP 3: RAG Retrieval');
```

**AFTER STEP 5 (Pattern Analysis)** - around line 211:

```javascript
  console.timeEnd('⏱️  STEP 5: Pattern Analysis');

  // STEP 6: Save to cache
  console.time('⏱️  STEP 6: Save Cache');
  await saveBatchCache(batchId, userPostEmbeddings, patternAnalysis, 'BAAI/bge-small-en-v1.5');
  console.timeEnd('⏱️  STEP 6: Save Cache');
}  // Close the else block from cache check
```

---

## Flow Diagram

### First Request (Cache Miss):
```
User submits batch → Generate embeddings → RAG retrieval
→ Compute pattern_analysis → Save to cache → Return result
```

### Subsequent Requests (Cache Hit):
```
User refreshes page → Check cache → Found!
→ Return cached pattern_analysis → Done (10x faster)
```

---

## Testing

### Test 1: Verify Cache is Working

1. Submit new batch analysis
2. Check database:
```sql
SELECT batch_id, cached_at, cache_hits
FROM batch_analysis_cache
ORDER BY cached_at DESC LIMIT 5;
```

3. Refresh the report page
4. Check cache_hits incremented

### Test 2: Verify Determinism

1. Submit batch analysis
2. Note exact data (skills, companies, scatter plot positions)
3. Refresh page 5 times
4. **Expected**: All data IDENTICAL on every refresh

---

## Performance Impact

### Before Caching:
- Every refresh: 15-30 seconds
- Generates fresh embeddings: ~5-10s
- Computes pattern_analysis: ~5-10s
- Heavy API calls to HuggingFace

### After Caching:
- First request: 15-30 seconds (same as before)
- Cached requests: **0.5-2 seconds** (10-20x faster!)
- No embedding generation
- No pattern computation
- Just database query

---

## Rollback

If issues arise:

```sql
-- Drop caching table
DROP TABLE IF EXISTS batch_analysis_cache;
```

Then revert code changes in analysisController.js.

---

## Future Enhancements

1. **Cache Expiration**: Add TTL to invalidate old caches
2. **Cache Invalidation**: Add endpoint to manually clear cache
3. **Cache Analytics**: Dashboard showing cache hit rates
4. **Partial Caching**: Cache embeddings separately from pattern_analysis

---

**Status**: Ready for implementation
**Estimated Time**: 30-45 minutes
**Risk Level**: Low (caching is optional, failures gracefully degrade)
