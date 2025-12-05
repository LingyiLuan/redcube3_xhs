# Complete Workflow Documentation

**Date**: January 12, 2025
**Status**: Debugging in progress

---

## 🔍 Issue Summary

| Error | Status Code | Message | Root Cause |
|-------|-------------|---------|-----------|
| AI Assistant | 400 | "Query text is required" | Frontend sends `message` field, backend expects `text` field |
| Analyze Button | 401 | "No session cookie found" | Vue app has no authentication, backend requires `requireAuth` middleware |

---

## 📊 Workflow 1: Analyze Button Click

### User Action Flow

```
User clicks "Execute Workflow" button
  ↓
WorkflowEditor.vue receives click event
  ↓
Calls workflowStore.executeWorkflow()
  ↓
[Decision Point] How many nodes have content?
  ├─ 1 node → executeSingleAnalysis()
  └─ 2+ nodes → executeBatchAnalysis()
```

### Code Trace: Single Node Analysis

**1. User Interface** - [WorkflowToolbar.vue](src/components/Toolbar/WorkflowToolbar.vue)
```vue
<button @click="handleExecute" :disabled="!canExecute">
  <Play :size="16" />
  Execute Workflow
</button>
```

**2. Store Action** - [workflowStore.ts:219-245](src/stores/workflowStore.ts#L219-245)
```typescript
async function executeWorkflow() {
  const nodesToAnalyze = nodesWithContent.value

  if (nodesToAnalyze.length === 0) {
    throw new Error('No nodes with content to analyze')
  }

  console.log(`[WorkflowStore] Found ${nodesToAnalyze.length} node(s) to analyze`)

  isExecuting.value = true

  try {
    if (nodesToAnalyze.length > 1) {
      // BATCH PATH
      return await executeBatchAnalysis(nodesToAnalyze)
    } else {
      // SINGLE PATH
      const firstNode = nodesToAnalyze[0]
      if (!firstNode) throw new Error('No valid node to analyze')
      return await executeSingleAnalysis(firstNode)
    }
  } finally {
    isExecuting.value = false
  }
}
```

**3. Single Analysis Function** - [workflowStore.ts:183-217](src/stores/workflowStore.ts#L183-217)
```typescript
async function analyzeSingleNode(nodeId: string) {
  const node = nodes.value.find(n => n.id === nodeId)
  const authStore = useAuthStore()

  // Update status to 'analyzing'
  updateNode(nodeId, { status: 'analyzing' })

  try {
    // CALL ANALYSIS SERVICE
    const result = await analysisService.analyzeSingle(
      node.data.content,
      authStore.userId  // ⚠️ THIS IS undefined in Vue app (no auth)
    )

    // Update with result
    updateNode(nodeId, {
      status: 'completed',
      analysisResult: result,
      analyzedAt: new Date().toISOString()
    })

    return result
  } catch (error: any) {
    updateNode(nodeId, {
      status: 'error',
      error: error.response?.data?.error || error.message
    })

    throw error
  }
}
```

**4. Analysis Service** - [analysisService.ts:7-14](src/services/analysisService.ts#L7-14)
```typescript
async analyzeSingle(text: string, userId?: number) {
  const response = await apiClient.post('/analyze', {
    text: text.trim(),
    userId  // undefined
  })

  return response.data
}
```

**5. API Client** - [apiClient.ts:4-9](src/services/apiClient.ts#L4-9)
```typescript
const apiClient = axios.create({
  baseURL: '/api/content',  // Relative URL
  timeout: 30000
})

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem('authToken')  // ⚠️ NULL in Vue app
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // ⚠️ NO COOKIES sent automatically by axios

  return config
})
```

**6. Vite Proxy** - [vite.config.ts:19-26](vite.config.ts#L19-26)
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',  // API Gateway
      changeOrigin: true,
      secure: false,
    }
  }
}
```

**Request Sent:**
```http
POST http://localhost:5173/api/content/analyze
Content-Type: application/json

{
  "text": "面试字节跳动前端岗位，三面都通过了，问了很多算法题",
  "userId": undefined
}
```

**Vite Proxy Forwards:**
```http
POST http://localhost:8080/api/content/analyze
Content-Type: application/json
Cookie: (empty)  ⚠️ NO COOKIE

{
  "text": "面试字节跳动前端岗位，三面都通过了，问了很多算法题",
  "userId": undefined
}
```

**7. Nginx API Gateway** - [api-gateway/nginx.conf:66-75](../../api-gateway/nginx.conf#L66-75)
```nginx
location /api/content {
  proxy_pass http://content-service;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header Cookie $http_cookie;  # ⚠️ Empty cookie forwarded
  proxy_pass_header Set-Cookie;
}
```

**Nginx Forwards:**
```http
POST http://content-service:3003/api/content/analyze
Content-Type: application/json
Cookie: (empty)  ⚠️ STILL NO COOKIE

{
  "text": "面试字节跳动前端岗位，三面都通过了，问了很多算法题",
  "userId": undefined
}
```

**8. Content Service Routes** - [contentRoutes.js:59](../services/content-service/src/routes/contentRoutes.js#L59)
```javascript
router.post('/analyze', requireAuth, analyzeSinglePost);
//                      ^^^^^^^^^^^ AUTH MIDDLEWARE RUNS FIRST
```

**9. Auth Middleware** - [middleware/auth.js:12-27](../services/content-service/src/middleware/auth.js#L12-27)
```javascript
async function requireAuth(req, res, next) {
  // Extract session cookie
  const sessionCookie = req.headers.cookie;
  console.log('Session cookie:', sessionCookie ? 'Present' : 'Missing');

  if (!sessionCookie) {
    // ⚠️ THIS BRANCH IS TAKEN
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'No session cookie found'
    });
  }

  // Would verify with user-service if cookie existed...
  next();
}
```

**10. Response Sent:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "error": "Authentication required",
  "message": "No session cookie found"
}
```

