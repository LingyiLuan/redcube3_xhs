# Phase 6 RAG Platform - Complete Workflow Explanation

## 🤔 Why You Don't See Phase 6 Yet

**Your frontend is NOT using Phase 6 RAG features yet!**

### Current Frontend Flow (Phase 1-4):
```
User types text → Frontend calls /analyze → DeepSeek/OpenRouter → Basic analysis
```

### Phase 6 RAG Flow (Not connected yet):
```
User query → /rag/analyze → Find similar posts (pgvector) → GPT-4 + context → Enhanced analysis
```

## 🔄 Complete RAG Workflow (Step-by-Step)

### Step 1: Data Ingestion & Embedding Generation
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Scraper collects Reddit posts                               │
│    └─> POST /api/content/ingest/webhook                        │
│        └─> Saves to PostgreSQL as "pending"                    │
├─────────────────────────────────────────────────────────────────┤
│ 2. Embedding Worker (runs every hour)                          │
│    └─> Fetches posts with embedding_status='pending'           │
│    └─> Calls OpenAI text-embedding-3-small                     │
│    └─> Generates 1536-dimensional vector for each post         │
│    └─> Stores embedding in PostgreSQL vector column            │
│                                                                 │
│    Post text: "Google L5 system design interview was hard"     │
│    Embedding: [0.023, -0.145, 0.891, ..., 0.234] (1536 dims)  │
├─────────────────────────────────────────────────────────────────┤
│ 3. NLP Worker (runs every 2 hours)                             │
│    └─> Extracts interview questions using GPT-4                │
│    └─> Saves to interview_questions table                      │
│    └─> Each question gets its own embedding                    │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2: User Query with RAG
```
┌─────────────────────────────────────────────────────────────────┐
│ USER QUERY: "What should I prepare for Google L5 system design?"│
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Convert query to embedding                             │
│ ────────────────────────────────────────────────────────────────│
│ Query text → OpenAI embedding API → Query vector (1536 dims)   │
│                                                                 │
│ "What should I prepare for Google L5 system design?"           │
│         ↓                                                       │
│ [0.034, -0.123, 0.876, ..., 0.198] (1536 dimensions)          │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Semantic Search (Vector Similarity)                    │
│ ────────────────────────────────────────────────────────────────│
│ PostgreSQL pgvector: Find similar posts using cosine distance  │
│                                                                 │
│ SELECT post_id, title, body_text,                              │
│        1 - (embedding <=> $query_vector) as similarity         │
│ FROM scraped_posts                                              │
│ WHERE embedding IS NOT NULL                                     │
│   AND 1 - (embedding <=> $query_vector) > 0.6                 │
│ ORDER BY embedding <=> $query_vector                            │
│ LIMIT 5;                                                        │
│                                                                 │
│ Results: Top 5 most similar posts (by semantic meaning)        │
│   1. "Google L5 interview - system design was brutal" (0.92)   │
│   2. "Preparing for senior Google SWE system design" (0.87)    │
│   3. "Google L5 offer - how I prepared for SD round" (0.85)    │
│   4. "System design questions at Google (L4/L5)" (0.81)        │
│   5. "Google system design interview tips" (0.78)              │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Build RAG Context (Context Window)                     │
│ ────────────────────────────────────────────────────────────────│
│ Combine the 5 similar posts into a context block:              │
│                                                                 │
│ Context:                                                        │
│ [Post 1]                                                        │
│ Title: Google L5 interview - system design was brutal          │
│ Body: I had my Google L5 system design round last week...      │
│ Outcome: Offer                                                  │
│ Topics: distributed systems, scaling, caching                  │
│                                                                 │
│ [Post 2]                                                        │
│ Title: Preparing for senior Google SWE system design           │
│ Body: After 3 months of prep, I got the offer...              │
│ ...                                                            │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Generate Analysis with GPT-4 Turbo                     │
│ ────────────────────────────────────────────────────────────────│
│ Prompt to GPT-4:                                                │
│                                                                 │
│ System: You are an expert interview coach. Use the provided    │
│ context from real interview experiences to answer the question.│
│                                                                 │
│ Context: [5 similar posts with full details]                   │
│                                                                 │
│ User Query: "What should I prepare for Google L5 system design?"│
│                                                                 │
│         ↓                                                       │
│                                                                 │
│ GPT-4 Response (grounded in real data):                        │
│ "Based on 5 recent Google L5 interview experiences:            │
│                                                                 │
│ 1. Core Topics to Prepare:                                     │
│    - Distributed systems fundamentals (mentioned in 4/5 posts) │
│    - Scaling strategies (all 5 posts)                          │
│    - Caching patterns (3/5 posts)                              │
│    - Database sharding (2/5 posts)                             │
│                                                                 │
│ 2. Interview Format:                                            │
│    - 45 minutes (based on Post #1, #3)                         │
│    - 2 design problems typically (Post #2)                     │
│    - Deep dives into tradeoffs expected                        │
│                                                                 │
│ 3. Success Patterns:                                            │
│    - Candidates who got offers spent 2-3 months preparing      │
│    - Practice with System Design Primer (Post #4)              │
│    - Mock interviews helped 4/5 successful candidates          │
│                                                                 │
│ 4. Common Pitfalls:                                             │
│    - Not discussing tradeoffs (Post #3 rejection reason)       │
│    - Over-engineering solutions (Post #5)                      │
│                                                                 │
│ Sources: [Links to original posts]"                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🆚 Comparison: With vs Without RAG

### Without RAG (Current Frontend - Phase 1-4):
```json
POST /api/content/analyze
{
  "text": "Google L5 system design interview"
}

