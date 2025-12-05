# Railway Repository Structure & Configuration Guide

## **Repository Structure:**

```
redcube3_xhs/
├── api-gateway/
│   ├── Dockerfile
│   └── nginx.conf
│
├── services/
│   ├── content-service/          ✅ WORKS (Node.js)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── user-service/             ✅ WORKS (Node.js)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── interview-service/        ✅ WORKS (Node.js)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── notification-service/     ✅ WORKS (Node.js)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── embedding-server/         ❌ NOT WORKING (Python)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── app.py
│   │   └── railway.json
│   │
│   ├── ner-service/               ❌ NOT WORKING (Python)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   └── railway.json
│   │
│   └── prediction-service/       (Not deployed yet)
│       ├── Dockerfile
│       ├── requirements.txt
│       └── main.py
│
└── vue-frontend/                 (Deployed on Vercel)
    └── ...
```

---

## **Railway Service Configuration:**

### **✅ api-gateway**
- **Root Directory:** `api-gateway`
- **Dockerfile:** `api-gateway/Dockerfile`
- **Status:** ✅ WORKS
- **Dockerfile Analysis:** ✅ WILL WORK
  - Uses: `COPY nginx.conf ...` (simple path, works with Root Directory)

### **✅ content-service**
- **Root Directory:** `services/content-service`
- **Dockerfile:** `services/content-service/Dockerfile`
- **Status:** ✅ WORKS
- **Dockerfile Analysis:** ✅ WILL WORK
  - Uses: `COPY package*.json ./` and `COPY . .` (simple paths, works with Root Directory)

### **✅ user-service**
- **Root Directory:** `services/user-service`
- **Dockerfile:** `services/user-service/Dockerfile`
- **Status:** ✅ WORKS
- **Dockerfile Analysis:** ✅ WILL WORK
  - Uses: `COPY package*.json ./` and `COPY . .` (simple paths, works with Root Directory)

### **✅ interview-service**
- **Root Directory:** `services/interview-service`
- **Dockerfile:** `services/interview-service/Dockerfile`
- **Status:** ✅ WORKS
- **Dockerfile Analysis:** ✅ WILL WORK
  - Uses: `COPY package*.json ./` and `COPY . .` (simple paths, works with Root Directory)

### **✅ notification-service**
- **Root Directory:** `services/notification-service`
- **Dockerfile:** `services/notification-service/Dockerfile`
- **Status:** ✅ WORKS
- **Dockerfile Analysis:** ✅ WILL WORK
  - Uses: `COPY package*.json ./` and `COPY . .` (simple paths, works with Root Directory)

### **❌ embedding-server**
- **Root Directory:** `services/embedding-server` (should be set)
- **Dockerfile:** `services/embedding-server/Dockerfile`
- **Status:** ❌ NOT WORKING - "Dockerfile does not exist"
- **Dockerfile Analysis:** ⚠️ **WILL NOT WORK with Root Directory**
  - Uses: `COPY services/embedding-server/requirements.txt .`
  - Uses: `COPY services/embedding-server/app.py .`
  - **Problem:** These paths assume repo root as build context, but Root Directory changes build context to `services/embedding-server/`
  - **Fix Needed:** Change Dockerfile to use simple paths: `COPY requirements.txt .` and `COPY app.py .`

### **❌ ner-service**
- **Root Directory:** `services/ner-service` (should be set)
- **Dockerfile:** `services/ner-service/Dockerfile`
- **Status:** ❌ NOT WORKING - "Dockerfile does not exist"
- **Dockerfile Analysis:** ⚠️ **WILL NOT WORK with Root Directory**
  - Uses: `COPY services/ner-service/requirements.txt .`
  - Uses: `COPY services/ner-service/ .`
  - **Problem:** These paths assume repo root as build context, but Root Directory changes build context to `services/ner-service/`
  - **Fix Needed:** Change Dockerfile to use simple paths: `COPY requirements.txt .` and `COPY . .`

---

## **The Problem:**

### **Node.js Services (WORKING):**
- Dockerfiles use **simple paths** (`COPY . .`)
- These work **WITH Root Directory** because build context becomes the service directory
- Example: `COPY package*.json ./` works when Root Directory = `services/content-service`

### **Python Services (NOT WORKING):**
- Dockerfiles use **complex paths** (`COPY services/embedding-server/...`)
- These **DON'T work WITH Root Directory** because:
  - Root Directory changes build context to `services/embedding-server/`
  - But Dockerfile tries to copy from `services/embedding-server/requirements.txt`
  - This becomes `services/embedding-server/services/embedding-server/requirements.txt` (wrong!)

---

## **Solution Options:**

### **Option 1: Fix Dockerfiles (Recommended)**
Change Python Dockerfiles to use simple paths (like Node.js services):

**embedding-server/Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
```

**ner-service/Dockerfile:**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -c "from transformers import pipeline; pipeline('ner', model='dslim/bert-base-NER')"
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

**Then set Root Directory:**
- embedding-server: `services/embedding-server`
- ner-service: `services/ner-service`

### **Option 2: Keep Current Dockerfiles, Don't Set Root Directory**
- Keep Dockerfiles with `COPY services/...` paths
- **Don't set Root Directory** (leave empty)
- Set `RAILWAY_DOCKERFILE_PATH=services/embedding-server/Dockerfile`
- Railway will use repo root as build context (matches Dockerfile paths)

---

## **Recommended Configuration:**

### **For Perfect Railway Detection:**

1. **Fix Python Dockerfiles** to use simple paths (Option 1)
2. **Set Root Directory** for all services:
   - `api-gateway` → Root Directory: `api-gateway`
   - `content-service` → Root Directory: `services/content-service`
   - `user-service` → Root Directory: `services/user-service`
   - `interview-service` → Root Directory: `services/interview-service`
   - `notification-service` → Root Directory: `services/notification-service`
   - `embedding-server` → Root Directory: `services/embedding-server`
   - `ner-service` → Root Directory: `services/ner-service`

3. **Don't set RAILWAY_DOCKERFILE_PATH** (Railway will auto-detect)

---

## **Summary:**

| Service | Root Directory | Dockerfile Paths | Status |
|---------|---------------|-----------------|--------|
| api-gateway | `api-gateway` | Simple | ✅ Works |
| content-service | `services/content-service` | Simple | ✅ Works |
| user-service | `services/user-service` | Simple | ✅ Works |
| interview-service | `services/interview-service` | Simple | ✅ Works |
| notification-service | `services/notification-service` | Simple | ✅ Works |
| embedding-server | `services/embedding-server` | Complex (needs fix) | ❌ Broken |
| ner-service | `services/ner-service` | Complex (needs fix) | ❌ Broken |

**Fix:** Change Python Dockerfiles to use simple paths, then they'll work like Node.js services.