**11. Response Received in Vue:**
```javascript
catch (error) {
  console.error('❌ API Error: 401 /analyze', error.response.data)
  // {
  //   success: false,
  //   error: "Authentication required",
  //   message: "No session cookie found"
  // }
}
```

---

## 📊 Workflow 2: AI Assistant Message Send

### User Action Flow

```
User types message and clicks send
  ↓
MessageInput.vue emits 'send' event
  ↓
AiAssistant.vue receives event
  ↓
Calls handleSendMessage()
  ↓
Builds workflow context
  ↓
Calls assistantStore.sendMessage(text, context)
  ↓
Store calls assistantService.query()
  ↓
API request sent
```

### Code Trace

**1. User Interface** - [MessageInput.vue](src/components/Assistant/MessageInput.vue)
```vue
<button @click="handleSend" :disabled="!canSend || disabled">
  <Send :size="16" />
</button>

<script setup>
const handleSend = () => {
  emit('send', inputText.value.trim())
  inputText.value = ''
}
</script>
```

**2. AI Assistant Component** - [AiAssistant.vue](src/components/Assistant/AiAssistant.vue)
```typescript
const handleSendMessage = async (text: string) => {
  // Build context from current workflow
  const context = {
    workflowId: workflowStore.workflowId,
    nodes: workflowStore.nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.data.label,
      content: n.data.content,
      status: n.data.status
    })),
    currentNodeId: workflowStore.selectedNodeId || undefined
  }

  await assistantStore.sendMessage(text, context)
}
```

