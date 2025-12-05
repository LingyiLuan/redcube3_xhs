# How to Test and Verify RAG System

## Current Database Status

```sql
-- Run this to check your data:
docker exec redcube_postgres psql -U postgres -d redcube_content -c "
SELECT
  COUNT(*) as total_posts,
  COUNT(CASE WHEN embedding_status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN embedding_status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN embedding_status = 'pending' THEN 1 END) as pending
FROM scraped_posts;
"
```

**Your Current State (as of now):**
- Total posts: 187
- Completed embeddings: 0
- Failed embeddings: 187 (invalid OpenAI key)
- Pending embeddings: 0

## 🧪 Step-by-Step Testing Guide

### Test 1: Verify Workers Are Running

```bash
# Check if embedding worker is active
docker logs redcube3_xhs-content-service-1 2>&1 | grep -i "worker"

# Expected output:
# [INFO] [EmbeddingWorker] Worker started and ready to process jobs
# [INFO] [NLP Worker] Worker started and ready to process NLP extraction jobs
```

### Test 2: Check RAG Endpoints Are Available

```bash
# Test 1: Health check
curl http://localhost:8080/api/content/health
# Expected: {"status":"OK","service":"content-service-v2","aiProvider":"DeepSeek+OpenAI"}

# Test 2: Embedding stats
curl http://localhost:8080/api/content/embeddings/stats
# Expected: Shows 0 completed, 187 pending/failed

# Test 3: RAG trending (works without embeddings)
curl "http://localhost:8080/api/content/rag/trending?timeframe=30+days&limit=5"
# Expected: {"success":true,"timeframe":"30 days","totalPosts":0,"trending":[]}
```

### Test 3: Compare Old vs New Analysis Endpoints

**Test OLD endpoint (Phase 1-4)** - Uses DeepSeek, no RAG:
```bash
curl -X POST http://localhost:8080/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Google L5 system design interview experience. Asked about designing distributed cache. Got offer after 6 rounds.",
    "userId": 1
  }' | jq .
```

**Expected Response (Generic Analysis):**
```json
{
  "id": 4,
  "company": "Google",
  "role": "L5 system design",
  "sentiment": "positive",
  "interview_topics": ["system design", "distributed systems"],
  "difficulty_level": "hard",
  "outcome": "offer",
  "key_insights": [],  // ❌ Empty - no context used
  "aiProvider": "OpenRouter"
}
```

**Test NEW endpoint (Phase 6 RAG)** - Uses GPT-4 + context:
```bash
curl -X POST http://localhost:8080/api/content/rag/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What should I prepare for Google L5 system design interview?",
    "company": "Google",
    "level": "L5",
    "role": "SWE",
    "contextSize": 5
  }' | jq .
```

**Expected Response (WITH embeddings):**
```json
{
  "success": true,
  "analysis": "Based on 5 recent Google L5 interview experiences:\n\n1. Core Topics:\n- Distributed systems (4/5 mentions)...",
  "sources": [
    {
      "post_id": "1abc123",
      "title": "Google L5 system design brutal",
      "similarity": 0.92,
      "outcome": "offer"
    }
  ],
  "insights": {
    "common_topics": ["distributed systems", "scaling"],
    "success_rate": "60%"
  },
  "metadata": {
    "retrieved_posts": 5,
    "avg_similarity": 0.85
  }
}
```

**Expected Response (WITHOUT embeddings - current state):**
```json
{
  "error": "Analysis failed",
  "message": "OpenAI API error: 401 Incorrect API key provided..."
}
```

## 🔑 With OpenAI Key - Full Testing Flow

### Step 1: Add OpenAI Key
```bash
# Edit .env file
nano .env

# Change this line:
OPENAI_API_KEY=your-openai-api-key-here
# To:
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Save and restart
docker-compose restart content-service
```

### Step 2: Generate Embeddings for All Posts
```bash
# Queue embedding generation job
curl -X POST http://localhost:8080/api/content/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 187}'

# Expected response:
# {
#   "success": true,
#   "message": "Embedding generation job queued",
#   "jobId": "embedding-batch-1761511112440",
#   "batchSize": 187
# }
```

### Step 3: Monitor Progress
```bash
# Watch the worker processing (run in separate terminal)
docker logs -f redcube3_xhs-content-service-1 | grep -i embedding

# Check stats every 10 seconds
watch -n 10 'curl -s http://localhost:8080/api/content/embeddings/stats | jq .database'
```

**Progress Output Example:**
```
Iteration 1 (after 30 seconds):
{
  "total_posts": "187",
  "posts_with_embeddings": "100",
  "pending": "87",
  "completed": "100",
  "coverage_pct": "53.48"
}

Iteration 2 (after 60 seconds):
{
  "total_posts": "187",
  "posts_with_embeddings": "187",
  "pending": "0",
  "completed": "187",
  "coverage_pct": "100.00"
}
```

