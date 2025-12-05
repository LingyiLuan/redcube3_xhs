#!/bin/bash
# Quick test script for Redis session store

echo "🧪 Testing Redis Session Store"
echo "=================================="
echo ""

# 1. Check Redis is running
echo "1. Checking Redis..."
REDIS_CONTAINER=$(docker ps --format "{{.Names}}" | grep redis | head -1)

if [ -n "$REDIS_CONTAINER" ]; then
    echo "   ✅ Redis container is running: $REDIS_CONTAINER"
else
    echo "   ❌ Redis container not running"
    echo "   Start it: docker-compose up -d redis"
    exit 1
fi

# 2. Test Redis connection
echo ""
echo "2. Testing Redis connection..."
if docker exec $REDIS_CONTAINER redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "   ✅ Redis is responding (PONG)"
else
    echo "   ❌ Redis not responding"
    exit 1
fi

# 3. Check if connect-redis is installed
echo ""
echo "3. Checking dependencies..."
cd services/user-service

if [ -f "package.json" ] && grep -q "connect-redis" package.json; then
    echo "   ✅ connect-redis found in package.json"
    
    if [ -d "node_modules/connect-redis" ]; then
        echo "   ✅ connect-redis is installed"
    else
        echo "   ⚠️  connect-redis not installed, run: npm install"
    fi
else
    echo "   ❌ connect-redis not found in package.json"
    exit 1
fi

# 4. Check environment variables
echo ""
echo "4. Checking environment variables..."
if [ -n "$REDIS_URL" ]; then
    echo "   ✅ REDIS_URL is set: $REDIS_URL"
else
    echo "   ⚠️  REDIS_URL not set"
    echo "   Set it: export REDIS_URL=redis://redis:6379 (for Docker)"
    echo "   Or: export REDIS_URL=redis://localhost:6379 (for local)"
fi

echo ""
echo "=================================="
echo "✅ Basic checks passed!"
echo ""
echo "Next steps:"
echo "  1. Set REDIS_URL: export REDIS_URL=redis://redis:6379"
echo "  2. Install dependencies: npm install"
echo "  3. Start service: npm start"
echo "  4. Look for: '[Session] ✅ Redis connected' in logs"
echo "  5. Test OAuth login"
echo "  6. Verify session in Redis: docker exec $REDIS_CONTAINER redis-cli KEYS redcube:sess:*"
echo ""
