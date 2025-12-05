# 🔧 Railway nginx.conf Fix Required

## **Error Found:**

```
host not found in upstream "interview-service:3002"
```

**This means:**
- Railway services **cannot** resolve each other by service name
- Your nginx.conf uses `server interview-service:3002;` which doesn't work in Railway
- You need to use Railway public domains instead

---

## **Solution: Update nginx.conf**

You need to:

1. **Generate public domains for all backend services:**
   - user-service → Generate domain → Copy URL
   - content-service → Generate domain → Copy URL
   - interview-service → Generate domain → Copy URL
   - notification-service → Generate domain → Copy URL

2. **Update nginx.conf** to use these public domains

3. **Use HTTPS (port 443)** for Railway public domains

---

## **What You Need to Do:**

### **Step 1: Get Public Domains**

For each service, generate and copy the public domain:
- user-service → Settings → Networking → Generate domain → Copy
- content-service → Settings → Networking → Generate domain → Copy
- interview-service → Settings → Networking → Generate domain → Copy
- notification-service → Settings → Networking → Generate domain → Copy

**Format:** `service-name-production-xxxx.up.railway.app`

### **Step 2: Update nginx.conf**

Replace service names with public domains and use port 443 (HTTPS).

### **Step 3: Commit and Push**

Railway will auto-redeploy API Gateway with the new config.

---

## **Important Notes:**

- Railway public domains use **HTTPS (port 443)**, not HTTP
- Remove the port number from service names (Railway handles ports)
- Use the full domain: `service-name-production-xxxx.up.railway.app:443`
