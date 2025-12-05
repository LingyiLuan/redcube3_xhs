# ⚡ Quick Domain Setup (25 Minutes)

Fastest path to get your domain live with Cloudflare.

---

## 🚀 Fast Track (Cloudflare Tunnel - No VPS Needed!)

### Step 1: Buy Domain (5 min)
1. Go to https://www.cloudflare.com/products/registrar/
2. Search for domain (e.g., `redcube.io`)
3. Add to cart, checkout
4. **Domain is automatically added to Cloudflare!**

### Step 2: Install Cloudflare Tunnel (5 min)

**On macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**On Linux:**
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

### Step 3: Authenticate & Create Tunnel (5 min)
```bash
# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create redcube

# This creates a tunnel and saves credentials
```

### Step 4: Configure Tunnel (5 min)

Create `cloudflare-tunnel-config.yml` in project root:

```yaml
tunnel: redcube
credentials-file: /Users/luan02/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  # Frontend (Vue app)
  - hostname: yourdomain.com
    service: http://localhost:3001
  
  # API Gateway
  - hostname: api.yourdomain.com
    service: http://localhost:8080
  
  # Catch-all
  - service: http_status:404
```

**Replace `yourdomain.com` with your actual domain!**

### Step 5: Route Domain to Tunnel (5 min)
```bash
# Route domain to tunnel
cloudflared tunnel route dns redcube yourdomain.com
cloudflared tunnel route dns redcube api.yourdomain.com
```

### Step 6: Start Tunnel (5 min)
```bash
# Run tunnel (keeps running)
cloudflared tunnel --config cloudflare-tunnel-config.yml run redcube

# OR run in background
nohup cloudflared tunnel --config cloudflare-tunnel-config.yml run redcube > tunnel.log 2>&1 &
```

**✅ Your domain is now live!**

---

## 🔧 Update Application Config

### 1. Update `.env` file:

```bash
# Replace YOUR_DOMAIN with your actual domain
FRONTEND_URL=https://YOUR_DOMAIN
VITE_API_GATEWAY_URL=https://api.YOUR_DOMAIN

# OAuth Callbacks
GOOGLE_CALLBACK_URL=https://api.YOUR_DOMAIN/api/auth/google/callback
LINKEDIN_CALLBACK_URL=https://api.YOUR_DOMAIN/api/auth/linkedin/callback

# CORS
ALLOWED_ORIGINS=https://YOUR_DOMAIN,https://www.YOUR_DOMAIN

# Production
NODE_ENV=production
SESSION_COOKIE_SECURE=true
```

### 2. Update OAuth Providers:

**Google:**
- Go to https://console.cloud.google.com/apis/credentials
- Update redirect URI: `https://api.YOUR_DOMAIN/api/auth/google/callback`

**LinkedIn:**
- Go to https://www.linkedin.com/developers/apps
- Update redirect URL: `https://api.YOUR_DOMAIN/api/auth/linkedin/callback`

### 3. Restart Services:

```bash
# Stop current services
docker-compose down

# Start with new environment
docker-compose up -d
```

---

## ✅ Test Checklist

- [ ] Visit `https://yourdomain.com` - frontend loads
- [ ] Visit `https://api.yourdomain.com/health` - API responds
- [ ] Try Google login - redirects work
- [ ] Check browser console - no CORS errors
- [ ] Test analysis flow - everything works

---

## 🎯 That's It!

Your domain is live with:
- ✅ Free SSL (automatic)
- ✅ CDN (Cloudflare)
- ✅ DDoS protection
- ✅ No VPS needed

**Next**: Set up Sentry for error tracking!


