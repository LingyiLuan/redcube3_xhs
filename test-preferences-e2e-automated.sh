#!/bin/bash

# Automated E2E Test for Preferences Endpoints
# Tests GET and PUT /api/auth/preferences

echo "========================================="
echo "PREFERENCES E2E AUTOMATED TEST"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} - $2"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC} - $2"
    ((TESTS_FAILED++))
  fi
}

# Function to print section header
print_section() {
  echo ""
  echo -e "${BLUE}=========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}=========================================${NC}"
}

# Check if user service is running
print_section "STEP 1: Checking Services"

if ! docker ps | grep -q "redcube3_xhs-user-service-1"; then
  echo -e "${RED}ERROR: User service is not running${NC}"
  exit 1
fi

echo -e "${GREEN}✓ User service is running${NC}"

# Get session cookie from browser (manual step)
echo ""
echo -e "${YELLOW}IMPORTANT:${NC} You need to be logged in to test these endpoints."
echo "If you're not logged in, open http://localhost:5173 and log in with Google."
echo ""
echo "This script will use your browser session. Make sure you're logged in!"
echo ""
echo "Press Enter to continue or Ctrl+C to exit..."
read

# Test using browser session (no need for manual cookie)
BASE_URL="http://localhost:8080"

# Monitor logs in background
print_section "STEP 2: Starting Log Monitor"
docker logs -f redcube3_xhs-user-service-1 2>&1 | grep -E "\[Get Preferences\]|\[Update Preferences\]" &
LOG_PID=$!
echo "Log monitor started (PID: $LOG_PID)"
sleep 2

# ==============================================================================
# TEST 1: GET Preferences - Initial Load
# ==============================================================================
print_section "TEST 1: GET /api/auth/preferences (Initial Load)"

echo "Requesting preferences..."
response=$(curl -s -X GET "$BASE_URL/api/auth/preferences" \
  -H "Cookie: connect.sid=$SESSION_COOKIE" \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep HTTP_CODE | cut -d':' -f2)
body=$(echo "$response" | sed '$d')

echo "Response code: $http_code"
echo "Response body: $body"

if [ "$http_code" = "200" ]; then
  if echo "$body" | grep -q '"success":true'; then
    print_result 0 "GET preferences returns 200 OK with success:true"
  else
    print_result 1 "GET preferences returned 200 but missing success:true"
  fi
else
  print_result 1 "GET preferences returned HTTP $http_code (expected 200)"
fi

# Check if response has data object
if echo "$body" | grep -q '"data":'; then
  print_result 0 "Response contains data object"
else
  print_result 1 "Response missing data object"
fi

# ==============================================================================
# TEST 2: PUT Preferences - Update email_notifications to false
# ==============================================================================
print_section "TEST 2: PUT /api/auth/preferences (Update email_notifications)"

