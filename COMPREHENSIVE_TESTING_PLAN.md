# 🧪 Comprehensive Security Testing Plan

## 📋 **Testing Strategy Overview**

This document outlines a comprehensive testing plan to verify:
1. ✅ Users can only access their own data
2. ✅ Authentication is properly enforced
3. ✅ Authorization checks work correctly
4. ✅ Error handling provides clear feedback
5. ✅ Logging captures all security events

---

## 🔬 **Industry Best Practices (Research Findings)**

### **1. OWASP API Security Testing Framework**

**Key Principles:**
- **Authentication Testing:** Verify all protected endpoints require valid sessions
- **Authorization Testing:** Verify users can only access their own resources
- **Input Validation:** Verify client-supplied IDs are rejected
- **Error Handling:** Verify errors don't leak sensitive information
- **Audit Logging:** Log all authentication/authorization events

### **2. Industry Examples (GitHub, Google, AWS)**

**Common Patterns:**
1. **Multi-layer Testing:**
   - Unit tests for middleware
   - Integration tests for endpoints
   - End-to-end tests for user flows
   - Security penetration tests

2. **Comprehensive Logging:**
   - Log all authentication attempts (success/failure)
   - Log all authorization checks (allowed/denied)
   - Log all data access attempts
   - Include user ID, IP address, timestamp, action

3. **Test Scenarios:**
   - Valid user accessing own data ✅
   - Valid user accessing other user's data ❌
   - Unauthenticated user accessing protected endpoint ❌
   - Expired session accessing endpoint ❌
   - Modified session cookie ❌

---

## 🧪 **Test Plan**

### **Test 1: Authentication Enforcement**

**Objective:** Verify all protected endpoints require authentication

**Test Cases:**
1. **Unauthenticated Request to `/api/content/history`**
   - Expected: 401 Unauthorized
   - Verify: No data returned

2. **Unauthenticated Request to `/api/content/learning-maps/history`**
   - Expected: 401 Unauthorized
   - Verify: No data returned

3. **Unauthenticated Request to `/api/content/learning-map/:mapId`**
   - Expected: 401 Unauthorized
   - Verify: No data returned

**Test Commands:**
```bash
# Test 1.1: Unauthenticated /history
curl -X GET "http://localhost:8080/api/content/history?limit=10" \
  -H "Content-Type: application/json" \
  -v

# Test 1.2: Unauthenticated /learning-maps/history
curl -X GET "http://localhost:8080/api/content/learning-maps/history?limit=10" \
  -H "Content-Type: application/json" \
  -v

# Test 1.3: Unauthenticated /learning-map/:mapId
curl -X GET "http://localhost:8080/api/content/learning-map/1" \
  -H "Content-Type: application/json" \
  -v
```

**Expected Logs:**
```
[Auth Middleware] No session cookie found
[Auth Middleware] Authentication failed: 401
```

---

### **Test 2: Authorization - Own Data Access**

**Objective:** Verify authenticated users can access their own data

**Test Cases:**
1. **User A accesses their own history**
   - Expected: 200 OK with User A's data only
   - Verify: Response contains only User A's reports

2. **User A accesses their own learning maps**
   - Expected: 200 OK with User A's maps only
   - Verify: Response contains only User A's maps

3. **User A accesses their own learning map by ID**
   - Expected: 200 OK with User A's map
   - Verify: Response contains User A's map data

**Test Commands:**
```bash
# Test 2.1: User A's own history (with valid session cookie)
curl -X GET "http://localhost:8080/api/content/history?limit=10" \
  -H "Content-Type: application/json" \
  -H "Cookie: redcube.sid=USER_A_SESSION_COOKIE" \
  -v

# Test 2.2: User A's own learning maps
curl -X GET "http://localhost:8080/api/content/learning-maps/history?limit=10" \
  -H "Content-Type: application/json" \
  -H "Cookie: redcube.sid=USER_A_SESSION_COOKIE" \
  -v

# Test 2.3: User A's own learning map (valid mapId)
curl -X GET "http://localhost:8080/api/content/learning-map/USER_A_MAP_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: redcube.sid=USER_A_SESSION_COOKIE" \
  -v
```

**Expected Logs:**
```
[Auth Middleware] Session cookie: Present
[Auth Middleware] User ID: USER_A_ID
[Auth Middleware] ✅ AUTH MIDDLEWARE SUCCESS
[getHistory] Fetching history for user: USER_A_ID
[getHistory] Found X reports for user USER_A_ID
```

---

### **Test 3: Authorization - Cross-User Access Prevention**

**Objective:** Verify users CANNOT access other users' data

**Test Cases:**
1. **User A tries to access User B's history (via query param)**
   - Expected: 200 OK with User A's data (query param ignored)
   - Verify: Response contains only User A's data, not User B's