### Step 4: Verify Embeddings in Database
```bash
# Check that embeddings are stored
docker exec redcube_postgres psql -U postgres -d redcube_content -c "
SELECT
  post_id,
  title,
  embedding_status,
  embedding_generated_at,
  array_length(embedding::float[], 1) as embedding_dimensions
FROM scraped_posts
WHERE embedding IS NOT NULL
LIMIT 3;
"
```

**Expected Output:**
```
 post_id |              title              | embedding_status | embedding_generated_at | embedding_dimensions
---------+---------------------------------+------------------+------------------------+---------------------
 1oacq3g | Director wants lunch with intern| completed        | 2025-10-27 02:15:33    | 1536
 1oagds6 | Future of work employment       | completed        | 2025-10-27 02:15:34    | 1536
 1oai457 | EE vs CS for student            | completed        | 2025-10-27 02:15:35    | 1536
```

### Step 5: Test Semantic Search
```bash
curl -X POST http://localhost:8080/api/content/embeddings/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Google system design interview tips",
    "matchCount": 5,
    "matchThreshold": 0.6
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "query": "Google system design interview tips",
  "matches": [
    {
      "post_id": "1abc123",
      "title": "Google L5 system design - brutal but got offer",
      "similarity": 0.89,
      "company": "Google",
      "outcome": "offer",
      "excerpt": "Just finished my Google L5 interview. System design round was tough..."
    },
    {
      "post_id": "1def456",
      "title": "How I prepared for Google system design",
      "similarity": 0.85,
      "outcome": "offer",
      "excerpt": "After 3 months of studying Grokking System Design..."
    }
  ],
  "metadata": {
    "total_matches": 5,
    "avg_similarity": 0.82,
    "search_time_ms": 45
  }
}
```

### Step 6: Test RAG Analysis (The Full Pipeline!)
```bash
curl -X POST http://localhost:8080/api/content/rag/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the most common mistakes in Google system design interviews?",
    "company": "Google",
    "contextSize": 5
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "query": "What are the most common mistakes in Google system design interviews?",
  "analysis": "Based on 5 recent Google system design interview experiences from our database:\n\n**Most Common Mistakes:**\n\n1. **Not Discussing Tradeoffs** (4/5 posts mentioned)\n   - Candidates who failed often jumped to solutions without explaining why\n   - Successful candidates spent 30-40% of time on tradeoff discussions\n   - Example from Post #2: 'Interviewer pushed back when I didn't explain CAP theorem implications'\n\n2. **Over-Engineering Solutions** (3/5 posts)\n   - Adding unnecessary complexity (microservices, Kafka) for small scale\n   - Post #4 rejection: 'Started with distributed system for 1000 users'\n   - Recommendation: Start simple, then scale up when asked\n\n3. **Weak Fundamentals** (3/5 posts)\n   - Not understanding basics: load balancing, caching, databases\n   - Post #1 success factor: 'Solid understanding of Redis vs Memcached'\n\n4. **Poor Communication** (2/5 posts)\n   - Not explaining thought process\n   - Post #5: 'Interviewer had to ask too many clarifying questions'\n\n**Success Patterns:**\n- Average prep time for offers: 2.5 months\n- Resources mentioned: System Design Primer (4/5), Designing Data-Intensive Applications (3/5)\n- Mock interviews: 4/5 successful candidates did 10+ mocks\n\n**Key Insights:**\n- Google L4/L5 system design is typically 45-60 minutes\n- 1-2 design problems per round\n- Expect deep dives into specific components\n- Scalability questions: 100M users, 10K QPS typical benchmarks",

  "sources": [
    {
      "post_id": "1abc123",
      "title": "Google L5 system design - learned from my mistakes",
      "similarity": 0.92,
      "outcome": "reject",
      "key_quote": "Didn't discuss tradeoffs enough, interviewer kept asking 'why?'"
    },
    {
      "post_id": "1def456",
      "title": "Finally got Google L4 offer after 3 attempts",
      "similarity": 0.88,
      "outcome": "offer",
      "key_quote": "Mock interviews with peers made huge difference"
    },
    {
      "post_id": "1ghi789",
      "title": "Google system design feedback - what went wrong",
      "similarity": 0.85,
      "outcome": "reject",
      "key_quote": "Over-engineered the solution, should have started simpler"
    }
  ],

  "insights": {
    "total_posts_analyzed": 5,
    "success_rate": "40%",
    "avg_similarity_score": 0.86,
    "common_topics": ["distributed systems", "caching", "load balancing", "databases"],
    "prep_time_avg": "2.5 months",
    "difficulty_distribution": {
      "hard": 4,
      "medium": 1
    }
  },

  "metadata": {
    "retrieved_posts": 5,
    "embedding_model": "text-embedding-3-small",
    "analysis_model": "gpt-4-turbo-preview",
    "search_time_ms": 45,
    "analysis_time_ms": 3420,
    "total_time_ms": 3465
  }
}
```

