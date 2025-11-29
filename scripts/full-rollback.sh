#!/bin/bash
# ============================================================================
# Full System Rollback Script
# Pattern: Complete rollback (deployment + migrations + feature flags)
# ============================================================================
#
# Usage:
#   ./scripts/full-rollback.sh
#
# This script performs a complete rollback:
# 1. Disable problematic features via feature flags
# 2. Rollback deployment to previous version
# 3. Rollback database migrations (optional)
#
# Companies using this pattern:
# - Meta: Coordinated rollback with feature flags + deployment
# - Netflix: Zuul + Spinnaker coordinated rollback
# - Uber: Multi-tier rollback system
#
# Rollback time: 1-3 minutes
# ============================================================================

set -e

echo "========================================"
echo "🚨 FULL SYSTEM ROLLBACK"
echo "========================================"
echo ""
echo "This will:"
echo "1. Disable all experimental features"
echo "2. Rollback content-service deployment"
echo "3. Optionally rollback database migrations"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Rollback cancelled"
  exit 0
fi

echo ""
echo "============================================"
echo "Step 1/3: Disabling Experimental Features"
echo "============================================"

# Disable experimental features via environment variables
export FEATURE_ENHANCED_INTELLIGENCE=false
export FEATURE_AUTO_SCRAPING=false

echo "✅ Experimental features disabled"

echo ""
echo "============================================"
echo "Step 2/3: Rolling Back Deployment"
echo "============================================"

# Rollback deployment
./scripts/rollback-deployment.sh content-service

echo ""
echo "============================================"
echo "Step 3/3: Database Migration Rollback (Optional)"
echo "============================================"

read -p "Rollback database migrations? (yes/no): " ROLLBACK_DB

if [ "$ROLLBACK_DB" = "yes" ]; then
  echo ""
  echo "Recent migrations:"
  ls -1 shared/database/init/ | grep -E "^[0-9]+" | sort -n | tail -5
  echo ""
  read -p "Enter migration number to rollback to (or 'skip'): " MIGRATION_NUM

  if [ "$MIGRATION_NUM" != "skip" ] && [ -n "$MIGRATION_NUM" ]; then
    ./scripts/rollback-migration.sh $MIGRATION_NUM
  else
    echo "⏩ Skipping database rollback"
  fi
else
  echo "⏩ Skipping database rollback"
fi

echo ""
echo "============================================"
echo "✅ FULL ROLLBACK COMPLETE"
echo "============================================"
echo ""
echo "System Status:"
docker-compose ps

echo ""
echo "Next Steps:"
echo "1. Monitor logs: docker-compose logs -f content-service"
echo "2. Check service health"
echo "3. Investigate root cause"
echo "4. Prepare fix and test in staging"
echo ""