2. **User A tries to access User B's learning maps (via query param)**
   - Expected: 200 OK with User A's maps (query param ignored)
   - Verify: Response contains only User A's maps, not User B's

3. **User A tries to access User B's learning map by ID**
   - Expected: 404 Not Found or 403 Forbidden
   - Verify: No User B's data returned

**Test Commands:**
```bash
# Test 3.1: User A with User B's userId in query (should be ignored)
curl -X GET "http://localhost:8080/api/content/history?userId=USER_B_ID&limit=10" \
  -H "Content-Type: application/json" \
  -H "Cookie: redcube.sid=USER_A_SESSION_COOKIE" \
  -v

# Test 3.2: User A with User B's userId in query (should be ignored)
curl -X GET "http://localhost:8080/api/content/learning-maps/history?userId=USER_B_ID&limit=10" \
  -H "Content-Type: application/json" \
  -H "Cookie: redcube.sid=USER_A_SESSION_COOKIE" \
  -v

# Test 3.3: User A accessing User B's learning map
curl -X GET "http://localhost:8080/api/content/learning-map/USER_B_MAP_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: redcube.sid=USER_A_SESSION_COOKIE" \
  -v
```

**Expected Logs:**
```
[Auth Middleware] User ID: USER_A_ID (from session)
[getHistory] Fetching history for user: USER_A_ID (ignoring query param userId=USER_B_ID)
[getHistory] Found X reports for user USER_A_ID
[getLearningMap] Getting learning map: USER_B_MAP_ID for user: USER_A_ID
[getLearningMap] Learning map not found or access denied: 403 Forbidden
```

---

### **Test 4: Session Validation**

**Objective:** Verify expired/invalid sessions are rejected

**Test Cases:**
1. **Expired session cookie**
   - Expected: 401 Unauthorized
   - Verify: Clear error message

2. **Invalid session cookie**
   - Expected: 401 Unauthorized
   - Verify: Clear error message

3. **Missing session cookie**
   - Expected: 401 Unauthorized
   - Verify: Clear error message

**Test Commands:**
```bash
# Test 4.1: Expired session
curl -X GET "http://localhost:8080/api/content/history?limit=10" \
  -H "Content-Type: application/json" \
  -H "Cookie: redcube.sid=EXPIRED_SESSION_COOKIE" \
  -v

# Test 4.2: Invalid session
curl -X GET "http://localhost:8080/api/content/history?limit=10" \
  -H "Content-Type: application/json" \
  -H "Cookie: redcube.sid=INVALID_COOKIE_VALUE" \
  -v

# Test 4.3: No cookie
curl -X GET "http://localhost:8080/api/content/history?limit=10" \
  -H "Content-Type: application/json" \
  -v
```

**Expected Logs:**
```
[Auth Middleware] Session cookie: Present
[Auth Middleware] Making request to user service for auth verification...
[User Service] GET /api/auth/me - Authenticated: false
[Auth Middleware] Authentication failed: 401
```

---

### **Test 5: Error Handling & Logging**

**Objective:** Verify comprehensive logging and clear error messages

**Test Cases:**
1. **Verify all authentication events are logged**
2. **Verify all authorization checks are logged**
3. **Verify error messages don't leak sensitive info**
4. **Verify logs include: user ID, IP, timestamp, action**

**What to Check in Logs:**
- ✅ Authentication attempts (success/failure)
- ✅ Authorization checks (allowed/denied)
- ✅ User ID in all logs
- ✅ Timestamp for all events
- ✅ Action/endpoint accessed
- ✅ Error codes and messages

---

## 📊 **Test Execution Script**

### **Automated Test Script**

```bash
#!/bin/bash
# comprehensive_security_tests.sh

echo "🧪 Starting Comprehensive Security Tests..."
echo ""

# Test 1: Authentication Enforcement
echo "Test 1: Authentication Enforcement"
echo "===================================="

echo "Test 1.1: Unauthenticated /history"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:8080/api/content/history?limit=10")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" == "401" ]; then
  echo "✅ PASS: Returns 401 Unauthorized"
else
  echo "❌ FAIL: Expected 401, got $HTTP_CODE"
fi
echo ""

echo "Test 1.2: Unauthenticated /learning-maps/history"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:8080/api/content/learning-maps/history?limit=10")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" == "401" ]; then
  echo "✅ PASS: Returns 401 Unauthorized"
else
  echo "❌ FAIL: Expected 401, got $HTTP_CODE"
fi
echo ""

# Test 2: Own Data Access (requires valid session cookie)
echo "Test 2: Own Data Access"
echo "======================="
echo "⚠️  Manual test required: Need valid session cookie"
echo "   1. Login as User A"
echo "   2. Get session cookie from browser DevTools"
echo "   3. Run: curl -X GET 'http://localhost:8080/api/content/history?limit=10' -H 'Cookie: redcube.sid=YOUR_SESSION_COOKIE'"
echo ""

# Test 3: Cross-User Access Prevention
echo "Test 3: Cross-User Access Prevention"
echo "===================================="
echo "⚠️  Manual test required: Need two user accounts"
echo "   1. Login as User A, get session cookie"
echo "   2. Get User B's userId from database"
echo "   3. Try: curl -X GET 'http://localhost:8080/api/content/history?userId=USER_B_ID' -H 'Cookie: redcube.sid=USER_A_SESSION_COOKIE'"
echo "   4. Verify: Response contains only User A's data"
echo ""

echo "✅ Test script completed"
echo "📋 Check logs in: docker compose logs content-service"
```

