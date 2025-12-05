# BATCH ANALYSIS COMPLETE FLOW DOCUMENTATION

## PURPOSE
Document every single step of how batch analysis works so we can make single analysis work exactly the same way.

---

## STEP 1: USER INPUT (Frontend)

**File:** `vue-frontend/src/components/Nodes/AnalysisNode.vue`

**User Action:**
- User inputs multiple posts in Workflow Lab
- Clicks "Run Analysis" button

**Code Flow:**
```javascript
// Line 119-121: Batch mode detection
if (analysisMode.value === 'batch') {
  const result = await workflowStore.executeBatchAnalysis(validNodes)
}
```

---

## STEP 2: FRONTEND API CALL

**File:** `vue-frontend/src/stores/workflowStore.ts`

**Function:** `executeBatchAnalysis()`

```javascript
// Line 593-598: Call batch analysis service
const batchResult = await analysisService.analyzeBatch(
  posts,      // Array of {id, text}
  userId,
  true,       // analyzeConnections
  signal
)
```

**File:** `vue-frontend/src/services/analysisService.ts`

**Function:** `analyzeBatch()`

```javascript
// Line 61-78: Make API request
async analyzeBatch(
  posts: Array<{ id: string; text: string }>,
  userId?: number,
  analyzeConnections = true,
  signal?: AbortSignal
) {
  const validPosts = posts.filter(p => p.text?.trim())

  const response = await apiClient.post('/analyze/batch', {
    posts: validPosts,
    userId,
    analyzeConnections
  }, {
    signal
  })

  return response.data
}
```

**API Endpoint:** `POST /api/content/analyze/batch`

---

## STEP 3: BACKEND PROCESSING

**File:** `services/content-service/src/routes/contentRoutes.js`

```javascript
// Line 105: Route definition
router.post('/analyze/batch', optionalAuth, analyzeBatchPosts);
```

**File:** `services/content-service/src/controllers/analysisController.js`

**Function:** `analyzeBatchPosts()`

### 3.1: Generate Batch ID
```javascript
// Line 149-155: Create deterministic hash from post content
const contentHash = crypto
  .createHash('sha256')
  .update(posts.map(p => p.text).sort().join(''))
  .digest('hex')
  .substring(0, 16);

const batchId = `batch_${userId}_${contentHash}`;
```

### 3.2: Check Cache
```javascript
// Line 157-172: Try to get from Redis cache
const cacheKey = `batch:${batchId}`;
const cachedResult = await redis.get(cacheKey);

if (cachedResult) {
  logger.info(`[Batch Analysis] Cache HIT for batchId: ${batchId}`);
  const parsedResult = JSON.parse(cachedResult);

  return res.json({
    ...parsedResult,
    batchId: batchId,
    cached: true,
    timestamp: new Date()
  });
}
```

### 3.3: Process Each Post (if not cached)
```javascript
// Line 174-185: Analyze each post with AI
logger.info(`[Batch Analysis] Cache MISS - analyzing ${posts.length} posts`);

const analyses = await Promise.all(
  posts.map(async (post) => {
    const analysis = await analyzeText(post.text);
    return {
      id: post.id,
      text: post.text,
      analysis: analysis
    };
  })
);
```

**File:** `services/content-service/src/services/aiService.js`

**Function:** `analyzeText()` - Calls OpenRouter API to get:
- company
- role
- outcome
- difficulty
- technical_skills
- stage
- etc.

### 3.4: Generate Embeddings for Each Post
```javascript
// Line 187-197: Generate embeddings for similarity search
const postsWithEmbeddings = await Promise.all(
  analyses.map(async (item) => {
    try {
      const embedding = await generateEmbedding(item.text);
      return { ...item, embedding };
    } catch (err) {
      logger.warn(`Embedding failed for post ${item.id}:`, err.message);
      return { ...item, embedding: null };
    }
  })
);
```

**File:** `services/content-service/src/services/embeddingService.js`

**Function:** `generateEmbedding()` - Calls embedding server to create vector

