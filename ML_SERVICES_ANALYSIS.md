# 🔍 ML Services Analysis - How They Work & What's Needed

## **Current Setup (Local):**

### **1. Embedding-Server** 📊

**How it works:**
- Uses `sentence-transformers` library (Python)
- Model: `BAAI/bge-small-en-v1.5` (384 dimensions)
- **Downloads model automatically** from HuggingFace when you call `SentenceTransformer(MODEL_NAME)`
- Model is cached in `/root/.cache/huggingface` (Docker volume)
- **No API key needed** - downloads model files directly (not using API)

**Local setup:**
- Model downloads on first run (takes 5-10 minutes)
- Cached in Docker volume for faster subsequent runs

**Code:**
```python
# app.py line 29
model = SentenceTransformer(MODEL_NAME)  # Downloads from HuggingFace automatically
```

---

### **2. NER-Service** 🏷️

**How it works:**
- Uses `transformers` library (Python)
- Model: `dslim/bert-base-NER`
- **Downloads model automatically** from HuggingFace when you call `pipeline("ner", model="...")`
- **No API key needed** - downloads model files directly

**Local setup:**
- You have a local model at: `/Users/luan02/Desktop/models/dslim-bert-base-NER`
- Docker volume mounts it: `/Users/luan02/Desktop/models/dslim-bert-base-NER:/app/models/bert-base-NER:ro`
- Code tries local first, falls back to HuggingFace download if not found

**Code:**
```python
# main.py line 26-34
if os.path.exists(model_path):
    ner_pipeline = pipeline("ner", model=model_path, ...)  # Use local
else:
    ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", ...)  # Download from HuggingFace
```

---

### **3. Content-Service** 🔗

**How it connects:**
- `EMBEDDING_PROVIDER = 'local'` - uses embedding-server (not HuggingFace API)
- Has `HUGGINGFACE_API_KEY` but **only for fallback** (if local server fails)
- Calls: `http://embedding-server:5000/embed` (local) or HuggingFace API (fallback)
- Calls: `http://ner-service:8000/extract-metadata` (local)

---

## **What Happens on Railway:**

### **Embedding-Server on Railway:**

✅ **Will work automatically:**
1. Railway builds Docker image
2. Service starts
3. `SentenceTransformer('BAAI/bge-small-en-v1.5')` is called
4. **Model downloads from HuggingFace automatically** (first startup takes 5-10 minutes)
5. Model is cached in container (or you can use Railway volumes)
6. **No API key needed** - it's downloading model files, not using API

**What you need:**
- ✅ Just deploy the service
- ✅ Set `MODEL_NAME=BAAI/bge-small-en-v1.5` (already in env file)
- ❌ **No HuggingFace API key needed** (for embedding-server)

---

### **NER-Service on Railway:**

✅ **Will work automatically:**
1. Railway builds Docker image
2. Service starts
3. Code checks for local model at `/app/models/bert-base-NER`
4. **Local model won't exist** (it's on your laptop)
5. Falls back to: `pipeline("ner", model="dslim/bert-base-NER")`
6. **Model downloads from HuggingFace automatically** (first startup takes 5-10 minutes)
7. **No API key needed** - it's downloading model files, not using API

**What you need:**
- ✅ Just deploy the service
- ✅ Set `MODEL_NAME=dslim/bert-base-NER` (already in env file)
- ❌ **No HuggingFace API key needed** (for ner-service)
- ✅ **Dockerfile already downloads model during build** (line 15 in Dockerfile)

---

### **Content-Service on Railway:**

**What you need:**
- ✅ Set `EMBEDDING_SERVER_URL=http://embedding-server` (internal service discovery)
- ✅ Set `NER_SERVICE_URL=http://ner-service` (internal service discovery)
- ✅ Keep `HUGGINGFACE_API_KEY` (for fallback if services fail)
- ✅ Keep `EMBEDDING_PROVIDER=local` (uses embedding-server, not API)

---

## **Key Differences:**

### **Model Download vs API:**

