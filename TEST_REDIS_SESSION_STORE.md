# 🧪 Testing Redis Session Store - Local Testing Guide

## **The Issue You Just Hit**

**Error:** `getaddrinfo ENOTFOUND redis`

**Why:** You're running the service directly (`npm start`), but `REDIS_URL=redis://redis:6379` uses the Docker service name `redis`, which only works **inside** the Docker network.

**Solution:** Use `localhost` when running outside Docker.

---

## **Quick Fix**

### **Option 1: Run Service Outside Docker (Current Setup)**

```bash
cd services/user-service

# Use localhost instead of redis
export REDIS_URL=redis://localhost:6379

npm start
```

### **Option 2: Run Service Inside Docker (Recommended for Testing)**

```bash
# Start all services including user-service
docker-compose up -d

# Check logs
docker-compose logs -f user-service
```

When running in Docker, `redis://redis:6379` works because both services are in the same Docker network.

---

## **Complete Testing Steps**

### **Step 1: Start Redis**

```bash
docker-compose up -d redis
```

### **Step 2: Choose Your Testing Method**

#### **Method A: Run Service Outside Docker**

```bash
cd services/user-service
export REDIS_URL=redis://localhost:6379  # ← Use localhost
npm install
npm start
```

**Look for:**
```
[Session] ✅ Redis connected for session storage
[Session] ✅ Redis ready for session storage
[Session] ✅ Using Redis session store (production-ready)
```

#### **Method B: Run Service Inside Docker**

```bash
# Start all services
docker-compose up -d

# Check user-service logs
docker-compose logs -f user-service
```

**Look for:**
```
[Session] ✅ Redis connected for session storage
```

### **Step 3: Test Session Creation**

1. **Log in via OAuth:**
   - Go to: `http://localhost:3001/auth/google`
   - Complete OAuth flow

2. **Verify session in Redis:**
   ```bash
   # Connect to Redis
   docker exec -it redcube3_xhs-redis-1 redis-cli
   
   # List session keys
   KEYS redcube:sess:*
   
   # View a session (replace with actual key)
   GET redcube:sess:YOUR_SESSION_ID
   ```

### **Step 4: Test Session Persistence**

1. **Log in** via OAuth
2. **Restart user-service:**
   ```bash
   # If running outside Docker: Ctrl+C, then npm start again
   # If running in Docker: docker-compose restart user-service
   ```
3. **Verify you're still logged in**
4. **Check Redis - session should still exist:**
   ```bash
   docker exec -it redcube3_xhs-redis-1 redis-cli
   KEYS redcube:sess:*
   ```

---

## **Understanding Docker Networking**

### **Inside Docker Network:**
- Services can use service names: `redis://redis:6379`
- Works because Docker creates a DNS for service names

### **Outside Docker (Direct `npm start`):**
- Must use `localhost`: `redis://localhost:6379`
- Because `redis` hostname doesn't exist on your machine

### **Redis Port Mapping:**
From `docker-compose.yml`:
```yaml
redis:
  ports:
    - "6379:6379"  # Maps container port 6379 to host port 6379
```

This means Redis is accessible at `localhost:6379` from your machine.

---

## **Quick Test Right Now**

```bash
# Stop current service (Ctrl+C)

# Set correct REDIS_URL for local testing
export REDIS_URL=redis://localhost:6379

# Start service
cd services/user-service
npm start
```

**You should see:**
```
[Session] ✅ Redis connected for session storage
[Session] ✅ Redis ready for session storage
[Session] ✅ Using Redis session store (production-ready)
```

**No more errors!** ✅

---

## **Summary**

**The Problem:**
- Running service outside Docker
- Using `redis://redis:6379` (Docker service name)
- Hostname `redis` doesn't exist outside Docker

**The Solution:**
- Use `redis://localhost:6379` when running outside Docker
- Or run service inside Docker where `redis` hostname works

**Next Steps:**
1. Stop current service (Ctrl+C)
2. Set: `export REDIS_URL=redis://localhost:6379`
3. Start: `npm start`
4. Verify: Look for "✅ Redis connected" in logs
