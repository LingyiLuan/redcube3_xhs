# ✅ Next Steps: labzero.io Domain Setup

Your domain and Cloudflare Tunnel are configured! Here's what to do next.

---

## ✅ What's Already Done

- ✅ Domain purchased: `labzero.io`
- ✅ Cloudflare Tunnel created: `labzero`
- ✅ DNS routing configured:
  - `labzero.io` → Frontend (port 3001)
  - `api.labzero.io` → API Gateway (port 8080)
- ✅ Environment variables updated in `.env`
- ✅ Configuration file created: `cloudflare-tunnel-config.yml`

---

## 🚀 Next Steps (In Order)

### Step 1: Start Your Docker Services (5 min)

Make sure your services are running:

```bash
cd /Users/luan02/Desktop/redcube3_xhs

# Start all services
docker-compose up -d

# Check if services are running
docker-compose ps

# Check logs if needed
docker-compose logs -f
```

**Verify services are up:**
- Frontend should be on `http://localhost:3001`
- API Gateway should be on `http://localhost:8080`

Test locally:
```bash
# Test frontend
curl http://localhost:3001

# Test API
curl http://localhost:8080/health
```

---

### Step 2: Start Cloudflare Tunnel (2 min)

**Option A: Run in foreground (for testing):**
```bash
cd /Users/luan02/Desktop/redcube3_xhs
./scripts/start-cloudflare-tunnel.sh
```

**Option B: Run in background (for production):**
```bash
cd /Users/luan02/Desktop/redcube3_xhs
nohup cloudflared tunnel --config cloudflare-tunnel-config.yml run labzero > tunnel.log 2>&1 &
```

**Option C: Run as system service (best for production):**
```bash
# Install as service (macOS)
sudo cloudflared service install

# Start service
sudo launchctl start com.cloudflare.cloudflared
```

**Verify tunnel is running:**
```bash
# Check tunnel status
cloudflared tunnel info labzero

# Check if it's connected
cloudflared tunnel list
```

---

### Step 3: Update OAuth Providers (10 min)

#### Google OAuth:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Click **Edit**
4. Update **Authorized redirect URIs**:
   ```
   https://api.labzero.io/api/auth/google/callback
   ```
5. Update **Authorized JavaScript origins**:
   ```
   https://labzero.io
   https://api.labzero.io
   ```
6. Click **Save**

#### LinkedIn OAuth:

1. Go to: https://www.linkedin.com/developers/apps
2. Select your app
3. Go to **Auth** tab
4. Update **Authorized redirect URLs**:
   ```
   https://api.labzero.io/api/auth/linkedin/callback
   ```
5. Click **Update**

---

### Step 4: Update Backend CORS Settings (5 min)

Check if CORS is configured correctly in your backend services.

**File: `services/user-service/src/app.js`**

Make sure CORS allows your domain:

```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://labzero.io',
    'https://www.labzero.io'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}
```

**File: `services/content-service/src/app.js`**

Same CORS configuration should be there.

---

### Step 5: Restart Services with New Config (2 min)

```bash
# Stop services
docker-compose down

# Start with updated environment
docker-compose up -d

# Verify they're running
docker-compose ps
```

---

### Step 6: Test Everything (10 min)

#### Test 1: Domain Resolution
```bash
# Check DNS
nslookup labzero.io
nslookup api.labzero.io

# Should show Cloudflare IPs
```

#### Test 2: HTTPS Access
```bash
# Test frontend
curl -I https://labzero.io

# Test API
curl https://api.labzero.io/health

# Should return 200 OK
```

#### Test 3: Browser Test
1. Open browser: `https://labzero.io`
2. Should see your landing page
3. Check browser console for errors
4. Try clicking around

#### Test 4: OAuth Test
1. Click "Sign In" on `https://labzero.io`
2. Click "Continue with Google"
3. Should redirect to Google
4. After login, should redirect back to `https://labzero.io/workflow`

#### Test 5: API Test
```bash
# Test API endpoint
curl -v https://api.labzero.io/health

# Should return: OK
```

---

## 🐛 Troubleshooting

### Domain Not Loading?

1. **Check tunnel is running:**
   ```bash
   cloudflared tunnel list
   # Should show "labzero" with connections
   ```

2. **Check services are running:**
   ```bash
   docker-compose ps
   # All services should be "Up"
   ```

3. **Check DNS propagation:**
   ```bash
   nslookup labzero.io
   # Should show Cloudflare IPs
   ```

4. **Wait 5-10 minutes** for DNS to propagate

### SSL Not Working?

- Cloudflare automatically provides SSL
- Wait 5-10 minutes after DNS setup
- Check Cloudflare dashboard → SSL/TLS → should show "Full" mode

### OAuth Not Working?

1. **Verify callback URLs** in OAuth providers match exactly:
   - `https://api.labzero.io/api/auth/google/callback`
   - No trailing slashes!

2. **Check environment variables:**
   ```bash
   cat .env | grep CALLBACK
   ```

3. **Check browser console** for CORS errors

### CORS Errors?

1. **Verify ALLOWED_ORIGINS** in `.env`:
   ```bash
   cat .env | grep ALLOWED_ORIGINS
   ```

2. **Restart services** after updating:
   ```bash
   docker-compose restart user-service content-service
   ```

---

## ✅ Success Checklist

- [ ] Docker services running (`docker-compose ps`)
- [ ] Cloudflare tunnel running (`cloudflared tunnel list`)
- [ ] Domain resolves (`nslookup labzero.io`)
- [ ] HTTPS works (`https://labzero.io` - green lock)
- [ ] Frontend loads (visit `https://labzero.io`)
- [ ] API works (`curl https://api.labzero.io/health`)
- [ ] OAuth providers updated (Google + LinkedIn)
- [ ] Google login works (test full flow)
- [ ] No CORS errors (check browser console)

---

## 🎯 Quick Commands Reference

```bash
# Start services
docker-compose up -d

# Start tunnel (foreground)
./scripts/start-cloudflare-tunnel.sh

# Start tunnel (background)
nohup cloudflared tunnel --config cloudflare-tunnel-config.yml run labzero > tunnel.log 2>&1 &

# Check tunnel status
cloudflared tunnel info labzero

# Check services
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

---

## 📝 Current Configuration

**Domain:** `labzero.io`  
**API Domain:** `api.labzero.io`  
**Tunnel ID:** `1901f64d-9731-450b-a0dc-ff0cffcb043f`  
**Config File:** `cloudflare-tunnel-config.yml`  
**Frontend Port:** `3001`  
**API Port:** `8080`

---

**Ready to test? Start with Step 1 (Docker services) and work through each step!**