### 3.5: Find Similar Posts from Database (RAG)
```javascript
// Line 199-224: For each post, find similar posts in database
const similar_posts = [];

for (const post of postsWithEmbeddings) {
  if (post.embedding) {
    try {
      const similar = await findSimilarPostsByEmbedding(post.embedding, 30);

      similar_posts.push({
        seed_post_id: post.id,
        similar_posts: similar.map(s => ({
          post_id: s.post_id,
          company: s.company,
          role_type: s.role_type,
          outcome: s.outcome,
          difficulty: s.difficulty,
          tech_stack: s.tech_stack,
          similarity_score: s.similarity_score,
          body_text: s.body_text,
          summary: s.summary
        }))
      });
    } catch (err) {
      logger.warn(`Similar posts search failed for ${post.id}:`, err.message);
    }
  }
}
```

**Function:** `findSimilarPostsByEmbedding()` - Uses pgvector to find similar posts:

```javascript
// Line 256-280: Query database with vector similarity
async function findSimilarPostsByEmbedding(embedding, limit = 30) {
  const result = await pool.query(`
    SELECT
      post_id,
      metadata->>'company' as company,
      role_type,
      outcome,
      metadata->>'difficulty' as difficulty,
      tech_stack,
      body_text,
      summary,
      1 - (embedding <=> $1::vector) as similarity_score
    FROM scraped_posts
    WHERE embedding IS NOT NULL
      AND outcome IS NOT NULL
      AND role_type IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `, [JSON.stringify(embedding), limit]);

  return result.rows;
}
```

### 3.6: Extract Patterns from Similar Posts
```javascript
// Line 226-243: Analyze patterns across all similar posts
const pattern_analysis = extractPatternsFromSimilarPosts(
  postsWithEmbeddings,
  similar_posts
);
```

**Function:** `extractPatternsFromSimilarPosts()` - Aggregates data:

```javascript
// Line 380-480: Pattern extraction logic
function extractPatternsFromSimilarPosts(seedPosts, similarPostsData) {
  // 1. Aggregate all similar posts
  const allSimilarPosts = [];
  similarPostsData.forEach(group => {
    allSimilarPosts.push(...group.similar_posts);
  });

  // 2. Count outcomes
  const outcomes = {};
  allSimilarPosts.forEach(post => {
    outcomes[post.outcome] = (outcomes[post.outcome] || 0) + 1;
  });

  // 3. Count companies
  const companies = {};
  allSimilarPosts.forEach(post => {
    if (post.company) {
      companies[post.company] = (companies[post.company] || 0) + 1;
    }
  });

  // 4. Count roles
  const roles = {};
  allSimilarPosts.forEach(post => {
    if (post.role_type) {
      roles[post.role_type] = (roles[post.role_type] || 0) + 1;
    }
  });

  // 5. Aggregate skills
  const skillCounts = {};
  allSimilarPosts.forEach(post => {
    if (post.tech_stack && Array.isArray(post.tech_stack)) {
      post.tech_stack.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    }
  });

  // 6. Calculate average difficulty
  const difficultiesWithValues = allSimilarPosts
    .map(p => parseFloat(p.difficulty))
    .filter(d => !isNaN(d) && d > 0);

  const avgDifficulty = difficultiesWithValues.length > 0
    ? difficultiesWithValues.reduce((sum, d) => sum + d, 0) / difficultiesWithValues.length
    : null;

  // 7. Calculate success rate
  const passedCount = outcomes['passed'] || 0;
  const totalWithOutcome = Object.values(outcomes).reduce((sum, count) => sum + count, 0);
  const successRate = totalWithOutcome > 0
    ? (passedCount / totalWithOutcome) * 100
    : null;

  return {
    totalSimilarPosts: allSimilarPosts.length,
    outcomes: outcomes,
    topCompanies: Object.entries(companies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([company, count]) => ({ company, count })),
    topRoles: Object.entries(roles)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([role, count]) => ({ role, count })),
    topSkills: Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill, count]) => ({ skill, count })),
    averageDifficulty: avgDifficulty,
    successRate: successRate,
    outcomeDistribution: outcomes
  };
}
```

### 3.7: Build Final Response
```javascript
// Line 245-260: Construct response object
const batchResult = {
  batchId: batchId,
  individual_analyses: analyses.map(a => ({
    id: a.id,
    text: a.text,
    ...a.analysis
  })),
  similar_posts: similar_posts,
  pattern_analysis: pattern_analysis,
  features_available: {
    embeddings: true,
    rag_similar_posts: similar_posts.length > 0,
    pattern_extraction: true
  },
  timestamp: new Date(),
  cached: false
};

// Store in cache
await redis.setex(cacheKey, 86400, JSON.stringify(batchResult));

res.json(batchResult);
```

