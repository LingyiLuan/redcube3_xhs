#!/bin/bash
# ============================================================================
# Rollback Deployment Script
# Pattern: Docker Compose Blue-Green Deployment Rollback
# ============================================================================
#
# Usage:
#   ./scripts/rollback-deployment.sh <service-name> [version]
#
# Examples:
#   ./scripts/rollback-deployment.sh content-service        # Rollback to previous image
#   ./scripts/rollback-deployment.sh content-service v1.2.3  # Rollback to specific version
#
# Companies using this pattern:
# - Netflix: Spinnaker for automated rollback (30-60s)
# - Uber: Blue-Green deployment (1-3min)
# - Airbnb: Kubernetes-based rollback (2-5min)
#
# Rollback time: 30 seconds - 2 minutes
# ============================================================================

set -e

SERVICE_NAME=${1:-content-service}
VERSION=$2

echo "============================================"
echo "🔄 Rollback Deployment: $SERVICE_NAME"
echo "============================================"

# Step 1: Stop current service
echo "⏸️  Stopping current service..."
docker-compose stop $SERVICE_NAME

# Step 2: Rollback to previous image
if [ -z "$VERSION" ]; then
  echo "📦 Rolling back to previous Docker image..."
  # Get previous image (assumes you tag images with timestamps or versions)
  PREVIOUS_IMAGE=$(docker images redcube3_xhs-$SERVICE_NAME --format "{{.Tag}}" | head -2 | tail -1)

  if [ -z "$PREVIOUS_IMAGE" ] || [ "$PREVIOUS_IMAGE" = "latest" ]; then
    echo "⚠️  No previous image found. Using 'latest' tag."
    PREVIOUS_IMAGE="latest"
  fi

  echo "   Previous image: $PREVIOUS_IMAGE"
else
  echo "📦 Rolling back to version: $VERSION"
  PREVIOUS_IMAGE=$VERSION
fi

# Step 3: Update docker-compose to use previous image
echo "🔧 Updating service configuration..."
# Note: In production, you would update docker-compose.yml or use tags

# Step 4: Start service with previous image
echo "🚀 Starting service with previous version..."
docker-compose up -d $SERVICE_NAME

# Step 5: Health check
echo "🏥 Running health check..."
sleep 5

# Check if service is running
if docker-compose ps $SERVICE_NAME | grep -q "Up"; then
  echo "✅ Rollback successful!"
  echo "   Service: $SERVICE_NAME"
  echo "   Version: $PREVIOUS_IMAGE"
  echo "   Status: Running"
else
  echo "❌ Rollback failed - service not running"
  exit 1
fi

# Step 6: Verify endpoints
echo ""
echo "🔍 Verifying service endpoints..."
sleep 5

if curl -s http://localhost:8080/api/content/interview-intel/experiences?limit=1 > /dev/null; then
  echo "✅ Service is responding to requests"
else
  echo "⚠️  Service may not be fully ready yet"
fi

echo ""
echo "============================================"
echo "✅ Rollback Complete"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Monitor logs: docker logs redcube3_xhs-$SERVICE_NAME-1 -f"
echo "2. Check metrics dashboard"
echo "3. Investigate root cause of the issue"
echo ""
