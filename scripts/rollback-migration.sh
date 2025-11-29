#!/bin/bash
# ============================================================================
# Rollback Database Migration Script
# Pattern: Postgres Migration Rollback (Flyway/Liquibase pattern)
# ============================================================================
#
# Usage:
#   ./scripts/rollback-migration.sh <migration-number>
#
# Examples:
#   ./scripts/rollback-migration.sh 99  # Rollback migration 99 (user sync trigger)
#
# Companies using this pattern:
# - Stripe: Flyway for database migrations
# - Uber: Liquibase with rollback scripts
# - Netflix: SchemaHero for Kubernetes
#
# Rollback time: 10-60 seconds
# ============================================================================

set -e

MIGRATION_NUMBER=${1}

if [ -z "$MIGRATION_NUMBER" ]; then
  echo "❌ Error: Migration number required"
  echo "Usage: ./scripts/rollback-migration.sh <migration-number>"
  echo ""
  echo "Available migrations:"
  ls -1 shared/database/init/ | grep -E "^[0-9]+" | sort -n
  exit 1
fi

echo "============================================"
echo "🔄 Rollback Migration: $MIGRATION_NUMBER"
echo "============================================"

# Find migration file
MIGRATION_FILE=$(ls shared/database/init/${MIGRATION_NUMBER}-*.sql 2>/dev/null | head -1)

if [ -z "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: ${MIGRATION_NUMBER}-*.sql"
  exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo ""

# Rollback strategies by migration number
case $MIGRATION_NUMBER in
  99)
    echo "🔄 Rolling back: User Sync Trigger"
    echo ""
    docker exec redcube_postgres psql -U postgres -d redcube_users <<-EOSQL
    -- Drop user sync trigger
    DROP TRIGGER IF EXISTS trigger_sync_user_to_postgres ON users;
    DROP FUNCTION IF EXISTS sync_user_to_postgres();
    DROP FUNCTION IF EXISTS manual_sync_user(INTEGER);
    DROP VIEW IF EXISTS v_user_sync_status;
    DROP VIEW IF EXISTS v_user_sync_missing;

    -- Drop dblink extension if no longer needed
    -- DROP EXTENSION IF EXISTS dblink;  -- Commented out for safety

    SELECT 'User sync trigger rolled back successfully' as result;
EOSQL
    ;;

  33)
    echo "🔄 Rolling back: Reputation System"
    echo ""
    docker exec redcube_postgres psql -U postgres -d postgres <<-EOSQL
    -- Drop reputation tables (use with caution)
    DROP TABLE IF EXISTS reputation_events CASCADE;
    DROP TABLE IF EXISTS user_reputation CASCADE;
    DROP VIEW IF EXISTS v_top_contributors CASCADE;

    SELECT 'Reputation system rolled back successfully' as result;
EOSQL
    ;;

  32)
    echo "🔄 Rolling back: Trending Algorithm"
    echo ""
    docker exec redcube_postgres psql -U postgres -d postgres <<-EOSQL
    -- Remove trending columns from interview_experiences
    ALTER TABLE interview_experiences
      DROP COLUMN IF EXISTS trending_score,
      DROP COLUMN IF EXISTS trending_score_updated_at,
      DROP COLUMN IF EXISTS decay_factor;

    DROP VIEW IF EXISTS v_trending_experiences CASCADE;

    SELECT 'Trending algorithm rolled back successfully' as result;
EOSQL
    ;;

  *)
    echo "⚠️  No rollback script defined for migration $MIGRATION_NUMBER"
    echo ""
    echo "Manual rollback required:"
    echo "1. Review the migration file: $MIGRATION_FILE"
    echo "2. Write inverse SQL statements"
    echo "3. Execute using: docker exec redcube_postgres psql -U postgres -d <database>"
    echo ""
    echo "Example:"
    echo "  docker exec redcube_postgres psql -U postgres -d postgres -c \"DROP TABLE your_table;\""
    exit 1
    ;;
esac

echo ""
echo "============================================"
echo "✅ Migration Rollback Complete"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Verify database state"
echo "2. Restart affected services"
echo "3. Update migration tracking (if using)"
echo ""
