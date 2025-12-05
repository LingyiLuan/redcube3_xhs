#!/bin/bash
# Run all content-service migrations using Railway CLI
# This works even if you're connected in Terminal 1

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "🚀 Running all migrations for redcube_content database..."
echo ""

# List of all content-service migrations (in order)
MIGRATIONS=(
  "shared/database/init/08-phase5-enhanced-metadata.sql"
  "shared/database/init/09-phase6-pgvector-rag.sql"
  "shared/database/init/10-add-source-column.sql"
  "shared/database/init/11-add-relevance-tracking.sql"
  "shared/database/init/12-backfill-tracking.sql"
  "shared/database/init/13-performance-indexes.sql"
  "shared/database/init/14-sentiment-analysis.sql"
  "shared/database/init/15-metadata-backfill-tracking.sql"
  "shared/database/init/16-phase1-advanced-fields.sql"
  "shared/database/init/17-fix-decimal-fields.sql"
  "shared/database/init/18-increase-varchar-limits.sql"
  "shared/database/init/20-benchmark-cache.sql"
  "shared/database/init/20-learning-maps-redesign.sql"
  "shared/database/init/21-temporal-intelligence-fields.sql"
  "shared/database/init/22-comprehensive-llm-fields.sql"
  "shared/database/init/23-enhanced-parent-fields.sql"
  "shared/database/init/24-enhanced-question-fields.sql"
  "shared/database/init/25-enhanced-intelligence-cache.sql"
  "shared/database/init/26-learning-map-enhancements.sql"
  "shared/database/init/27-comprehensive-post-metadata.sql"
  "shared/database/init/27-interview-intel-ugc.sql"
  "shared/database/init/28-learning-maps-database-first-sections.sql"
  "shared/database/init/29-learning-maps-narrative-synthesis.sql"
  "shared/database/init/30-curated-problems.sql"
  "shared/database/init/31-citation-tracking.sql"
  "shared/database/init/32-trending-algorithm.sql"
  "shared/database/init/33-reputation-system.sql"
  "shared/database/init/34-usage-tracking.sql"
  "shared/database/init/38-usage-tracking.sql"
  "shared/database/init/39-user-preferences.sql"
  "shared/database/init/40-analysis-results-full-payload.sql"
  "shared/database/init/41-user-workflows.sql"
  "shared/database/init/42-assistant-chats.sql"
  "shared/database/init/06-learning-maps-history.sql"
)

# Run each migration
for migration in "${MIGRATIONS[@]}"; do
  if [ -f "$migration" ]; then
    echo "📦 Running $(basename $migration)..."
    # Prepend database switch and pipe through Railway CLI
    (echo "\c redcube_content"; cat "$migration") | railway connect postgres 2>&1 | grep -E "(CREATE|ALTER|ERROR|NOTICE|relation.*already exists|successfully)" | head -3 || true
    echo ""
  else
    echo "⚠️  File not found: $migration"
  fi
done

echo ""
echo "✅ All migrations completed!"
echo ""
echo "Now verify in Terminal 1:"
echo "  \\dt"
echo ""
echo "You should see many more tables now!"
