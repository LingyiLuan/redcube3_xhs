#!/bin/bash
# Comprehensive Security Testing Script
# Tests authentication and authorization for protected endpoints

set -e

API_BASE="http://localhost:8080/api/content"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Comprehensive Security Testing"
echo "=================================="
echo ""

# Test 1: Authentication Enforcement
echo "📋 Test 1: Authentication Enforcement"
echo "--------------------------------------"

echo -n "Test 1.1: Unauthenticated GET /history ... "
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/history?limit=10" \
  -H "Content-Type: application/json" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✅ PASS${NC} (401 Unauthorized)"
else
  echo -e "${RED}❌ FAIL${NC} (Expected 401, got $HTTP_CODE)"
  echo "Response: $(echo "$RESPONSE" | head -n-1)"
fi

echo -n "Test 1.2: Unauthenticated GET /learning-maps/history ... "
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/learning-maps/history?limit=10" \
  -H "Content-Type: application/json" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✅ PASS${NC} (401 Unauthorized)"
else
  echo -e "${RED}❌ FAIL${NC} (Expected 401, got $HTTP_CODE)"
  echo "Response: $(echo "$RESPONSE" | head -n-1)"
fi

echo -n "Test 1.3: Unauthenticated GET /learning-map/1 ... "
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/learning-map/1" \
  -H "Content-Type: application/json" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✅ PASS${NC} (401 Unauthorized)"
else
  echo -e "${RED}❌ FAIL${NC} (Expected 401, got $HTTP_CODE)"
  echo "Response: $(echo "$RESPONSE" | head -n-1)"
fi

echo ""
echo "📋 Test 2: Query Parameter Manipulation (Should be ignored)"
echo "------------------------------------------------------------"
echo -e "${YELLOW}⚠️  Manual test required${NC}"
echo "   This test requires a valid session cookie."
echo "   Steps:"
echo "   1. Login to the app in browser"
echo "   2. Open DevTools → Application → Cookies"
echo "   3. Copy the 'redcube.sid' cookie value"
echo "   4. Run:"
echo ""
echo "   curl -X GET '${API_BASE}/history?userId=999&limit=10' \\"
echo "     -H 'Cookie: redcube.sid=YOUR_SESSION_COOKIE' \\"
echo "     -H 'Content-Type: application/json' -v"
echo ""
echo "   Expected: Should return YOUR data, not user 999's data"
echo "   Check logs: docker compose logs content-service | grep -i 'getHistory'"
echo ""

echo "📋 Test 3: Cross-User Access Prevention"
echo "----------------------------------------"
echo -e "${YELLOW}⚠️  Manual test required${NC}"
echo "   This test requires two user accounts."
echo "   Steps:"
echo "   1. Login as User A, get session cookie"
echo "   2. Get User B's map ID from database:"
echo "      docker compose exec postgres psql -U postgres -d redcube_content -c \"SELECT id, user_id FROM learning_maps_history LIMIT 5;\""
echo "   3. Try to access User B's map with User A's session:"
echo ""
echo "   curl -X GET '${API_BASE}/learning-map/USER_B_MAP_ID' \\"
echo "     -H 'Cookie: redcube.sid=USER_A_SESSION_COOKIE' \\"
echo "     -H 'Content-Type: application/json' -v"
echo ""
echo "   Expected: 403 Forbidden or 404 Not Found"
echo "   Check logs: docker compose logs content-service | grep -i 'getLearningMap'"
echo ""

echo "📋 Test 4: Logging Verification"
echo "--------------------------------"
echo "Checking logs for authentication and authorization events..."
echo ""
echo "Recent auth events:"
docker compose logs content-service --tail=50 | grep -i -E "(auth|unauthorized|forbidden)" | tail -10 || echo "No auth events found in recent logs"
echo ""
echo "To see all logs: docker compose logs content-service -f"
echo ""

echo "✅ Automated tests completed"
echo ""
echo "📝 Next Steps:"
echo "   1. Execute manual tests (Test 2 & 3)"
echo "   2. Verify logs capture all security events"
echo "   3. Check that user IDs are logged correctly"
echo "   4. Verify error messages are clear"
