# 🔍 Debug: Why Sessions Not in Redis?

## **Check These:**

### **1. Check Browser Cookie**

1. Open browser DevTools (F12)
2. Go to **Application** tab → **Cookies** → `http://localhost:5174`
3. Look for cookie named: `redcube.sid`
4. **If cookie exists:**
   - Session was created
   - But might not be saved to Redis
5. **If no cookie:**
   - OAuth didn't complete
   - Session wasn't created

### **2. Check User-Service Logs**

In the terminal where `user-service` is running, look for:
- Any errors when you logged in?
- Any Redis connection errors?
- Does it say "MemoryStore" anywhere?

### **3. Test Redis Connection**

```bash
# Test if Redis is accessible
docker exec redcube3_xhs-redis-1 redis-cli PING
# Should return: PONG
```

### **4. Check if Session Store is Actually Used**

The issue might be:
- `sessionStore` is `null` when session is created
- Redis connection happens async, but session is created before it's ready
- Session falls back to MemoryStore

### **5. Manual Test: Create a Session Key**

```bash
# Try creating a test key in Redis
docker exec redcube3_xhs-redis-1 redis-cli SET "redcube:sess:test" "test-value"
docker exec redcube3_xhs-redis-1 redis-cli GET "redcube:sess:test"
# Should return: test-value
```

---

## **Most Likely Issue:**

**Session is created in MemoryStore, not Redis**

**Why:**
- Redis connection is async (`redisClient.connect()`)
- Session middleware is set up before Redis is ready
- `sessionStore` might be `null` when session config is created

**Solution:**
- Wait for Redis to be ready before setting up session middleware
- Or ensure `sessionStore` is not null when creating sessions

---

## **What to Share:**

1. **Do you see `redcube.sid` cookie in browser?** (DevTools → Application → Cookies)
2. **What do user-service logs show?** (Any errors or MemoryStore warnings?)
3. **Can you access Redis?** (`docker exec redcube3_xhs-redis-1 redis-cli PING`)

**Share these and we'll fix it!**
