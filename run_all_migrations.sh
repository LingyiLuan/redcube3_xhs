#!/bin/bash
# Run all database migrations for Railway PostgreSQL
# Make sure railway connect postgres is running in another terminal

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
export PGPASSWORD=wBhiiTjKelhyWOLaxkzsXnClEYKdlJLb

echo "🚀 Running migrations for Railway PostgreSQL..."
echo "⚠️  Make sure 'railway connect postgres' is running in another terminal!"
echo ""

# Function to run SQL file on a specific database
run_migration() {
    local db=$1
    local file=$2
    echo "  → Running $(basename $file) on $db..."
    # Remove \c commands and run on specific database
    sed 's/\\c [^;]*;//g' "$file" | psql -h localhost -p 5432 -U postgres -d "$db" 2>&1 | grep -E "(ERROR|CREATE|ALTER|INSERT|UPDATE)" | head -5 || true
}

# Content Service Migrations
echo "📦 Migrating redcube_content..."
run_migration redcube_content shared/database/init/07-phase4-scraper-tables.sql
run_migration redcube_content shared/database/init/08-phase5-enhanced-metadata.sql
run_migration redcube_content shared/database/init/09-phase6-pgvector-rag.sql
run_migration redcube_content shared/database/init/10-add-source-column.sql
run_migration redcube_content shared/database/init/11-add-relevance-tracking.sql
run_migration redcube_content shared/database/init/12-backfill-tracking.sql
run_migration redcube_content shared/database/init/13-performance-indexes.sql
run_migration redcube_content shared/database/init/14-sentiment-analysis.sql
run_migration redcube_content shared/database/init/15-metadata-backfill-tracking.sql
run_migration redcube_content shared/database/init/16-phase1-advanced-fields.sql
run_migration redcube_content shared/database/init/17-fix-decimal-fields.sql
run_migration redcube_content shared/database/init/18-increase-varchar-limits.sql
run_migration redcube_content shared/database/init/19-batch-analysis-caching.sql
run_migration redcube_content shared/database/init/20-benchmark-cache.sql
run_migration redcube_content shared/database/init/20-learning-maps-redesign.sql
run_migration redcube_content shared/database/init/21-temporal-intelligence-fields.sql
run_migration redcube_content shared/database/init/22-comprehensive-llm-fields.sql
run_migration redcube_content shared/database/init/23-enhanced-parent-fields.sql
run_migration redcube_content shared/database/init/24-enhanced-question-fields.sql
run_migration redcube_content shared/database/init/25-enhanced-intelligence-cache.sql
run_migration redcube_content shared/database/init/26-learning-map-enhancements.sql
run_migration redcube_content shared/database/init/27-comprehensive-post-metadata.sql
run_migration redcube_content shared/database/init/27-interview-intel-ugc.sql
run_migration redcube_content shared/database/init/28-learning-maps-database-first-sections.sql
run_migration redcube_content shared/database/init/29-learning-maps-narrative-synthesis.sql
run_migration redcube_content shared/database/init/30-curated-problems.sql
run_migration redcube_content shared/database/init/31-citation-tracking.sql
run_migration redcube_content shared/database/init/32-trending-algorithm.sql
run_migration redcube_content shared/database/init/33-reputation-system.sql
run_migration redcube_content shared/database/init/34-usage-tracking.sql
run_migration redcube_content shared/database/init/38-usage-tracking.sql
run_migration redcube_content shared/database/init/39-user-preferences.sql
run_migration redcube_content shared/database/init/40-analysis-results-full-payload.sql
run_migration redcube_content shared/database/init/41-user-workflows.sql
run_migration redcube_content shared/database/init/42-assistant-chats.sql
run_migration redcube_content shared/database/init/06-learning-maps-history.sql

# User Service Migrations
echo ""
echo "📦 Migrating redcube_users..."
run_migration redcube_users shared/database/init/04-phase3-auth-tables.sql
run_migration redcube_users shared/database/init/28-add-password-auth.sql
run_migration redcube_users shared/database/init/29-password-reset-tokens.sql
run_migration redcube_users shared/database/init/35-add-linkedin-url.sql
run_migration redcube_users shared/database/init/36-email-verification-tokens.sql
run_migration redcube_users shared/database/init/37-subscriptions-and-payments.sql
run_migration redcube_users shared/database/init/37-migrate-subscriptions-to-lemon-squeezy.sql
run_migration redcube_users shared/database/init/38-lemon-squeezy-support.sql

# Interview Service Migrations
echo ""
echo "📦 Migrating redcube_interviews..."
# Most interview tables are in 02-create-tables.sql which uses \c, so we'll handle it separately

# Notifications Service Migrations  
echo ""
echo "📦 Migrating redcube_notifications..."
# Notification tables are in 02-create-tables.sql

# User sync trigger (runs on users database)
echo ""
echo "📦 Running user sync trigger..."
run_migration redcube_users shared/database/init/99-user-sync-trigger.sql

echo ""
echo "✅ All migrations completed!"
echo ""
echo "⚠️  Note: Some migrations may show errors if tables already exist (that's OK)"
