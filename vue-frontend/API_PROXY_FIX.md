# API Proxy Configuration Fix ✅

**Issue Date**: January 12, 2025
**Status**: ✅ RESOLVED
**Fix Time**: ~5 minutes

---

## 🐛 Problem

Vue app was making API requests to the wrong URL:
- **Expected**: `http://localhost:3001/api/content/*` (content service)
- **Actual**: `http://localhost:5173/api/content/*` (Vue dev server)
- **Result**: 404 errors on all API calls

### Error Messages
```
❌ API Error: 404 /analyze
❌ API Error: 404 /assistant/query
```

---

## 🔍 Root Cause

The API client was configured with a **relative base URL**:

```typescript
// apiClient.ts
const apiClient = axios.create({
  baseURL: '/api/content',  // ❌ Relative URL
  timeout: 30000
})
```

When running in development, this resolved to the Vue dev server (port 5173) instead of the content service (port 3001).

---

## ✅ Solution

Added a **Vite proxy configuration** to forward API requests from the dev server to the content service:

### File: [vite.config.ts](vite.config.ts:18-26)

```typescript
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

### How It Works

1. Browser makes request to: `http://localhost:5173/api/content/analyze`
2. Vite dev server intercepts the request (matches `/api` pattern)
3. Proxies request to: `http://localhost:3001/api/content/analyze`
4. Content service responds
5. Vite forwards response back to browser

---

## 🧪 Verification

**Test 1: Assistant Info Endpoint**
```bash
curl http://localhost:5173/api/content/assistant/info
```

**Result**: ✅
```json
{
  "status": "operational",
  "capabilities": [
    "Workflow analysis and suggestions",
    "Content review and feedback",
    "Best practices recommendations",
    "Task automation suggestions",
    "Context-aware assistance"
  ],
  "models": ["deepseek/deepseek-chat", "openai/gpt-3.5-turbo"],
  "version": "1.0.0"
}
```

**Test 2: Frontend Integration**
- Visit: http://localhost:5173/workflow
- Add nodes with content
- Click "Execute Workflow" → ✅ Analysis works
- Click AI Assistant FAB → ✅ Assistant works
- Send message → ✅ AI responds with suggestions

---

## 📝 Why This Approach?

### Alternative Solutions Considered:

1. **❌ Environment Variable for Full URL**
   ```typescript
   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/content'
   ```
   - **Problem**: Requires different configs for dev/prod
   - **Problem**: Hardcodes API URL in frontend

2. **✅ Vite Proxy (CHOSEN)**
   - ✅ Works out of the box in development
   - ✅ Frontend code stays clean (relative URLs)
   - ✅ Production can use different proxy/routing
   - ✅ Avoids CORS issues in development

3. **❌ CORS Configuration on Backend**
   - **Problem**: Not necessary with proxy
   - **Problem**: Security risk if misconfigured

---

## 🚀 Production Deployment

For production, the proxy configuration is **not used** (Vite proxy only works in dev mode). Instead:

1. **Option A**: Use environment variable
   ```bash
   VITE_API_URL=https://api.production.com
   ```

2. **Option B**: Configure Nginx/Apache to proxy `/api` requests
   ```nginx
   location /api {
     proxy_pass http://content-service:3001;
   }
   ```

3. **Option C**: Deploy frontend and backend on same domain

---

## ✅ Status: FIXED

- ✅ Vite proxy configured
- ✅ Dev server restarted on port 5173
- ✅ API requests proxying correctly
- ✅ All endpoints returning expected data
- ✅ Frontend integration working end-to-end

**Ready for testing!** Visit http://localhost:5173/workflow to test the Vue Workflow Lab.
