# 📊 Comprehensive Logging Enhancements Needed

## 🔍 **Current Logging Analysis**

### **What's Currently Logged:**
1. ✅ Authentication middleware logs basic events
2. ✅ Controllers log some operations
3. ❌ Missing: Comprehensive security event logging
4. ❌ Missing: User ID in all logs
5. ❌ Missing: IP address tracking
6. ❌ Missing: Authorization decision logging

---

## 📝 **Required Logging Enhancements**

### **1. Authentication Middleware (`middleware/auth.js`)**

**Current Logging:**
```javascript
console.log('Auth middleware - checking authentication...');
console.log('Session cookie:', sessionCookie ? 'Present' : 'Missing');
console.log('User service response status:', response.status);
console.log(`✅ AUTH MIDDLEWARE SUCCESS: User ID: ${req.user.id}`);
```

**Needed Enhancements:**
```javascript
// Add comprehensive logging with:
- User ID (when available)
- IP address (req.ip or req.headers['x-forwarded-for'])
- Timestamp
- Endpoint accessed
- Action (authentication attempt)
- Result (success/failure)
- Reason (if failure)

// Example:
logger.info('[AUTH] Authentication attempt', {
  userId: req.user?.id || null,
  ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
  endpoint: req.originalUrl,
  method: req.method,
  hasSessionCookie: !!sessionCookie,
  timestamp: new Date().toISOString()
});

logger.info('[AUTH] Authentication success', {
  userId: req.user.id,
  email: req.user.email,
  ip: req.ip,
  endpoint: req.originalUrl,
  timestamp: new Date().toISOString()
});

logger.warn('[AUTH] Authentication failed', {
  ip: req.ip,
  endpoint: req.originalUrl,
  reason: error.message,
  timestamp: new Date().toISOString()
});
```

---

### **2. History Controller (`controllers/analysisController.js`)**

**Current Logging:**
```javascript
// Minimal logging
```

**Needed Enhancements:**
```javascript
async function getHistory(req, res) {
  const userId = req.user?.id;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  
  logger.info('[AUTHZ] Data access attempt', {
    userId,
    ip,
    endpoint: '/api/content/history',
    method: 'GET',
    queryParams: req.query,
    timestamp: new Date().toISOString()
  });
  
  // Log if query param userId was provided (security concern)
  if (req.query.userId) {
    logger.warn('[SECURITY] Query param userId provided (should be ignored)', {
      userId,
      queryParamUserId: req.query.userId,
      ip,
      endpoint: '/api/content/history',
      timestamp: new Date().toISOString()
    });
  }
  
  // ... rest of function
  
  logger.info('[AUTHZ] Data access success', {
    userId,
    ip,
    endpoint: '/api/content/history',
    recordsReturned: history.length,
    timestamp: new Date().toISOString()
  });
}
```

---

### **3. Learning Map Controller (`controllers/learningMapController.js`)**

**Current Logging:**
```javascript
console.log('Getting learning map:', mapId, 'for user:', userId);
```

**Needed Enhancements:**
```javascript
async function getLearningMap(req, res) {
  const userId = req.user?.id;
  const { mapId } = req.params;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  
  logger.info('[AUTHZ] Learning map access attempt', {
    userId,
    mapId,
    ip,
    endpoint: `/api/content/learning-map/${mapId}`,
    timestamp: new Date().toISOString()
  });
  
  // Log if query param userId was provided (security concern)
  if (req.query.userId) {
    logger.warn('[SECURITY] Query param userId provided (should be ignored)', {
      userId,
      queryParamUserId: req.query.userId,
      mapId,
      ip,
      timestamp: new Date().toISOString()
    });
  }
  
  const learningMap = await learningMapsQueries.getLearningMapById(mapId, userId);
  
  if (!learningMap) {
    logger.warn('[AUTHZ] Learning map not found', {
      userId,
      mapId,
      ip,
      timestamp: new Date().toISOString()
    });
    // ... return 404
  }
  
  // Ownership check
  if (learningMap.user_id !== userId) {
    logger.error('[SECURITY] Unauthorized access attempt', {
      requestingUserId: userId,
      mapOwnerId: learningMap.user_id,
      mapId,
      ip,
      endpoint: `/api/content/learning-map/${mapId}`,
      timestamp: new Date().toISOString()
    });
    // ... return 403
  }
  
  logger.info('[AUTHZ] Learning map access success', {
    userId,
    mapId,
    mapOwnerId: learningMap.user_id,
    ip,
    timestamp: new Date().toISOString()
  });
}
```

