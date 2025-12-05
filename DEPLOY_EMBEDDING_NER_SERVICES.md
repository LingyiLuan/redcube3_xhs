# 🚀 Deploy Embedding-Server and NER-Service to Railway

## **Overview**

This guide will help you deploy the two critical ML services to Railway:
- **embedding-server**: Generates embeddings for RAG functionality
- **ner-service**: Extracts metadata (company, role, location, etc.) from posts

---

## **Step 1: Deploy Embedding-Server**

### **1.1 Create Service in Railway**

1. Go to Railway dashboard → Your project
2. Click **"+ New"** → **"GitHub Repo"**
3. Select your repository: `redcube3_xhs`
4. Railway will detect it's a Docker project

### **1.2 Configure Service**

1. **Set Root Directory:**
   - Click on the service → **Settings** tab
   - Set **Root Directory:** `/services/embedding-server`

2. **Set Environment Variables:**
   - Go to **Variables** tab
   - Add these variables:
     ```
     MODEL_NAME=BAAI/bge-small-en-v1.5
     PORT=5000
     ```
   - Railway will automatically set `PORT` (use Railway's PORT, not 5000)
   - But keep `MODEL_NAME` as shown

3. **Note the Service URL:**
   - After deployment, Railway will generate a URL like:
     `embedding-server-production-xxxx.up.railway.app`
   - **Copy this URL** - you'll need it for content-service

### **1.3 Deploy**

1. Railway will automatically build and deploy
2. Wait for deployment to complete (5-10 minutes)
3. Check **Logs** tab to see:
   ```
   Loading embedding model: BAAI/bge-small-en-v1.5
   Model loaded successfully! Embedding dimension: 384
   Starting embedding server on port 5000
   ```

---

## **Step 2: Deploy NER-Service**

### **2.1 Create Service in Railway**

1. Go to Railway dashboard → Your project
2. Click **"+ New"** → **"GitHub Repo"**
3. Select your repository: `redcube3_xhs`

### **2.2 Configure Service**

1. **Set Root Directory:**
   - Click on the service → **Settings** tab
   - Set **Root Directory:** `/services/ner-service`

2. **Set Environment Variables:**
   - Go to **Variables** tab
   - Add this variable:
     ```
     MODEL_NAME=dslim/bert-base-NER
     ```
   - **Note:** NER service loads model from `/app/models/bert-base-NER`
   - For Railway, you may need to download the model during build
   - Or use HuggingFace model directly (see Troubleshooting)

3. **Note the Service URL:**
   - After deployment, Railway will generate a URL like:
     `ner-service-production-xxxx.up.railway.app`
   - **Copy this URL** - you'll need it for content-service

### **2.3 Deploy**

1. Railway will automatically build and deploy
2. Wait for deployment to complete (10-15 minutes - model download takes time)
3. Check **Logs** tab to see:
   ```
   Loading NER model from /app/models/bert-base-NER...
   ✅ NER model loaded successfully
   ```

---

## **Step 3: Update Content-Service Configuration**

### **3.1 Get Service URLs**

After both services are deployed, you'll have:
- **Embedding Server URL:** `embedding-server-production-xxxx.up.railway.app`
- **NER Service URL:** `ner-service-production-xxxx.up.railway.app`

### **3.2 Update Content-Service Environment Variables**

1. Go to Railway dashboard → **content-service** → **Variables** tab
2. Add these variables (using Railway's internal service discovery):

   ```
   EMBEDDING_SERVER_URL=http://embedding-server
   NER_SERVICE_URL=http://ner-service
   ```

   **Why internal service discovery?**
   - ✅ Services in same Railway project can communicate by name
   - ✅ No public domains needed
   - ✅ Faster (internal network)
   - ✅ More secure (not exposed to public)
   - ✅ Same pattern as other services (user-service, etc.)

3. Railway will automatically resolve service names to internal IPs and ports

### **3.3 Redeploy Content-Service**

1. After updating environment variables, Railway will auto-redeploy
2. Or manually trigger redeploy from **Deployments** tab

---

## **Step 4: Update Content-Service Code**

The content-service needs to use the Railway URLs instead of Docker service names.

### **4.1 Update Embedding Service**

File: `services/content-service/src/services/embeddingService.js`

**Find:**
```javascript
const LOCAL_EMBEDDING_URL = 'http://embedding-server:5000'; // Docker internal network
```

**Replace with:**
```javascript
const LOCAL_EMBEDDING_URL = process.env.EMBEDDING_SERVER_URL || 'http://embedding-server:5000';
```

### **4.2 Update Hybrid Extraction Service**

File: `services/content-service/src/services/hybridExtractionService.js`

**Find:**
```javascript
const NER_SERVICE_URL = process.env.NER_SERVICE_URL || 'http://ner-service:8000';
```

**This is already correct!** Just make sure `NER_SERVICE_URL` is set in Railway.

### **4.3 Update Agent Service**

File: `services/content-service/src/services/agentService.js`

**Find:**
```javascript
const nerResponse = await axios.post('http://ner-service:8000/extract-metadata', {
```

**Replace with:**
```javascript
const nerServiceUrl = process.env.NER_SERVICE_URL || 'http://ner-service:8000';
const nerResponse = await axios.post(`${nerServiceUrl}/extract-metadata`, {
```

---

## **Step 5: Test the Services**

### **5.1 Test Embedding Server**

```bash
# Test health endpoint
curl https://embedding-server-production-xxxx.up.railway.app/health

# Should return:
# {"status":"healthy","model":"BAAI/bge-small-en-v1.5","dimension":384}
```

### **5.2 Test NER Service**

```bash
# Test extract endpoint
curl -X POST https://ner-service-production-xxxx.up.railway.app/extract-metadata \
  -H "Content-Type: application/json" \
  -d '{"text": "I interviewed at Google for SWE L4 in Mountain View and got an offer!"}'

# Should return extracted metadata
```

### **5.3 Test from Content-Service**

1. Check content-service logs for embedding/NER calls
2. Try creating a batch analysis
3. Verify embeddings are generated
4. Verify metadata is extracted

---

## **Troubleshooting**

### **Issue: Embedding Server Fails to Load Model**

**Solution:**
- Check Railway logs for model download errors
- Model download happens on first request (can take 5-10 minutes)
- Make sure `MODEL_NAME` is set correctly

### **Issue: NER Service Can't Find Model**

**Problem:** NER service expects model at `/app/models/bert-base-NER` (local path)

**Solution 1: Download Model During Build**
- Update `ner-service/Dockerfile` to download model:
  ```dockerfile
  RUN python -c "from transformers import pipeline; pipeline('ner', model='dslim/bert-base-NER')"
  ```

**Solution 2: Use HuggingFace Model Directly**
- Update `ner-service/main.py`:
  ```python
  ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
  ```
  (Remove local path, use HuggingFace directly)

### **Issue: Content-Service Can't Connect**

**Check:**
1. Are service URLs correct in environment variables?
2. Are services deployed and running?
3. Check Railway logs for connection errors
4. Try using Railway's internal service discovery instead of public URLs

### **Issue: Services Timeout**

**Solution:**
- ML models take time to load (especially on first request)
- Increase timeout in content-service:
  ```javascript
  const response = await axios.post(url, data, { timeout: 60000 }); // 60 seconds
  ```

---

## **Cost Estimate**

- **embedding-server:** ~$10-20/month (CPU/GPU for ML model)
- **ner-service:** ~$5-10/month (CPU for ML model)
- **Total additional:** ~$15-30/month

---

## **Next Steps**

1. ✅ Deploy embedding-server
2. ✅ Deploy ner-service
3. ✅ Update content-service environment variables
4. ✅ Update content-service code
5. ✅ Test services
6. ✅ Monitor costs and performance

---

## **Summary**

**What you're deploying:**
- `embedding-server` → Generates embeddings for RAG
- `ner-service` → Extracts metadata from posts

**What you're updating:**
- `content-service` environment variables
- `content-service` code to use Railway URLs

**Result:**
- ✅ RAG functionality works
- ✅ Fast/cheap metadata extraction
- ✅ Saves API costs

**Ready to deploy!** 🚀