**3. Assistant Store** - [assistantStore.ts:13-60](src/stores/assistantStore.ts#L13-60)
```typescript
async function sendMessage(text: string, context: AssistantContext) {
  // Add user message
  const userMessage: Message = {
    id: generateId(),
    role: 'user',
    content: text,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  isLoading.value = true

  try {
    // CALL ASSISTANT SERVICE
    const response = await assistantService.query(text, context)

    // Add assistant response
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      suggestions: response.suggestions || []
    }

    messages.value.push(assistantMessage)

    return assistantMessage
  } catch (error: any) {
    console.error('[AssistantStore] Failed to send message:', error)
    throw error
  } finally {
    isLoading.value = false
  }
}
```

**4. Assistant Service** - [assistantService.ts:8-15](src/services/assistantService.ts#L8-15)
```typescript
async query(message: string, context: AssistantContext): Promise<AssistantResponse> {
  const response = await apiClient.post('/assistant/query', {
    message,  // ⚠️ WRONG FIELD NAME - should be 'text'
    context
  })

  return response.data
}
```

**5. API Client** - (same as above)
```typescript
POST /api/content/assistant/query
```

**Request Sent:**
```http
POST http://localhost:5173/api/content/assistant/query
Content-Type: application/json

{
  "message": "What can you help me with?",  ⚠️ WRONG - should be "text"
  "context": {
    "workflowId": "workflow-uuid",
    "nodes": [
      {
        "id": "node-1",
        "type": "input",
        "label": "Interview Post",
        "content": "面试字节跳动...",
        "status": "idle"
      }
    ]
  }
}
```

**6. Vite Proxy → Nginx → Content Service** (same as above)

**7. Assistant Controller** - [assistantController.js:7-15](../services/content-service/src/controllers/assistantController.js#L7-15)
```javascript
async function queryAssistant(req, res) {
  try {
    const { text, context } = req.body;
    //      ^^^^ EXPECTS 'text' field

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      // ⚠️ THIS VALIDATION FAILS
      return res.status(400).json({
        error: 'Query text is required and must be a non-empty string'
      });
    }

    // Would process query with OpenRouter...
  } catch (error) {
    res.status(500).json({ error: 'Failed to process assistant query' })
  }
}
```

**8. Response Sent:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Query text is required and must be a non-empty string"
}
```

**9. Response Received in Vue:**
```javascript
catch (error) {
  console.error('❌ API Error: 400 /assistant/query', error.response.data)
  // { error: "Query text is required and must be a non-empty string" }
}
```

---

## 🔧 Root Causes

### Issue 1: AI Assistant 400 Error

**Problem**: Field name mismatch
- **Frontend sends**: `message` field
- **Backend expects**: `text` field

**Location**: [assistantService.ts:9](src/services/assistantService.ts#L9)

**Fix**: Change `message` to `text`

### Issue 2: Analyze 401 Error

**Problem**: No authentication in Vue app
- **Backend requires**: Session cookie from Google OAuth
- **Vue app has**: No authentication system implemented

**Why React app works**:
1. React app has Google OAuth login
2. User authenticates via `/api/auth/google`
3. Session cookie stored in browser
4. Cookie automatically sent with all requests

**Why Vue app fails**:
1. Vue app has NO authentication
2. No login page
3. No session cookie
4. Backend rejects request

**Solutions** (3 options):

#### Option A: Remove Auth Requirement (Quick Fix)
Make `/analyze` endpoint use `optionalAuth` instead of `requireAuth`
- ✅ Fast (5 minutes)
- ⚠️ No user association
- ⚠️ Security risk

#### Option B: Implement Google OAuth in Vue (Proper Fix)
Build full authentication like React app
- ✅ Proper solution
- ✅ User data tracked
- ❌ Takes 2-3 days

#### Option C: Embed Vue in React (Recommended)
Use React app's authentication
- ✅ No code duplication
- ✅ Uses existing auth
- ✅ Fast integration (1 day)

---

## 📋 Complete Request/Response Examples

### Example 1: Successful Analyze (React App with Auth)

**Request:**
```http
POST http://localhost:8080/api/content/analyze
Content-Type: application/json
Cookie: connect.sid=s%3Axxx.yyy; Path=/; HttpOnly

{
  "text": "面试字节跳动前端岗位，三面都通过了，问了很多算法题"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 123,
  "summary": "关于字节跳动前端面试的经验分享...",
  "keywords": ["字节跳动", "前端", "算法", "三面"],
  "sentiment": {
    "score": 0.7,
    "label": "positive"
  },
  "topics": ["面试经验", "技术能力"],
  "createdAt": "2025-01-12T00:00:00.000Z",
  "aiProvider": "OpenRouter"
}
```

### Example 2: Failed Analyze (Vue App without Auth)

**Request:**
```http
POST http://localhost:8080/api/content/analyze
Content-Type: application/json
Cookie: (empty)

{
  "text": "面试字节跳动前端岗位，三面都通过了，问了很多算法题"
}
```

**Response:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "error": "Authentication required",
  "message": "No session cookie found"
}
```

---

## 🎯 Recommended Fix Strategy

### Immediate (5 minutes) - Fix AI Assistant

**File**: [assistantService.ts](src/services/assistantService.ts)
```typescript
// CHANGE
message,

// TO
text: message,
```

### Short-term (1 hour) - Make Analyze Work Without Auth

**File**: [contentRoutes.js](../services/content-service/src/routes/contentRoutes.js)
```javascript
// CHANGE
router.post('/analyze', requireAuth, analyzeSinglePost);

// TO
router.post('/analyze', optionalAuth, analyzeSinglePost);
```

This allows Vue app to work for testing, but won't track user data.

### Long-term (1-2 weeks) - Proper Integration

Embed Vue Workflow Lab inside React app (see [ARCHITECTURE_CLARIFICATION.md](../ARCHITECTURE_CLARIFICATION.md))

---

**Last Updated**: January 12, 2025
**Status**: Ready to fix
