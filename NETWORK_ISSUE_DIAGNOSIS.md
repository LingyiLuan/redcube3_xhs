# 🔍 Network Issue Diagnosis: 502 Bad Gateway

## 📊 **Investigation Results**

### **✅ What's Working:**
1. **Network Connectivity:** ✅ API Gateway CAN ping content-service
   - Content-service IP: `172.18.0.4`
   - Ping successful: 0% packet loss

2. **DNS Resolution:** ✅ content-service resolves correctly
   - DNS lookup: `content-service` → `172.18.0.4`
   - Resolution working

3. **Content-Service Health:** ✅ Service is running and responding
   - Port 3003: ✅ Listening
   - Health endpoint: ✅ Responding
   - Direct connection test: ✅ Success

4. **Nginx Configuration:** ✅ Config looks correct
   - Upstream defined: `server content-service:3003;`
   - Proxy pass configured: `proxy_pass http://content-service;`

### **❌ The Problem:**

**Error in API Gateway logs:**
```
connect() failed (113: Host is unreachable) while connecting to upstream
upstream: "http://172.18.0.11:3003/api/content/history?limit=10"
```

**Key Finding:**
- Nginx is trying to connect to **172.18.0.11** (wrong IP)
- Content-service is actually at **172.18.0.4** (correct IP)
- This suggests **DNS resolution caching issue** in nginx

---

## 🎯 **Root Cause Analysis**

### **Possible Causes:**

1. **Nginx DNS Caching:**
   - Nginx resolves DNS names at startup
   - If content-service was restarted/recreated, IP changed
   - Nginx still has old IP (172.18.0.11) cached
   - New IP is 172.18.0.4

2. **Container Recreation:**
   - Content-service container was recreated
   - Got new IP address (172.18.0.4)
   - API Gateway container still has old DNS cache (172.18.0.11)

3. **Nginx Upstream Caching:**
   - Nginx caches upstream server IPs
   - Needs reload to pick up new IPs

---

## ✅ **Solution**

### **Fix 1: Reload Nginx Configuration**
```bash
docker compose exec api-gateway nginx -s reload
```

This will:
- Reload nginx configuration
- Re-resolve DNS names
- Update upstream server IPs

### **Fix 2: Restart API Gateway**
```bash
docker compose restart api-gateway
```

This will:
- Restart nginx completely
- Clear all DNS caches
- Re-resolve all service names

### **Fix 3: Use IP Address (Not Recommended)**
If DNS keeps failing, could hardcode IP in nginx.conf:
```nginx
upstream content-service {
    server 172.18.0.4:3003;  # Hardcoded IP
}
```
**But this is NOT recommended** - IPs change when containers restart.

---

## 🔍 **Why This Happens:**

**Docker Compose Network Behavior:**
1. When containers start, Docker assigns IPs from network pool
2. If a container is recreated, it gets a NEW IP
3. Nginx resolves DNS at startup and caches the IP
4. If content-service was restarted, its IP changed
5. Nginx still tries to use old cached IP → 502 error

**The Fix:**
- Reload nginx to re-resolve DNS
- Or restart api-gateway to clear all caches

---

## 📝 **Verification Steps:**

After applying fix:
1. Test health endpoint: `curl http://localhost:8080/api/content/health`
2. Test history endpoint: `curl http://localhost:8080/api/content/history?limit=10`
3. Check logs: `docker compose logs api-gateway | grep content-service`
4. Verify no more 502 errors

---

## 🎯 **Recommended Action:**

**Quick Fix:**
```bash
docker compose exec api-gateway nginx -s reload
```

**If that doesn't work:**
```bash
docker compose restart api-gateway
```

**Then re-run tests:**
```bash
./test_security_endpoints.sh
```

---

**Status:** ✅ Root cause identified - DNS caching issue in nginx
**Fix:** Reload or restart API Gateway to clear DNS cache