| Method | How It Works | API Key Needed? | Cost |
|--------|-------------|-----------------|------|
| **Model Download** | Downloads model files from HuggingFace | ❌ NO | ✅ Free |
| **HuggingFace API** | Calls HuggingFace Inference API | ✅ YES | 💰 Pay per request |

### **Your Setup:**

- **Embedding-Server:** Uses **model download** (free, no API key)
- **NER-Service:** Uses **model download** (free, no API key)
- **Content-Service Fallback:** Uses **HuggingFace API** (needs API key, costs money)

---

## **What Other Companies Do:**

### **Option 1: Download Models in Docker (Most Common)** ✅

**What they do:**
- Download models during Docker build
- Include models in Docker image
- **Pros:** Faster startup, no download on first request
- **Cons:** Larger Docker images

**Example:**
```dockerfile
# Download model during build
RUN python -c "from transformers import pipeline; pipeline('ner', model='dslim/bert-base-NER')"
```

**Your setup:** ✅ Already doing this for NER (Dockerfile line 15)

---

### **Option 2: Download Models on First Request**

**What they do:**
- Download models when service starts
- Cache in container or volume
- **Pros:** Smaller Docker images
- **Cons:** Slower first request (5-10 minutes)

**Your setup:** ✅ Embedding-server does this (downloads on startup)

---

### **Option 3: Use HuggingFace Inference API**

**What they do:**
- Call HuggingFace API instead of running models locally
- **Pros:** No infrastructure to manage
- **Cons:** Costs money, slower, rate limits

**Your setup:** ⚠️ Only as fallback (good!)

---

## **Summary - What You Need:**

### **For Embedding-Server:**
- ✅ Deploy to Railway
- ✅ Set `MODEL_NAME=BAAI/bge-small-en-v1.5`
- ❌ **No HuggingFace API key needed** (downloads model files, not using API)
- ⏳ First startup: Model downloads automatically (5-10 minutes)

### **For NER-Service:**
- ✅ Deploy to Railway
- ✅ Set `MODEL_NAME=dslim/bert-base-NER`
- ❌ **No HuggingFace API key needed** (downloads model files, not using API)
- ✅ Model downloads during build (already in Dockerfile)
- ⏳ First startup: Model already downloaded (faster!)

### **For Content-Service:**
- ✅ Set `EMBEDDING_SERVER_URL=http://embedding-server`
- ✅ Set `NER_SERVICE_URL=http://ner-service`
- ✅ Keep `HUGGINGFACE_API_KEY` (for fallback only)
- ✅ Keep `EMBEDDING_PROVIDER=local`

---

## **About Your Local NER Model:**

**Current situation:**
- You have model at: `/Users/luan02/Desktop/models/dslim-bert-base-NER`
- Docker volume mounts it locally
- **This won't be available on Railway** (it's on your laptop)

**What happens on Railway:**
- Code checks for local model → Not found
- Falls back to HuggingFace download → ✅ Works!
- Model downloads automatically → ✅ No problem!

**You don't need to:**
- ❌ Upload model to Railway
- ❌ Set up volumes
- ❌ Do anything special

**It just works!** The code already handles this fallback.

---

## **Quick Answer:**

**Q: Do I need HuggingFace API key for embedding-server/ner-service?**
**A: NO!** They download models directly (free), not using API.

**Q: What about my local NER model?**
**A: Not needed!** Code falls back to HuggingFace download automatically.

**Q: Will services work on Railway?**
**A: YES!** Models download automatically on first startup.

**Q: Do I need to do anything special?**
**A: NO!** Just deploy - models download automatically.

---

## **What Happens on First Deployment:**

### **Embedding-Server:**
1. Service starts
2. `SentenceTransformer('BAAI/bge-small-en-v1.5')` called
3. Model downloads from HuggingFace (5-10 minutes)
4. Model cached in container
5. Service ready! ✅

### **NER-Service:**
1. Docker build runs
2. `pipeline('ner', model='dslim/bert-base-NER')` called during build
3. Model downloads during build (10-15 minutes)
4. Model included in Docker image
5. Service starts quickly! ✅

**Both work automatically - no manual steps needed!** 🎉
