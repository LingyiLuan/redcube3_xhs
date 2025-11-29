#!/bin/bash

echo "🧪 Testing Phase 1 Performance Optimizations"
echo "============================================="
echo ""
echo "Running batch analysis with 3 sample posts..."
echo ""

# Test batch analysis with 3 sample posts
curl -X POST http://localhost:8080/api/content/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [
      {
        "id": "test1",
        "text": "Just got an offer from Google as a Senior Software Engineer. TC is $450k (200k base + 250k stock). 5 years experience. The interview had 3 rounds of leetcode hard problems and 2 system design rounds. They asked about distributed systems and scalability."
      },
      {
        "id": "test2",
        "text": "Amazon L5 offer: $380k total comp (160k base, 220k RSU). Interview was tough - 4 coding rounds focusing on algorithms and data structures, plus behavioral leadership principles. Asked about AWS architecture patterns."
      },
      {
        "id": "test3",
        "text": "Meta E5 position: $420k package (185k base + 235k equity). Interview process: 2 coding, 1 system design, 1 behavioral. Heavy focus on scalability and system design patterns."
      }
    ],
    "analyzeConnections": true
  }' \
  -w "\n\n📊 HTTP Response Time: %{time_total}s\n" \
  -s -o /tmp/batch-response.json

echo ""
echo "✅ Response saved to /tmp/batch-response.json"
echo ""
echo "📈 Performance Metrics from API:"
cat /tmp/batch-response.json | jq '.performance'
echo ""
echo "🔍 Now check Docker logs for detailed timing:"
echo "   docker logs --tail 30 redcube3_xhs-content-service-1 | grep '⏱️'"
