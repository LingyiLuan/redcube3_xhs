# 🔗 Railway Internal Service Discovery - Embedding & NER Services

## **You're Right! Use Internal Service Discovery**

Just like the other services (`user-service`, `content-service`, etc.), we should use **Railway's internal service discovery** for `embedding-server` and `ner-service`.

---

## **How It Works:**

### **Internal Service Discovery:**
- Services in the same Railway project can communicate using **service names**
- Format: `http://service-name:${PORT}`
- Railway automatically resolves service names to internal IPs
- **No public domains needed!**

### **Example (What You Already Have):**
```javascript
// userServiceClient.js
this.baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
```

### **Same Pattern for Embedding & NER:**
```javascript
// embeddingService.js
const LOCAL_EMBEDDING_URL = process.env.EMBEDDING_SERVER_URL || `http://embedding-server:${EMBEDDING_SERVER_PORT}`;

// hybridExtractionService.js
const NER_SERVICE_URL = process.env.NER_SERVICE_URL || `http://ner-service:${NER_SERVICE_PORT}`;
```

---

## **What You Need to Do:**

### **Step 1: Deploy Services to Railway**

1. Deploy `embedding-server` (no public domain needed!)
2. Deploy `ner-service` (no public domain needed!)

### **Step 2: Set Environment Variables in Content-Service**

Go to Railway dashboard → **content-service** → **Variables** tab:

**Option A: Use Internal Service Discovery (Recommended)**
```
EMBEDDING_SERVICE_PORT=5000
NER_SERVICE_PORT=8000
```

**OR Option B: Use Explicit Internal URLs**
```
EMBEDDING_SERVER_URL=http://embedding-server:5000
NER_SERVICE_URL=http://ner-service:8000
```

**Note:** Railway automatically sets `PORT` for each service, but you can override with explicit ports.

### **Step 3: That's It!**

Services will communicate internally using service names:
- `content-service` → `http://embedding-server:5000`
- `content-service` → `http://ner-service:8000`

---

## **Why This is Better:**

### **✅ Advantages:**
- ✅ **No public domains needed** - Services communicate internally
- ✅ **Faster** - Internal network is faster than public internet
- ✅ **More secure** - Services not exposed to public
- ✅ **Consistent** - Same pattern as other services
- ✅ **Free** - No need to generate public domains

### **❌ Public URLs (What We Almost Did):**
- ❌ Requires generating public domains
- ❌ Slower (goes through public internet)
- ❌ Less secure (exposed to public)
- ❌ More complex setup

---

## **Updated Configuration:**

### **Content-Service Environment Variables:**

**Add to `content-service` in Railway:**

```
EMBEDDING_SERVICE_PORT=5000
NER_SERVICE_PORT=8000
```

**OR (if Railway's PORT doesn't match):**

```
EMBEDDING_SERVER_URL=http://embedding-server:${EMBEDDING_SERVICE_PORT}
NER_SERVICE_URL=http://ner-service:${NER_SERVICE_PORT}
```

**But actually, Railway sets PORT automatically, so you might not need these!**

---

## **How Railway PORT Works:**

### **Railway's Automatic PORT:**
- Railway automatically sets `PORT` environment variable for each service
- Usually `8080` for most services
- Services should use `process.env.PORT` (which we already do!)

### **For Embedding-Server:**
- `app.py` uses: `PORT = int(os.getenv('PORT', 5000))`
- Railway sets `PORT=8080` (or similar)
- Service listens on Railway's PORT ✅

### **For NER-Service:**
- `Dockerfile` uses: `--port ${PORT:-8000}`
- Railway sets `PORT=8080` (or similar)
- Service listens on Railway's PORT ✅

### **For Content-Service:**
- Needs to know which PORT embedding-server and ner-service are using
- **Solution:** Use Railway's internal DNS - it resolves service names automatically!

---

## **Actually, Even Simpler:**

Since Railway resolves service names automatically, you might not need PORT variables at all!

**Just use:**
```
EMBEDDING_SERVER_URL=http://embedding-server
NER_SERVICE_URL=http://ner-service
```

Railway's internal DNS will resolve these to the correct internal IP and port!

---

## **Updated Environment Variables:**

### **For Content-Service (Railway):**

**Simplest approach - let Railway handle it:**
```
EMBEDDING_SERVER_URL=http://embedding-server
NER_SERVICE_URL=http://ner-service
```

**OR if you want to be explicit:**
```
EMBEDDING_SERVER_URL=http://embedding-server:${EMBEDDING_SERVICE_PORT}
NER_SERVICE_URL=http://ner-service:${NER_SERVICE_PORT}
```

**But check Railway's documentation - internal service discovery might work without ports!**

---

## **Summary:**

**Q: Should I use public URLs or internal service discovery?**
**A: Use internal service discovery!** (Like you do for other services)

**Q: Do I need to generate public domains?**
**A: NO!** Services communicate internally.

**Q: What environment variables do I need?**
**A: Just set service URLs to internal names:**
```
EMBEDDING_SERVER_URL=http://embedding-server
NER_SERVICE_URL=http://ner-service
```

**Much simpler!** 🎉

