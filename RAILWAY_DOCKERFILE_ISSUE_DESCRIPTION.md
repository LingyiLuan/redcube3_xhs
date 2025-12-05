# Railway Monorepo Dockerfile Detection Issue

## **Problem Summary:**

We're trying to deploy two Python services (`embedding-server` and `ner-service`) from a monorepo on Railway, but Railway cannot find the Dockerfiles, even though they exist in the repository.

---

## **Error Message:**

```
Dockerfile `Dockerfile` does not exist
```

This error appears for both services during the build process.

---

## **Repository Structure:**

```
redcube3_xhs/
├── services/
│   ├── embedding-server/
│   │   ├── Dockerfile          ✅ EXISTS
│   │   ├── requirements.txt    ✅ EXISTS
│   │   ├── app.py              ✅ EXISTS
│   │   └── railway.json        ✅ EXISTS
│   │
│   ├── ner-service/
│   │   ├── Dockerfile          ✅ EXISTS
│   │   ├── requirements.txt    ✅ EXISTS
│   │   ├── main.py             ✅ EXISTS
│   │   └── railway.json        ✅ EXISTS
│   │
│   ├── content-service/        ✅ WORKS (Node.js)
│   │   └── Dockerfile
│   │
│   └── user-service/           ✅ WORKS (Node.js)
│       └── Dockerfile
```

**Key Point:** Node.js services work fine, but Python services don't.

---

## **Dockerfile Configuration:**

### **embedding-server/Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
# Railway uses repo root as build context, so use full path from repo root
COPY services/embedding-server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY services/embedding-server/app.py .

EXPOSE 5000

CMD ["python", "app.py"]
```

### **ner-service/Dockerfile:**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
# Railway uses repo root as build context, so use full path from repo root
COPY services/ner-service/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download NER model during build
RUN python -c "from transformers import pipeline; pipeline('ner', model='dslim/bert-base-NER')"

# Copy application code
COPY services/ner-service/ .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

**Note:** Dockerfile paths are relative to repository root (as Railway uses repo root as build context).

---

## **What We've Tried:**

### **Attempt 1: Root Directory Only**
- Set Root Directory to: `services/embedding-server` and `services/ner-service`
- **Result:** ❌ "Dockerfile does not exist"

### **Attempt 2: RAILWAY_DOCKERFILE_PATH Only**
- Cleared Root Directory
- Set `RAILWAY_DOCKERFILE_PATH=services/embedding-server/Dockerfile`
- Set `RAILWAY_DOCKERFILE_PATH=services/ner-service/Dockerfile`
- **Result:** ❌ "Dockerfile does not exist"

### **Attempt 3: Both Root Directory + RAILWAY_DOCKERFILE_PATH**
- Set Root Directory AND `RAILWAY_DOCKERFILE_PATH`
- **Result:** ❌ "Dockerfile does not exist"

### **Attempt 4: Different Root Directory Formats**
- Tried: `/services/embedding-server` (with leading slash)
- Tried: `services/embedding-server/` (with trailing slash)
- Tried: `services/embedding-server` (no slashes)
- **Result:** ❌ All failed

### **Attempt 5: Multiple Code Pushes**
- Pushed code multiple times to ensure Railway has latest
- Verified files exist on GitHub
- **Result:** ❌ Still can't find Dockerfile

---

## **Why Node.js Services Work:**

The Node.js services (`content-service`, `user-service`) work perfectly:
- They were created **first** with Root Directory set from the start
- Railway cached the correct configuration
- Their Dockerfiles use simple paths: `COPY . .` (works with Root Directory)

**Hypothesis:** Railway cached the wrong configuration when Python services were first created (without Root Directory), and changing settings later doesn't update the cache.

---

## **Current Situation:**

1. ✅ Files exist on GitHub
2. ✅ Dockerfiles are correctly formatted
3. ✅ Dockerfile paths are correct (relative to repo root)
4. ✅ Code has been pushed multiple times
5. ❌ Railway still can't find Dockerfiles

**Next Step:** We're planning to delete and recreate the services with Root Directory set from the start (before any build), which is what worked for the Node.js services.

---

## **Technical Details:**

- **Platform:** Railway.app
- **Repository:** GitHub monorepo
- **Services:** Python Flask (embedding-server) and FastAPI (ner-service)
- **Build Context:** Railway uses repository root as build context
- **Dockerfile Location:** `services/embedding-server/Dockerfile` and `services/ner-service/Dockerfile`
- **Railway Version:** Latest (as of Dec 2025)

---

## **Questions for Community:**

1. Has anyone successfully deployed Python services from a monorepo on Railway?
2. Is there a known issue with Railway's Dockerfile detection for Python services vs Node.js?
3. Does Railway cache build configuration differently for Python services?
4. Is there a workaround besides deleting and recreating services?
5. Are there any Railway-specific configuration files we should use?

---

## **Additional Context:**

- We've verified files exist: `ls -la services/embedding-server/` shows Dockerfile exists
- We've verified paths are correct: Dockerfile uses `COPY services/embedding-server/requirements.txt .`
- We've tried all combinations of Root Directory and RAILWAY_DOCKERFILE_PATH
- The exact same setup works for Node.js services in the same monorepo

**Any help or insights would be greatly appreciated!**