Response (DeepSeek/OpenRouter):
{
  "company": "Google",
  "role": "L5 system design",
  "sentiment": "neutral",
  "difficulty_level": "hard",
  "interview_topics": ["system design"],
  "key_insights": []  // ❌ Empty! No real data
}
```

**Problem**: Analysis is based only on the input text. No historical data used.

### With RAG (Phase 6 - Not connected yet):
```json
POST /api/content/rag/analyze
{
  "query": "What should I prepare for Google L5 system design?",
  "role": "SWE",
  "level": "L5",
  "company": "Google",
  "contextSize": 5
}

Response (GPT-4 + RAG Context):
{
  "analysis": "Based on 5 recent Google L5 interview experiences:\n\n1. Core Topics...",
  "sources": [
    {
      "post_id": "1abc123",
      "title": "Google L5 interview - system design was brutal",
      "similarity": 0.92,
      "outcome": "offer",
      "company": "Google"
    },
    // ... 4 more similar posts
  ],
  "insights": {
    "common_topics": ["distributed systems", "scaling", "caching"],
    "success_rate": "60%",
    "avg_preparation_time": "2.5 months",
    "difficulty_distribution": {"hard": 3, "medium": 2}
  }
}
```

**Benefit**: Analysis grounded in real interview experiences from your database!

## 🔧 Two Separate Systems Currently

### System A: Phase 1-4 (Currently Used by Frontend)
```
Frontend → /analyze → DeepSeek/OpenRouter → Basic analysis
✅ Works without OpenAI key
✅ Fast (2-3 seconds)
❌ No historical context
❌ Generic insights
```

### System B: Phase 6 RAG (Backend ready, not connected)
```
Frontend → /rag/analyze → Semantic search → GPT-4 + context → Enhanced analysis
❌ Requires OpenAI API key
✅ Uses historical data
✅ Provides sources
✅ Better insights
⏱️ Slower (5-8 seconds)
```

## 💡 Why You Need OpenAI Key for Phase 6

### 1. **Embeddings** (text-embedding-3-small)
- Convert text to vectors: `"Google interview" → [0.023, -0.145, ...]`
- Cost: **$0.02 per 1M tokens** (very cheap!)
- Without this: **Cannot do semantic search**

### 2. **RAG Analysis** (GPT-4 Turbo)
- Generate insights from retrieved context
- Cost: **~$0.02 per query** (input + output)
- Without this: **Cannot generate enhanced analysis**

### 3. **NLP Extraction** (GPT-4 Turbo)
- Extract interview questions from posts
- Cost: **~$0.32 per 100 posts**
- Without this: **Cannot build question database**

## 🧪 How to Test Phase 6 RAG (Without Frontend Changes)

### Test 1: Check if embeddings exist
```bash
curl http://localhost:8080/api/content/embeddings/stats
```
**Expected**: Should show 0 embeddings (need OpenAI key)

### Test 2: Try to queue embedding generation
```bash
curl -X POST http://localhost:8080/api/content/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10}'
```
**Expected**: Job queued but will fail without OpenAI key

### Test 3: Try RAG analysis (will fail gracefully)
```bash
curl -X POST http://localhost:8080/api/content/rag/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What should I prepare for Google L5 system design?",
    "contextSize": 5
  }'
```
**Expected**: Error about missing OpenAI key

## 📈 Current Database State

```sql
-- Your current data (from Phase 1-4)
scraped_posts: 187 posts
  ├─ embedding_status: "pending" (all 187)
  ├─ embeddings: NULL (need OpenAI to generate)
  └─ Can be analyzed with /analyze but NOT with /rag/analyze

interview_questions: 0 questions
  └─ Need OpenAI + NLP worker to extract

learning_topics: 0 topics
  └─ Need embeddings first
```

## 🎯 What You Should Do Next

### Option 1: Test with OpenAI Key (Recommended)
```bash
# 1. Get OpenAI API key from https://platform.openai.com/api-keys
# 2. Update .env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# 3. Restart content-service
docker-compose restart content-service

# 4. Generate embeddings
curl -X POST http://localhost:8080/api/content/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 187}'

# 5. Wait 2-3 minutes, then check progress
curl http://localhost:8080/api/content/embeddings/stats

# 6. Once embeddings are done, test RAG
curl -X POST http://localhost:8080/api/content/rag/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tell me about Google interviews",
    "contextSize": 5
  }'
```

### Option 2: Use DeepSeek for Everything (Alternative)
I could modify the RAG system to use **DeepSeek** for embeddings instead of OpenAI:
- DeepSeek has embedding models
- You already have the API key
- Would make Phase 6 work immediately
- But: DeepSeek embeddings are different format/quality

### Option 3: Keep Current System
- Continue using `/analyze` endpoint (Phase 1-4)
- Works fine with DeepSeek
- No RAG features but no cost

## 🔌 To Connect Phase 6 to Frontend

I would need to update `frontend/src/api/apiService.js`:

```javascript
// Add new RAG API methods
export const ragAPI = {
  // RAG analysis with context
  analyzeWithRAG: async (query, options = {}) => {
    const response = await API.post('/rag/analyze', {
      query,
      role: options.role,
      level: options.level,
      company: options.company,
      contextSize: options.contextSize || 5
    });
    return response.data;
  },

  // Semantic search
  semanticSearch: async (query, filters = {}) => {
    const response = await API.post('/embeddings/search', {
      query,
      matchCount: filters.matchCount || 10,
      matchThreshold: filters.matchThreshold || 0.6,
      filterRole: filters.role,
      filterOutcome: filters.outcome
    });
    return response.data;
  },

  // Get trending topics
  getTrending: async (timeframe = '30 days') => {
    const response = await API.get(`/rag/trending?timeframe=${timeframe}`);
    return response.data;
  }
};
```

Then update your canvas analysis to use `ragAPI.analyzeWithRAG()` instead of `analysisAPI.analyzeSingle()`.

## 📊 Visual Summary

```
┌──────────────────────────────────────────────────────────────┐
│                    CURRENT STATE                             │
├──────────────────────────────────────────────────────────────┤
│ Frontend (React) :5173                                       │
│   └─> Uses /analyze (Phase 1-4)                             │
│   └─> DeepSeek/OpenRouter ✅ WORKING                        │
│   └─> No embeddings, no RAG                                 │
│                                                              │
│ Backend (Phase 6 RAG) :8080                                  │
│   ├─> /rag/analyze ⚠️ READY (needs OpenAI key)            │
│   ├─> /embeddings/search ⚠️ READY (needs OpenAI key)      │
│   ├─> /nlp/extract ⚠️ READY (needs OpenAI key)            │
│   ├─> Workers running ✅                                     │
│   ├─> Schedulers running ✅                                  │
│   └─> Database ready (pgvector) ✅                           │
│                                                              │
│ Database :5432                                               │
│   ├─> 187 posts ✅                                           │
│   ├─> 0 embeddings ❌ (need OpenAI)                         │
│   └─> 0 questions ❌ (need OpenAI)                          │
└──────────────────────────────────────────────────────────────┘
```

## 🎬 Summary

**Why you don't see Phase 6 visually:**
1. ❌ Frontend not connected to RAG endpoints yet
2. ❌ No OpenAI key = no embeddings = no semantic search
3. ✅ Backend fully built and ready
4. ✅ Workers and schedulers running
5. ✅ Database schema ready

**To see Phase 6 working:**
- Add OpenAI API key → Generate embeddings → Test RAG endpoint
- OR: Keep using current system (works fine with DeepSeek)
- OR: I can modify RAG to use DeepSeek embeddings

**What would you like to do?**
1. Get OpenAI key and test Phase 6 RAG?
2. Modify Phase 6 to use DeepSeek for embeddings?
3. Keep current system and skip Phase 6 RAG?
