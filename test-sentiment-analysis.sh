#!/bin/bash

echo "🧪 Testing Sentiment Analysis System"
echo "===================================="
echo ""

# Test 1: Check if sentiment columns exist
echo "✅ Test 1: Verify database schema"
docker exec redcube_postgres psql -U postgres -d redcube_content -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'scraped_posts' AND column_name LIKE 'sentiment%' ORDER BY column_name;" | head -10

echo ""
echo "✅ Test 2: Count posts needing sentiment analysis"
docker exec redcube_postgres psql -U postgres -d redcube_content -t -c "SELECT COUNT(*) FROM scraped_posts WHERE sentiment_category IS NULL AND body_text IS NOT NULL AND LENGTH(body_text) > 100;"

echo ""
echo "✅ Test 3: Test AI sentiment analysis with sample post"
echo "Creating test script..."

cat > /tmp/test-sentiment.js << 'EOF'
const aiService = require('./services/content-service/src/services/aiService');

const samplePost = `
Just finished my Google interview for Senior Software Engineer role.
The system design round was incredibly challenging - they asked me to design
a distributed rate limiting system. I felt pretty unprepared for the scale
estimation questions and kept second-guessing my answers. The interviewers
were professional but I couldn't tell if they were impressed. Really worried
about whether I did well enough. Fingers crossed!
`;

async function test() {
  try {
    console.log('🔬 Analyzing sample post...\n');
    const result = await aiService.analyzeSentiment(samplePost);
    console.log('✅ Sentiment Analysis Result:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
EOF

echo "Running sentiment analysis test..."
docker exec redcube3_xhs-content-service-1 node -e "$(cat /tmp/test-sentiment.js)"

echo ""
echo "===================================="
echo "✅ All tests complete!"
