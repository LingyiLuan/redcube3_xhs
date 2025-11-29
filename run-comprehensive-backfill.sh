#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║   COMPREHENSIVE BACKFILL - All-in-One Data Extraction          ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 What will be extracted:"
echo "   ✅ Basic Metadata: role_type, level, outcome, tech_stack, frameworks"
echo "   ✅ Sentiment Analysis: category, score, reasoning, key phrases"
echo "   ✅ Phase 1 Advanced:"
echo "      - Experience & Preparation (YOE, prep time, LeetCode, mocks)"
echo "      - Interview Performance (rounds, difficulty)"
echo "      - Interviewer Signals (engagement, hints, body language)"
echo "      - Compensation (salary, TC, referrals)"
echo ""
echo "📈 Expected Results:"
echo "   - Target: ~350-450 posts with missing data"
echo "   - AI Calls: ~700-900 (2 per post)"
echo "   - Cost: ~$2.00-$2.50"
echo "   - Time: ~25-30 minutes"
echo "   - Batch size: 25 posts per batch"
echo "   - Rate limit: 6 second delay between batches"
echo ""
echo "⚠️  Press Ctrl+C at any time to stop gracefully"
echo ""
echo "Starting in 5 seconds..."
sleep 5

# Run directly from app directory
docker exec -w /app redcube3_xhs-content-service-1 node -e "
require('dotenv').config();
const comprehensiveBackfillService = require('./src/services/comprehensiveBackfillService');

process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully stopping...');
  comprehensiveBackfillService.stopBackfill();
});

comprehensiveBackfillService.startBackfill()
  .then(() => {
    console.log('✅ Comprehensive backfill completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Comprehensive backfill failed:', error);
    process.exit(1);
  });
"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Comprehensive backfill process finished!"
echo "════════════════════════════════════════════════════════════"
