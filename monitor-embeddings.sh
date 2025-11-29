#!/bin/bash

# Real-time embedding progress monitor
# Usage: ./monitor-embeddings.sh

echo "🔍 Monitoring Embedding Generation Progress"
echo "==========================================="
echo ""

while true; do
  # Clear screen
  clear

  echo "🔍 RAG System Embedding Monitor"
  echo "================================="
  echo ""
  echo "⏰ Time: $(date '+%H:%M:%S')"
  echo ""

  # Get embedding stats
  STATS=$(curl -s http://localhost:8080/api/content/embeddings/stats)

  # Parse JSON
  TOTAL=$(echo $STATS | grep -o '"total_posts":"[^"]*"' | cut -d'"' -f4)
  COMPLETED=$(echo $STATS | grep -o '"posts_with_embeddings":"[^"]*"' | cut -d'"' -f4)
  PENDING=$(echo $STATS | grep -o '"pending":"[^"]*"' | cut -d'"' -f4)
  PROCESSING=$(echo $STATS | grep -o '"processing":"[^"]*"' | cut -d'"' -f4)
  FAILED=$(echo $STATS | grep -o '"failed":"[^"]*"' | cut -d'"' -f4)
  COVERAGE=$(echo $STATS | grep -o '"coverage_pct":"[^"]*"' | cut -d'"' -f4)

  # Queue stats
  ACTIVE=$(echo $STATS | grep -o '"active":[^,}]*' | cut -d':' -f2)
  QUEUE_COMPLETED=$(echo $STATS | grep -o '"completed":[^,}]*' | tail -1 | cut -d':' -f2)

  echo "📊 Database Status:"
  echo "  Total Posts:     $TOTAL"
  echo "  ✅ Completed:    $COMPLETED"
  echo "  ⏳ Pending:      $PENDING"
  echo "  🔄 Processing:   $PROCESSING"
  echo "  ❌ Failed:       $FAILED"
  echo ""

  # Progress bar
  if [ ! -z "$COVERAGE" ] && [ "$COVERAGE" != "null" ]; then
    COVERAGE_INT=$(echo $COVERAGE | cut -d'.' -f1)
    BARS=$((COVERAGE_INT / 5))
    SPACES=$((20 - BARS))

    echo "📈 Progress: $COVERAGE%"
    printf "  ["
    for i in $(seq 1 $BARS); do printf "█"; done
    for i in $(seq 1 $SPACES); do printf " "; done
    printf "]\n"
    echo ""
  fi

  echo "🔧 Worker Queue:"
  echo "  Active Jobs:     $ACTIVE"
  echo "  Jobs Completed:  $QUEUE_COMPLETED"
  echo ""

  # Recent logs
  echo "📝 Recent Activity (last 5 lines):"
  docker logs --tail 5 redcube3_xhs-content-service-1 2>&1 | grep -E "(Embedding|succeeded|failed|Rate limit)" | tail -5 | sed 's/^/  /'
  echo ""

  # ETA calculation
  if [ ! -z "$COVERAGE" ] && [ "$COVERAGE" != "0.00" ] && [ "$COVERAGE" != "null" ]; then
    REMAINING=$((TOTAL - COMPLETED))
    # Assuming 3 requests per minute due to rate limit
    ETA_MINUTES=$((REMAINING / 3))
    ETA_HOURS=$((ETA_MINUTES / 60))
    ETA_MINS=$((ETA_MINUTES % 60))

    echo "⏱️  Estimated Time Remaining: ${ETA_HOURS}h ${ETA_MINS}m"
  else
    echo "⏱️  Estimated Time Remaining: ~90 minutes (rate-limited)"
  fi

  echo ""
  echo "💡 Tip: Press Ctrl+C to exit"
  echo "🔄 Refreshing in 10 seconds..."

  sleep 10
done
