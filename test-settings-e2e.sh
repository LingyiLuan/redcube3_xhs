#!/bin/bash

# Settings Features E2E Test Script
# Tests all implemented settings features

echo "========================================="
echo "SETTINGS FEATURES E2E TEST"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Function to get session cookie (assumes user is logged in)
# You would need to manually get this from browser DevTools
SESSION_COOKIE="YOUR_SESSION_COOKIE_HERE"

echo "NOTE: This script requires you to be logged in."
echo "Get your session cookie from browser DevTools:"
echo "1. Open http://localhost:5173 in browser"
echo "2. Log in with Google"
echo "3. Open DevTools → Application → Cookies"
echo "4. Copy the 'connect.sid' cookie value"
echo "5. Set SESSION_COOKIE variable in this script"
echo ""
echo "Press Enter to continue or Ctrl+C to exit..."
read

echo "========================================="
echo "TEST 1: Preferences API - GET"
echo "========================================="

response=$(curl -s -X GET http://localhost:8080/api/auth/preferences \
  -H "Cookie: connect.sid=$SESSION_COOKIE" \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep HTTP_CODE | cut -d':' -f2)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo "Response: $body"
  if echo "$body" | grep -q '"success":true'; then
    print_result 0 "GET /api/auth/preferences returns success"
  else
    print_result 1 "GET /api/auth/preferences should return success:true"
  fi
else
  print_result 1 "GET /api/auth/preferences returned HTTP $http_code"
fi

echo ""
echo "========================================="
echo "TEST 2: Preferences API - PUT (email_notifications)"
echo "========================================="

response=$(curl -s -X PUT http://localhost:8080/api/auth/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_COOKIE" \
  -d '{"email_notifications": false}' \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep HTTP_CODE | cut -d':' -f2)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo "Response: $body"
  if echo "$body" | grep -q '"email_notifications":false'; then
    print_result 0 "PUT /api/auth/preferences updates email_notifications"
  else
    print_result 1 "Preference not updated correctly"
  fi
else
  print_result 1 "PUT /api/auth/preferences returned HTTP $http_code"
fi

echo ""
echo "========================================="
echo "TEST 3: Preferences API - PUT (weekly_digest)"
echo "========================================="

response=$(curl -s -X PUT http://localhost:8080/api/auth/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_COOKIE" \
  -d '{"weekly_digest": false}' \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep HTTP_CODE | cut -d':' -f2)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo "Response: $body"
  if echo "$body" | grep -q '"weekly_digest":false'; then
    print_result 0 "PUT /api/auth/preferences updates weekly_digest"
  else
    print_result 1 "Preference not updated correctly"
  fi
else
  print_result 1 "PUT /api/auth/preferences returned HTTP $http_code"
fi

echo ""
echo "========================================="
echo "TEST 4: Preferences API - PUT (theme)"
echo "========================================="

response=$(curl -s -X PUT http://localhost:8080/api/auth/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_COOKIE" \
  -d '{"theme": "dark"}' \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep HTTP_CODE | cut -d':' -f2)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo "Response: $body"
  if echo "$body" | grep -q '"theme":"dark"'; then
    print_result 0 "PUT /api/auth/preferences updates theme"
  else
    print_result 1 "Preference not updated correctly"
  fi
else
  print_result 1 "PUT /api/auth/preferences returned HTTP $http_code"
fi

echo ""
echo "========================================="
echo "TEST 5: Database - Check preferences saved"
echo "========================================="

# Get user ID from session (you'll need to modify this)
db_result=$(docker exec redcube_postgres psql -U postgres -d postgres -t -c "SELECT email_notifications, weekly_digest, theme FROM user_preferences WHERE user_id = 2;" 2>/dev/null)

if [ $? -eq 0 ]; then
  echo "Database result: $db_result"
  if echo "$db_result" | grep -q "f | f | dark"; then
    print_result 0 "Database contains updated preferences"
  else
    print_result 1 "Database preferences don't match (expected: f | f | dark)"
  fi
else
  print_result 1 "Could not query database"
fi

echo ""
echo "========================================="
echo "TEST 6: Reset preferences to defaults"
echo "========================================="

response=$(curl -s -X PUT http://localhost:8080/api/auth/preferences \
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

echo ""
echo "========================================="
echo "TEST 7: /me endpoint includes deletion_scheduled_at"
echo "========================================="

response=$(curl -s -X GET http://localhost:8080/api/auth/me \
  -H "Cookie: connect.sid=$SESSION_COOKIE")

if echo "$response" | grep -q "deletion_scheduled_at"; then
  print_result 0 "/api/auth/me includes deletion_scheduled_at field"
else
  print_result 1 "/api/auth/me missing deletion_scheduled_at field"
fi

echo ""
echo "========================================="
echo "TEST 8: Cancel deletion endpoint (no deletion scheduled)"
echo "========================================="

response=$(curl -s -X POST http://localhost:8080/api/auth/cancel-deletion \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_COOKIE" \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep HTTP_CODE | cut -d':' -f2)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "400" ]; then
  if echo "$body" | grep -q "NO_DELETION_SCHEDULED"; then
    print_result 0 "Cancel deletion correctly returns 400 when no deletion scheduled"
  else
    print_result 1 "Incorrect error message"
  fi
else
  print_result 1 "Expected HTTP 400, got $http_code"
fi

echo ""
echo "========================================="
echo "SUMMARY"
echo "========================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}ALL TESTS PASSED! ✓${NC}"
  exit 0
else
  echo -e "${RED}SOME TESTS FAILED ✗${NC}"
  exit 1
fi