### Step 7: Extract Interview Questions
```bash
# Queue NLP extraction
curl -X POST http://localhost:8080/api/content/nlp/extract \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 20}'

# Wait 2-3 minutes, then check results
curl http://localhost:8080/api/content/nlp/stats | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "database": {
    "total_questions": 47,
    "posts_with_questions": 20,
    "coding_count": 18,
    "system_design_count": 15,
    "behavioral_count": 14,
    "easy_count": 5,
    "medium_count": 25,
    "hard_count": 17
  }
}
```

### Step 8: Find Similar Questions
```bash
curl -X POST http://localhost:8080/api/content/nlp/similar \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Design a distributed cache system",
    "limit": 5
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "query": "Design a distributed cache system",
  "similar_questions": [
    {
      "question": "Design a distributed caching layer for high-traffic API",
      "similarity": 0.94,
      "type": "system_design",
      "difficulty": "hard",
      "company": "Google",
      "source_post": "1abc123"
    },
    {
      "question": "How would you implement Redis-like cache with persistence?",
      "similarity": 0.87,
      "type": "system_design",
      "difficulty": "medium",
      "company": "Amazon"
    }
  ]
}
```

## 📊 Visual Verification

### Before Embeddings (Current State):
```
┌──────────────────────────────────────┐
│ Database: 187 posts                  │
│ Embeddings: 0 ❌                     │
│ Questions: 0 ❌                      │
│                                      │
│ /analyze → Works (DeepSeek) ✅      │
│ /rag/analyze → Fails (no key) ❌    │
│ /embeddings/search → Fails ❌        │
└──────────────────────────────────────┘
```

### After Adding OpenAI Key + Running Jobs:
```
┌──────────────────────────────────────┐
│ Database: 187 posts                  │
│ Embeddings: 187 ✅                   │
│ Questions: 47 ✅                     │
│                                      │
│ /analyze → Works ✅                  │
│ /rag/analyze → Works ✅              │
│ /embeddings/search → Works ✅        │
│                                      │
│ Can find similar posts by meaning ✅ │
│ Can see sources in analysis ✅       │
│ Can search interview questions ✅    │
└──────────────────────────────────────┘
```

## 🎨 How to See RAG in Frontend

Once embeddings are generated, you can test in two ways:

### Option 1: Manual API Testing (No frontend changes)
```bash
# Use curl commands above to test RAG endpoints directly
```

### Option 2: Connect Frontend to RAG (Requires code changes)

I would need to modify these files:

**1. Update API service** (`frontend/src/api/apiService.js`):
```javascript
// Add RAG endpoints
export const ragAPI = {
  analyzeWithRAG: async (query, options = {}) => {
    const response = await API.post('/rag/analyze', {
      query,
      ...options
    });
    return response.data;
  },

  semanticSearch: async (query, filters = {}) => {
    const response = await API.post('/embeddings/search', {
      query,
      ...filters
    });
    return response.data;
  }
};
```

**2. Update LearningMapPage** to add RAG toggle:
```javascript
// Add button to switch between old and RAG analysis
<button onClick={() => setUseRAG(!useRAG)}>
  {useRAG ? 'Using RAG ✅' : 'Using Basic Analysis'}
</button>
```

**3. Show sources in analysis results**:
```javascript
{analysis.sources && (
  <div className="sources">
    <h4>Based on {analysis.sources.length} similar posts:</h4>
    {analysis.sources.map(source => (
      <div key={source.post_id}>
        📄 {source.title} (similarity: {source.similarity})
      </div>
    ))}
  </div>
)}
```

## ⚡ Quick Test Summary

**Without OpenAI Key (Current):**
```bash
# These work:
curl http://localhost:8080/api/content/health ✅
curl http://localhost:8080/api/content/analyze -d '{"text":"test"}' ✅

# These fail:
curl http://localhost:8080/api/content/rag/analyze ❌
curl http://localhost:8080/api/content/embeddings/search ❌
```

**With OpenAI Key:**
```bash
# All work:
curl http://localhost:8080/api/content/health ✅
curl http://localhost:8080/api/content/analyze ✅
curl http://localhost:8080/api/content/rag/analyze ✅
curl http://localhost:8080/api/content/embeddings/search ✅
curl http://localhost:8080/api/content/nlp/similar ✅
```

## 💰 Cost for Testing

**One-time embedding generation (187 posts):**
- Text: ~30,000 tokens @ $0.02/1M = **$0.0006**

**Test RAG analysis (10 queries):**
- 10 queries × $0.02 = **$0.20**

**Total for full testing: ~$0.21**

OpenAI gives you $5 free credit when you sign up, so testing is essentially free!

## 🎯 Recommendation

**Best way to see RAG working:**

1. Get OpenAI API key (5 minutes, free $5 credit)
2. Add to `.env` and restart service (1 minute)
3. Generate embeddings (2-3 minutes for all 187 posts)
4. Test RAG endpoint with curl (see immediate results)
5. Optionally: Connect frontend to see in UI

Would you like me to help you with any of these steps?