---

## 🎯 **Industry Standard Logging Format**

### **Structured Logging (JSON Format)**

**Benefits:**
- Easy to parse and search
- Can be sent to log aggregation services (ELK, Splunk, etc.)
- Consistent format across all services

**Format:**
```json
{
  "timestamp": "2025-11-30T13:15:00.000Z",
  "level": "info",
  "service": "content-service",
  "event": "authentication",
  "userId": 123,
  "ip": "192.168.1.1",
  "endpoint": "/api/content/history",
  "method": "GET",
  "result": "success",
  "message": "User authenticated successfully"
}
```

---

## 📊 **Logging Levels**

### **Info Level:**
- Successful authentication
- Successful authorization
- Normal data access

### **Warn Level:**
- Query param manipulation attempts
- Invalid session cookies
- Missing required parameters

### **Error Level:**
- Authentication failures
- Authorization denials
- Security violations

---

## 🔍 **What to Log for Each Event**

### **Authentication Events:**
- ✅ User ID (if available)
- ✅ IP address
- ✅ Timestamp
- ✅ Endpoint accessed
- ✅ Result (success/failure)
- ✅ Reason (if failure)

### **Authorization Events:**
- ✅ User ID (requesting user)
- ✅ Resource ID (if applicable)
- ✅ Resource owner ID (if applicable)
- ✅ IP address
- ✅ Timestamp
- ✅ Endpoint accessed
- ✅ Result (allowed/denied)
- ✅ Reason (if denied)

### **Security Events:**
- ✅ User ID (if available)
- ✅ IP address
- ✅ Timestamp
- ✅ Event type (query param manipulation, unauthorized access, etc.)
- ✅ Details of the attempt
- ✅ Action taken (blocked, logged, etc.)

---

## 🛠️ **Implementation Recommendations**

### **1. Use Structured Logger**

**Current:** `console.log()`
**Recommended:** Use a structured logger like `winston` or `pino`

**Example:**
```javascript
const logger = require('./utils/logger');

logger.info('[AUTH] Authentication attempt', {
  userId: req.user?.id,
  ip: req.ip,
  endpoint: req.originalUrl,
  timestamp: new Date().toISOString()
});
```

### **2. Add Request ID Tracking**

**Add unique request ID to each request:**
```javascript
// Middleware to add request ID
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Include in all logs
logger.info('[AUTH] ...', {
  requestId: req.requestId,
  // ... other fields
});
```

### **3. Log Aggregation**

**Send logs to:**
- File system (for local development)
- ELK Stack (Elasticsearch, Logstash, Kibana)
- CloudWatch (if using AWS)
- Datadog / New Relic (for production monitoring)

---

## ✅ **Testing Logging**

### **Test Commands:**
```bash
# Watch logs in real-time
docker compose logs content-service -f | grep -E "\[AUTH\]|\[AUTHZ\]|\[SECURITY\]"

# Search for specific user
docker compose logs content-service | grep "userId=123"

# Search for security events
docker compose logs content-service | grep "\[SECURITY\]"

# Count authentication attempts
docker compose logs content-service | grep -c "\[AUTH\]"
```

---

## 📚 **References**

- **OWASP Logging Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- **NIST Logging Guidelines:** https://csrc.nist.gov/publications/detail/sp/800-92/final
- **GitHub Security Logging:** https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise
