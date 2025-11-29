#!/bin/bash

# API Testing Script for RAG Platform
# Tests all major endpoints

API_BASE="http://localhost:8080/api/content"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 Testing RAG Platform API Endpoints"
echo "======================================"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4

    echo -n "Testing ${name}... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${API_BASE}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X ${method} "${API_BASE}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "${data}")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (${http_code})"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (${http_code})"
        echo "Response: $body"
        return 1
    fi
}

# 1. Health Check
echo "🏥 System Health"
test_endpoint "Health Check" "GET" "/health"
echo ""

# 2. Ingestion Stats
echo "📊 Data Ingestion"
test_endpoint "Ingestion Stats" "GET" "/ingest/stats"
echo ""

# 3. Embedding Stats
echo "🧬 Embeddings"
test_endpoint "Embedding Stats" "GET" "/embeddings/stats"
test_endpoint "Queue Embedding Job" "POST" "/embeddings/generate" '{"batchSize": 10}'
echo ""

# 4. NLP Stats
echo "🔍 NLP Extraction"
test_endpoint "NLP Stats" "GET" "/nlp/stats"
test_endpoint "Queue NLP Job" "POST" "/nlp/extract" '{"batchSize": 5}'
echo ""

# 5. Semantic Search
echo "🔎 Semantic Search"
test_endpoint "Semantic Search" "POST" "/embeddings/search" '{
  "query": "Google interview experience",
  "matchCount": 5
}'
echo ""

# 6. RAG Analysis
echo "🤖 RAG Analysis"
test_endpoint "RAG Analyze" "POST" "/rag/analyze" '{
  "query": "What should I prepare for Google system design interview?",
  "contextSize": 3
}'
test_endpoint "RAG Trending" "GET" "/rag/trending?timeframe=30%20days&limit=5"
echo ""

# 7. NLP Features
echo "📝 NLP Features"
test_endpoint "Similar Questions" "POST" "/nlp/similar" '{
  "question": "Design a distributed cache",
  "limit": 5
}'
test_endpoint "Classify Difficulty" "POST" "/nlp/classify" '{
  "question": "Implement LRU cache"
}'
echo ""

# Summary
echo "======================================"
echo "✅ API Testing Complete"
echo ""
echo "💡 Next Steps:"
echo "   1. Check logs: docker logs redcube3_xhs-content-service-1"
echo "   2. Monitor queues: curl ${API_BASE}/embeddings/stats"
echo "   3. View database: docker exec redcube_postgres psql -U postgres -d redcube_content"
echo ""
