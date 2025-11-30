#!/bin/bash

# Start Cloudflare Tunnel for labzero.io
# This connects your local services to the internet via Cloudflare

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/cloudflare-tunnel-config.yml"

echo "🚇 Starting Cloudflare Tunnel for labzero.io..."
echo ""

# Check if config exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Config file not found: $CONFIG_FILE"
  exit 1
fi

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
  echo "❌ cloudflared not found. Install with:"
  echo "   brew install cloudflare/cloudflare/cloudflared"
  exit 1
fi

# Check if services are running
echo "🔍 Checking if services are running..."
if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
  echo "⚠️  Frontend not running on port 3001"
  echo "   Start with: docker-compose up -d frontend"
fi

if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
  echo "⚠️  API Gateway not running on port 8080"
  echo "   Start with: docker-compose up -d"
fi

echo ""
echo "✅ Starting tunnel..."
echo "   Frontend: https://labzero.io → http://localhost:3001"
echo "   API: https://api.labzero.io → http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the tunnel"
echo ""

# Start tunnel
cd "$PROJECT_ROOT"
cloudflared tunnel --config "$CONFIG_FILE" run labzero


