#!/bin/bash

# Test batch analysis endpoint to verify percentage calculation

curl -X POST http://localhost:8080/api/content/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [
      {"text": "I interviewed at Google for SWE role. They asked about React, Node.js, and AWS. The coding round was tough. I passed!"},
      {"text": "Amazon interview - asked about React, Python, and Docker. System design on AWS was challenging. Got the offer!"},
      {"text": "Google SDE interview. Questions on React, Kubernetes, and GCP. Very difficult. Did not get offer."}
    ],
    "analyzeConnections": true
  }' \
  | jq '.pattern_analysis.company_trends[0].top_skills'

echo ""
echo "===== CHECK ABOVE OUTPUT ====="
echo "If percentages are NOT 100%, the fix is working!"
echo "Expected: Different percentage values like 66.7, 33.3, etc."
