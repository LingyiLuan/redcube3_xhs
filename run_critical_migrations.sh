#!/bin/bash
# Run critical migrations for redcube_content using Railway CLI
# This script pipes SQL files through Railway CLI

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "🚀 Running critical migrations for redcube_content..."
echo "⚠️  Make sure you're NOT connected in Terminal 1 (exit psql first)"
echo ""

# Critical migrations needed (in order)
MIGRATIONS=(
  "shared/database/init/08-phase5-enhanced-metadata.sql"
  "shared/database/init/19-batch-analysis-caching.sql"
  "shared/database/init/42-assistant-chats.sql"
  "shared/database/init/40-analysis-results-full-payload.sql"
  "shared/database/init/41-user-workflows.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  if [ -f "$migration" ]; then
    echo "📦 Running $(basename $migration)..."
    # Prepend database switch command and pipe through Railway CLI
    (echo "\c redcube_content"; cat "$migration") | railway connect postgres 2>&1 | tail -10
    echo ""
  fi
done

echo "✅ Critical migrations completed!"
echo ""
echo "Now verify in Terminal 1:"
echo "  \\c redcube_content"
echo "  \\dt"