---

## STEP 4: FRONTEND RECEIVES RESPONSE

**File:** `vue-frontend/src/components/Nodes/AnalysisNode.vue`

```javascript
// Line 134-186: Process batch result
const batchId = result.batchId  // e.g., "batch_1_abc123xyz"

const reportData = {
  id: `report-${batchId}`,
  nodeId: props.id,
  workflowId: 'default-workflow',
  batchId: batchId,
  result: {
    ...result,
    type: 'batch',
    pattern_analysis: result.pattern_analysis,
    individual_analyses: result.individual_analyses,
    similar_posts: result.similar_posts
  },
  timestamp: new Date(),
  isRead: false
}

reportsStore.addReport(reportData)
```

---

## STEP 5: VIEW REPORT

**User clicks "View Report" button**

**Route:** `/reports/report-batch_1_abc123xyz`

**File:** `vue-frontend/src/components/ResultsPanel/ReportViewer.vue`

### 5.1: Load Report from Store
```javascript
// Line 270-288: Check if data exists
const report = reportsStore.getReportById(props.reportId)

// If pattern_analysis is missing, fetch from backend
if (!report.result?.pattern_analysis) {
  const batchId = extractBatchId(props.reportId)
  await fetchReportFromBackend(batchId)
}
```

### 5.2: Fetch from Backend Cache (if needed)
```javascript
// Line 188-215: Fetch cached batch report
async function fetchReportFromBackend(batchId: string) {
  const response = await analysisService.getCachedBatchReport(batchId)

  // Update local store with fetched data
  reportsStore.updateReport(props.reportId, {
    pattern_analysis: response.pattern_analysis,
    similar_posts: response.similar_posts
  })
}
```

**API Endpoint:** `GET /api/content/batch/report/${batchId}`

---

## KEY DATA STRUCTURES

### Batch Analysis Response
```javascript
{
  batchId: "batch_1_abc123xyz",
  individual_analyses: [
    {
      id: "post-1",
      text: "...",
      company: "Google",
      role: "SWE",
      outcome: "passed",
      difficulty: 3,
      technical_skills: ["Python", "SQL"],
      // ... all AI analysis fields
    }
  ],
  similar_posts: [
    {
      seed_post_id: "post-1",
      similar_posts: [
        {
          post_id: "scraped-123",
          company: "Google",
          role_type: "SWE",
          outcome: "passed",
          difficulty: 3,
          tech_stack: ["Python", "Java"],
          similarity_score: 0.92,
          body_text: "...",
          summary: "..."
        }
      ]
    }
  ],
  pattern_analysis: {
    totalSimilarPosts: 150,
    outcomes: { passed: 90, failed: 60 },
    topCompanies: [
      { company: "Google", count: 45 },
      { company: "Meta", count: 32 }
    ],
    topRoles: [
      { role: "SWE", count: 120 }
    ],
    topSkills: [
      { skill: "Python", count: 89 },
      { skill: "SQL", count: 67 }
    ],
    averageDifficulty: 3.2,
    successRate: 60.0,
    outcomeDistribution: { passed: 90, failed: 60 }
  },
  features_available: {
    embeddings: true,
    rag_similar_posts: true,
    pattern_extraction: true
  },
  timestamp: "2025-11-19T...",
  cached: false
}
```

---

## CRITICAL INSIGHTS FOR SINGLE ANALYSIS

### What Batch Analysis Does:
1. ✅ Generates embeddings for each input post
2. ✅ Finds similar posts from database using pgvector
3. ✅ Aggregates patterns across ALL similar posts
4. ✅ Calculates success rates, avg difficulty, top skills, etc.
5. ✅ Returns comprehensive pattern_analysis object
6. ✅ Caches results in Redis with deterministic batchId

### What Single Analysis SHOULD Do (but might not be):
1. ❓ Generate embedding for the input text
2. ❓ Find similar posts from database using pgvector
3. ❓ Compute metrics from similar posts (success rate, avg difficulty)
4. ❓ Return data in proper nested structure
5. ❓ Ensure all fields match what BenchmarkSection expects

---

## NEXT STEPS

Compare this batch flow to single analysis flow to find the gaps!
