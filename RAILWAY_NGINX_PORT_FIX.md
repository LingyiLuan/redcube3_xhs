# 🔧 Railway nginx Port Fix

## **Problem:**

Railway logs show: `"connection refused"` when trying to connect to API Gateway.

**This means:**
- Railway is trying to connect to the API Gateway
- But nginx is not listening on the port Railway expects
- Railway sets a `PORT` environment variable
- nginx is hardcoded to listen on port 80
- Railway might be routing to a different port

---

## **Solution:**

Railway automatically sets a `PORT` environment variable. We need to make nginx listen on that port instead of hardcoded port 80.

**Two options:**

### **Option 1: Use envsubst in Dockerfile (Recommended)**

Update Dockerfile to substitute PORT env var into nginx.conf.

### **Option 2: Use nginx template with envsubst**

Create nginx.conf.template and use envsubst to replace PORT.

---

## **What We Need to Do:**

1. Update Dockerfile to use envsubst
2. Update nginx.conf to use $PORT variable
3. Or create nginx.conf.template

Let me implement this fix.
