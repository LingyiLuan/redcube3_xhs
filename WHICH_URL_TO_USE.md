# 🌐 Which URL Should I Use for Testing?

## **Quick Answer**

**For Local Testing (Redis Session Store):**
- ✅ **Use: `http://localhost:5173`** (Vue frontend)
- ❌ Don't use: `localhost:3001` (that's just the backend)
- ❌ Don't use: `labzero.io` (that's production)

---

## **Why `localhost:5173`?**

### **Your Setup:**

```
Browser → localhost:5173 (Vue Frontend)
           ↓ (proxies /api requests)
           localhost:8080 (API Gateway)
           ↓ (routes to)
           localhost:3001 (User Service)
           ↓ (uses)
           Redis (Session Store)
```

### **How It Works:**

1. **Frontend (`localhost:5173`):**
   - Vue app running on Vite dev server
   - Has proxy configured: `/api` → `http://localhost:8080`
   - This is what you see in the browser

2. **API Gateway (`localhost:8080`):**
   - Routes requests to backend services
   - `/api/auth/*` → `user-service:3001`
   - `/api/content/*` → `content-service:3003`

3. **User Service (`localhost:3001`):**
   - Handles authentication
   - Uses Redis for sessions (what we just tested!)

---

## **Testing Steps**

### **Step 1: Make Sure All Services Are Running**

```bash
# Terminal 1: Start Redis
docker-compose up -d redis

# Terminal 2: Start User Service (with Redis)
cd services/user-service
export REDIS_URL=redis://localhost:6379
npm start

# Terminal 3: Start API Gateway (if not in Docker)
# Or: docker-compose up -d api-gateway

# Terminal 4: Start Frontend
cd vue-frontend
npm run dev
# Should start on http://localhost:5173
```

### **Step 2: Test in Browser**

1. **Open:** `http://localhost:5173`
2. **Log in** via OAuth (Google/LinkedIn)
3. **Check Redis** to see session:
   ```bash
   docker exec -it redcube3_xhs-redis-1 redis-cli
   KEYS redcube:sess:*
   ```

### **Step 3: Test Session Persistence**

1. **While logged in**, restart user-service:
   - Press `Ctrl+C` in Terminal 2
   - Start again: `npm start`
2. **Refresh browser** (`localhost:5173`)
3. **You should still be logged in!** ✅

---

## **What About `labzero.io`?**

### **`labzero.io` is Production:**

- Uses Railway backend services
- Uses Railway Redis
- Uses Vercel frontend (if deployed)
- **Don't test Redis session store here** - that's for production verification

### **When to Use `labzero.io`:**

- ✅ Testing production deployment
- ✅ Testing with real users
- ✅ Final verification before launch
- ❌ **NOT for local Redis testing**

---

## **Summary Table**

| URL | What It Is | When to Use |
|-----|-----------|-------------|
| `localhost:5173` | Vue frontend (dev) | ✅ **Local testing (Redis sessions)** |
| `localhost:3001` | User service (backend) | ❌ Don't use directly (no UI) |
| `localhost:8080` | API Gateway | ❌ Don't use directly (no UI) |
| `labzero.io` | Production domain | ✅ Production testing only |

---

## **Quick Test Command**

```bash
# 1. Start all services
docker-compose up -d redis
cd services/user-service && export REDIS_URL=redis://localhost:6379 && npm start &
cd vue-frontend && npm run dev &

# 2. Open browser
open http://localhost:5173

# 3. Log in and test!
```

---

## **What You Should See**

### **In Browser (`localhost:5173`):**
- ✅ Vue app loads
- ✅ Can log in via OAuth
- ✅ Session persists after restart

### **In Redis:**
```bash
docker exec -it redcube3_xhs-redis-1 redis-cli
KEYS redcube:sess:*
# Should see your session keys!
```

### **In User Service Logs:**
```
[Session] ✅ Redis connected for session storage
[Session] ✅ Redis ready for session storage
Session store: Redis (production-ready)
```

---

## **Troubleshooting**

### **Issue: "Can't connect to API"**

**Check:**
1. Is API Gateway running? (`localhost:8080`)
2. Is user-service running? (`localhost:3001`)
3. Check browser console for errors

### **Issue: "Session not persisting"**

**Check:**
1. Is Redis running? (`docker ps | grep redis`)
2. Is `REDIS_URL` set correctly? (`export REDIS_URL=redis://localhost:6379`)
3. Check user-service logs for Redis connection

### **Issue: "OAuth not working"**

**Check:**
1. Are OAuth credentials set? (`GOOGLE_CLIENT_ID`, etc.)
2. Is callback URL correct? (`http://localhost:8080/api/auth/google/callback`)

---

## **Next Steps**

1. ✅ Use `localhost:5173` for testing
2. ✅ Log in via OAuth
3. ✅ Verify session in Redis
4. ✅ Test session persistence
5. ✅ Once working locally, test on `labzero.io` (production)