echo "Updating email_notifications to false..."
response=$(curl -s -X PUT "$BASE_URL/api/auth/preferences" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_COOKIE" \
  -d '{"email_notifications": false}' \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep HTTP_CODE | cut -d':' -f2)
body=$(echo "$response" | sed '$d')

echo "Response code: $http_code"
echo "Response body: $body"

if [ "$http_code" = "200" ]; then
  print_result 0 "PUT preferences returns 200 OK"
else
  print_result 1 "PUT preferences returned HTTP $http_code (expected 200)"
fi

if echo "$body" | grep -q '"email_notifications":false'; then
  print_result 0 "email_notifications updated to false"
else
  print_result 1 "email_notifications not updated correctly"
fi

# ==============================================================================
# TEST 3: GET Preferences - Verify Persistence
# ==============================================================================
print_section "TEST 3: GET /api/auth/preferences (Verify Persistence)"

echo "Fetching preferences again to verify..."
sleep 1

response=$(curl -s -X GET "$BASE_URL/api/auth/preferences" \
  -H "Cookie: connect.sid=$SESSION_COOKIE" \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep HTTP_CODE | cut -d':' -f2)
body=$(echo "$response" | sed '$d')

echo "Response code: $http_code"
echo "Response body: $body"

if echo "$body" | grep -q '"email_notifications":false'; then
  print_result 0 "email_notifications persisted as false"
else
  print_result 1 "email_notifications did not persist"
fi

# ==============================================================================
# TEST 4: PUT Preferences - Update theme to dark
# ==============================================================================
print_section "TEST 4: PUT /api/auth/preferences (Update theme)"

echo "Updating theme to dark..."
response=$(curl -s -X PUT "$BASE_URL/api/auth/preferences" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_COOKIE" \
  -d '{"theme": "dark"}' \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep HTTP_CODE | cut -d':' -f2)
body=$(echo "$response" | sed '$d')

echo "Response code: $http_code"
echo "Response body: $body"

if [ "$http_code" = "200" ]; then
  print_result 0 "PUT theme returns 200 OK"
else
  print_result 1 "PUT theme returned HTTP $http_code (expected 200)"
fi

if echo "$body" | grep -q '"theme":"dark"'; then
  print_result 0 "Theme updated to dark"
else
  print_result 1 "Theme not updated correctly"
fi

# ==============================================================================
# TEST 5: PUT Preferences - Invalid theme value
# ==============================================================================
print_section "TEST 5: PUT /api/auth/preferences (Invalid theme - should fail)"

echo "Attempting to set invalid theme..."
response=$(curl -s -X PUT "$BASE_URL/api/auth/preferences" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_COOKIE" \
  -d '{"theme": "invalid"}' \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep HTTP_CODE | cut -d':' -f2)
body=$(echo "$response" | sed '$d')

echo "Response code: $http_code"
echo "Response body: $body"

if [ "$http_code" = "400" ]; then
  print_result 0 "Invalid theme correctly rejected with 400"
else
  print_result 1 "Invalid theme returned HTTP $http_code (expected 400)"
fi

# ==============================================================================
# TEST 6: Database Verification
# ==============================================================================
print_section "TEST 6: Database Verification"

echo "Querying database directly..."
db_result=$(docker exec redcube_postgres psql -U postgres -d postgres -t -c "SELECT email_notifications, theme FROM user_preferences WHERE user_id = 1;" 2>/dev/null)

if [ $? -eq 0 ]; then
  echo "Database result: $db_result"

  if echo "$db_result" | grep -q "f"; then
    print_result 0 "Database shows email_notifications = false"
  else
    print_result 1 "Database does not show email_notifications = false"
  fi

  if echo "$db_result" | grep -q "dark"; then
    print_result 0 "Database shows theme = dark"
  else
    print_result 1 "Database does not show theme = dark"
  fi
else
  print_result 1 "Could not query database"
fi

# ==============================================================================
# TEST 7: Reset to Defaults
# ==============================================================================
print_section "TEST 7: Reset Preferences to Defaults"

echo "Resetting preferences to defaults..."
response=$(curl -s -X PUT "$BASE_URL/api/auth/preferences" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_COOKIE" \
  -d '{"email_notifications": true, "weekly_digest": true, "theme": "light"}' \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep HTTP_CODE | cut -d':' -f2)

if [ "$http_code" = "200" ]; then
  print_result 0 "Preferences reset to defaults"
else
  print_result 1 "Failed to reset preferences"
fi

# ==============================================================================
# CLEANUP
# ==============================================================================
print_section "CLEANUP"

echo "Stopping log monitor (PID: $LOG_PID)..."
kill $LOG_PID 2>/dev/null
echo "Log monitor stopped"

# ==============================================================================
# SUMMARY
# ==============================================================================
print_section "TEST SUMMARY"

echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
  PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
  echo -e "Pass Rate: ${PASS_RATE}%"
fi

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}=========================================${NC}"
  echo -e "${GREEN}ALL TESTS PASSED! ✓${NC}"
  echo -e "${GREEN}=========================================${NC}"
  exit 0
else
  echo -e "${RED}=========================================${NC}"
  echo -e "${RED}SOME TESTS FAILED ✗${NC}"
  echo -e "${RED}=========================================${NC}"

  echo ""
  echo "Next steps:"
  echo "1. Check the logs above for error details"
  echo "2. Run: docker logs redcube3_xhs-user-service-1 --tail 50"
  echo "3. Look for [Get Preferences] or [Update Preferences] log entries"

  exit 1
fi