---

## 📝 **Logging Requirements**

### **What to Log (Industry Standard)**

1. **Authentication Events:**
   ```
   [AUTH] User login attempt: userId=123, email=user@example.com, ip=192.168.1.1, success=true
   [AUTH] User login attempt: email=user@example.com, ip=192.168.1.1, success=false, reason=invalid_password
   [AUTH] Session validation: userId=123, ip=192.168.1.1, valid=true
   [AUTH] Session validation: userId=123, ip=192.168.1.1, valid=false, reason=expired
   ```

2. **Authorization Events:**
   ```
   [AUTHZ] Data access: userId=123, endpoint=/api/content/history, allowed=true
   [AUTHZ] Data access: userId=123, endpoint=/api/content/learning-map/456, allowed=true, mapUserId=123
   [AUTHZ] Data access: userId=123, endpoint=/api/content/learning-map/789, allowed=false, reason=wrong_owner, mapUserId=456
   ```

3. **Security Events:**
   ```
   [SECURITY] Unauthorized access attempt: endpoint=/api/content/history, ip=192.168.1.1, reason=no_session
   [SECURITY] Suspicious activity: userId=123, endpoint=/api/content/history?userId=456, action=query_param_manipulation
   ```

---

## 🔍 **Manual Testing Checklist**

### **Prerequisites:**
- [ ] Two user accounts created (User A and User B)
- [ ] User A has some reports and learning maps
- [ ] User B has some reports and learning maps
- [ ] Access to browser DevTools to get session cookies
- [ ] Access to Docker logs: `docker compose logs content-service`

### **Test Execution:**

1. **Authentication Tests:**
   - [ ] Test unauthenticated access to `/api/content/history` → Should get 401
   - [ ] Test unauthenticated access to `/api/content/learning-maps/history` → Should get 401
   - [ ] Test unauthenticated access to `/api/content/learning-map/:id` → Should get 401

2. **Own Data Access Tests:**
   - [ ] Login as User A
   - [ ] Access `/api/content/history` → Should see only User A's reports
   - [ ] Access `/api/content/learning-maps/history` → Should see only User A's maps
   - [ ] Access `/api/content/learning-map/USER_A_MAP_ID` → Should see User A's map

3. **Cross-User Access Prevention Tests:**
   - [ ] Login as User A
   - [ ] Try to access `/api/content/history?userId=USER_B_ID` → Should see only User A's data
   - [ ] Try to access `/api/content/learning-maps/history?userId=USER_B_ID` → Should see only User A's maps
   - [ ] Try to access `/api/content/learning-map/USER_B_MAP_ID` → Should get 403 or 404

4. **Logging Verification:**
   - [ ] Check logs for authentication events
   - [ ] Check logs for authorization checks
   - [ ] Verify user IDs are logged correctly
   - [ ] Verify timestamps are present
   - [ ] Verify error messages are clear but don't leak sensitive info

---

## 🎯 **Expected Results Summary**

| Test | Expected Result | Log Entry |
|------|----------------|-----------|
| Unauthenticated `/history` | 401 Unauthorized | `[AUTH] No session cookie found` |
| User A's own `/history` | 200 OK (User A's data) | `[AUTHZ] userId=123, allowed=true` |
| User A with `?userId=456` | 200 OK (User A's data, param ignored) | `[AUTHZ] userId=123, queryParam ignored` |
| User A accessing User B's map | 403 Forbidden | `[AUTHZ] userId=123, mapUserId=456, denied` |

---

## 📚 **References**

- **OWASP API Security Top 10:** https://owasp.org/www-project-api-security/
- **OWASP Testing Guide:** https://owasp.org/www-project-web-security-testing-guide/
- **GitHub API Security:** https://docs.github.com/en/rest/security
- **AWS API Gateway Security:** https://docs.aws.amazon.com/apigateway/latest/developerguide/security.html

---

**Next Steps:**
1. Review this testing plan
2. Execute manual tests
3. Verify logs capture all events
4. Document any issues found
5. Fix any gaps in logging
