# 🌐 Domain & Cloudflare Setup Guide

Complete step-by-step guide to set up your production domain with Cloudflare (free SSL + CDN).

---

## 📋 Prerequisites

- Credit card for domain purchase (~$10-30/year)
- Cloudflare account (free)
- Access to your server/VPS (where Docker containers will run)

---

## Step 1: Choose & Buy Domain (15 minutes)

### Recommended Domain Options:

**Option 1: .io Domain (Recommended for Tech Startups)**
- **Price**: $30-50/year
- **Registrars**: Namecheap, Google Domains, Cloudflare Registrar
- **Examples**: `redcube.io`, `interviewintel.io`, `jobintel.io`

**Option 2: .com Domain (Traditional)**
- **Price**: $10-15/year
- **Registrars**: Namecheap, Google Domains, GoDaddy
- **Examples**: `redcube.com`, `interviewintel.com`

**Option 3: .app Domain (Modern)**
- **Price**: $15-20/year
- **Registrars**: Google Domains, Namecheap
- **Examples**: `redcube.app`, `interviewintel.app`

### Where to Buy:

1. **Cloudflare Registrar** (Recommended - easiest integration)
   - https://www.cloudflare.com/products/registrar/
   - Free privacy protection
   - At-cost pricing
   - Easy DNS management

2. **Namecheap** (Popular choice)
   - https://www.namecheap.com/
   - Good prices
   - Free privacy protection

3. **Google Domains** (Simple)
   - https://domains.google/
   - Clean interface
   - Good for beginners

### Purchase Steps:

1. Go to your chosen registrar
2. Search for your desired domain name
3. Add to cart and checkout
4. **Important**: Enable privacy protection (free on most registrars)
5. Complete purchase

**Note**: Domain propagation takes 24-48 hours, but we can set up Cloudflare immediately.

---

## Step 2: Set Up Cloudflare Account (10 minutes)

### Create Account:

1. Go to https://dash.cloudflare.com/sign-up
2. Sign up with email (free account is sufficient)
3. Verify your email

### Add Your Domain:

1. Click **"Add a Site"** in Cloudflare dashboard
2. Enter your domain (e.g., `redcube.io`)
3. Select **Free Plan** (perfect for beta launch)
4. Click **Continue**

### Cloudflare Will Scan Your DNS:

- This may take 1-2 minutes
- Cloudflare will detect existing DNS records
- Review the detected records

---

## Step 3: Configure DNS Records (20 minutes)

### If Domain is at Cloudflare Registrar:

DNS is already managed by Cloudflare - skip to Step 4.

### If Domain is at Another Registrar:

You need to **change nameservers**:

1. **Get Cloudflare Nameservers:**
   - In Cloudflare dashboard, go to your domain
   - Look for "Nameservers" section
   - Copy the two nameservers (e.g., `alice.ns.cloudflare.com` and `bob.ns.cloudflare.com`)

2. **Update at Your Registrar:**
   - Log into your domain registrar (Namecheap, GoDaddy, etc.)
   - Find "DNS Settings" or "Nameservers"
   - Replace existing nameservers with Cloudflare's nameservers
   - Save changes

3. **Wait for Propagation:**
   - Usually takes 1-24 hours
   - You can check status at https://www.whatsmydns.net/

### Add DNS Records in Cloudflare:

Once nameservers are updated, add these DNS records:

#### A Record (Main Domain):
```
Type: A
Name: @ (or your domain name)
IPv4 address: YOUR_SERVER_IP
Proxy status: Proxied (orange cloud) ✅
TTL: Auto
```

#### A Record (API Subdomain):
```
Type: A
Name: api
IPv4 address: YOUR_SERVER_IP
Proxy status: Proxied (orange cloud) ✅
TTL: Auto
```

#### CNAME Record (www - Optional):
```
Type: CNAME
Name: www
Target: @ (or your domain name)
Proxy status: Proxied (orange cloud) ✅
TTL: Auto
```

**Important**: 
- Replace `YOUR_SERVER_IP` with your actual server IP address
- Make sure "Proxy status" is **Proxied** (orange cloud) for SSL to work
- If you don't have a server yet, use a placeholder IP and update later

---

## Step 4: Enable SSL/TLS (Automatic - 5 minutes)

### Automatic SSL:

1. In Cloudflare dashboard, go to **SSL/TLS** section
2. Select **"Full"** or **"Full (strict)"** mode:
   - **Full**: Works with self-signed certificates
   - **Full (strict)**: Requires valid SSL certificate (recommended for production)

3. **For Beta Launch**: Use **"Full"** mode (easier setup)
4. Cloudflare will automatically provision SSL certificates
5. Wait 5-10 minutes for SSL to activate

### Verify SSL:

- Visit `https://yourdomain.com` (should show green lock)
- Check SSL status at https://www.ssllabs.com/ssltest/

---

## Step 5: Configure Cloudflare Settings (10 minutes)

### Speed Optimization:

1. Go to **Speed** section
2. Enable:
   - ✅ **Auto Minify** (HTML, CSS, JavaScript)
   - ✅ **Brotli** compression
   - ✅ **Rocket Loader** (optional - can break some JS)

### Caching:

1. Go to **Caching** section
2. Set **Caching Level**: Standard
3. Set **Browser Cache TTL**: 4 hours (for beta)

### Security:

1. Go to **Security** section
2. Set **Security Level**: Medium (for beta)
3. Enable **Always Use HTTPS**: ON
4. Enable **Automatic HTTPS Rewrites**: ON

### Firewall Rules (Optional but Recommended):

1. Go to **Firewall** section
2. Add rule to block common attack patterns:
   ```
   Rule: Block SQL Injection Attempts
   Field: URI Path
   Operator: contains
   Value: union select
   Action: Block
   ```

---

## Step 6: Update Your Application Configuration

### Environment Variables to Update:

Create/update `.env` file in project root:

```bash
# Domain Configuration
FRONTEND_URL=https://yourdomain.com
VITE_API_GATEWAY_URL=https://api.yourdomain.com

# OAuth Callback URLs (Update these!)
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
LINKEDIN_CALLBACK_URL=https://api.yourdomain.com/api/auth/linkedin/callback

# CORS Settings (Update in backend)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Session Cookie (Important for HTTPS!)
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=lax
```

### Update Backend Services:

#### 1. Update `services/user-service/src/routes/authRoutes.js`:

The `FRONTEND_URL` environment variable is already used - just make sure it's set correctly.

#### 2. Update `services/user-service/src/app.js`:

Ensure CORS allows your domain:

```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
  credentials: true,
  optionsSuccessStatus: 200
}
```

#### 3. Update Session Cookie Settings:

In `services/user-service/src/app.js`, ensure cookies are secure:

```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production', // true in production
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
}
```

### Update Frontend:

#### 1. Update `vue-frontend/vite.config.ts`:

For production build, the proxy is not used. The frontend will make requests to `/api` which will be handled by your server.

#### 2. Update `vue-frontend/src/services/apiClient.ts`:

The baseURL is already relative (`/api/content`), which is correct for production.

---

## Step 7: Server Setup (If Using VPS)

### Option A: Deploy to VPS (DigitalOcean, AWS, etc.)

1. **Get a VPS:**
   - DigitalOcean Droplet ($6-12/month)
   - AWS EC2 (free tier available)
   - Linode ($5-10/month)

2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

3. **Install Docker Compose:**
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. **Clone Your Repo:**
   ```bash
   git clone https://github.com/LingyiLuan/redcube3_xhs.git
   cd redcube3_xhs
   ```

5. **Set Up Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

6. **Start Services:**
   ```bash
   docker-compose up -d
   ```

### Option B: Use Cloudflare Tunnel (No VPS Needed!)

**This is the EASIEST option for beta launch:**

1. **Install Cloudflare Tunnel:**
   ```bash
   # On your local machine or any server
   brew install cloudflare/cloudflare/cloudflared  # macOS
   # OR
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
   chmod +x cloudflared
   ```

2. **Authenticate:**
   ```bash
   cloudflared tunnel login
   ```

3. **Create Tunnel:**
   ```bash
   cloudflared tunnel create redcube
   ```

4. **Configure Tunnel:**
   Create `config.yml`:
   ```yaml
   tunnel: redcube
   credentials-file: /path/to/credentials.json
   
   ingress:
     - hostname: yourdomain.com
       service: http://localhost:3001
     - hostname: api.yourdomain.com
       service: http://localhost:8080
     - service: http_status:404
   ```

5. **Run Tunnel:**
   ```bash
   cloudflared tunnel run redcube
   ```

**Benefits:**
- ✅ No need for VPS
- ✅ Free SSL automatically
- ✅ Works from your local machine
- ✅ Perfect for beta launch

---

## Step 8: Update OAuth Providers

### Google OAuth:

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client
3. Update **Authorized redirect URIs**:
   ```
   https://api.yourdomain.com/api/auth/google/callback
   ```
4. Update **Authorized JavaScript origins**:
   ```
   https://yourdomain.com
   https://api.yourdomain.com
   ```
5. Save changes

### LinkedIn OAuth:

1. Go to https://www.linkedin.com/developers/apps
2. Select your app
3. Go to **Auth** tab
4. Update **Authorized redirect URLs**:
   ```
   https://api.yourdomain.com/api/auth/linkedin/callback
   ```
5. Save changes

---

## Step 9: Test Everything (15 minutes)

### Checklist:

- [ ] Domain resolves: `ping yourdomain.com`
- [ ] HTTPS works: `https://yourdomain.com` (green lock)
- [ ] Frontend loads: Visit `https://yourdomain.com`
- [ ] API works: `curl https://api.yourdomain.com/health`
- [ ] OAuth redirects: Try Google login
- [ ] CORS works: Frontend can call API
- [ ] Cookies work: Session persists after login

### Test Commands:

```bash
# Test DNS
nslookup yourdomain.com

# Test HTTPS
curl -I https://yourdomain.com

# Test API
curl https://api.yourdomain.com/health

# Test OAuth callback (should redirect)
curl -I https://api.yourdomain.com/api/auth/google
```

---

## Step 10: Final Configuration

### Update Production Environment:

1. **Set NODE_ENV:**
   ```bash
   NODE_ENV=production
   ```

2. **Update All URLs:**
   - Replace all `localhost` references
   - Update all `http://` to `https://`
   - Update OAuth callback URLs

3. **Enable Production Features:**
   - Secure cookies
   - CORS restrictions
   - Rate limiting
   - Security headers

---

## 🎯 Quick Start (Fastest Path)

**If you want to launch FAST:**

1. **Buy domain** at Cloudflare Registrar (5 min)
2. **Set up Cloudflare Tunnel** on your local machine (10 min)
3. **Update OAuth callbacks** (5 min)
4. **Test** (5 min)

**Total: ~25 minutes to production!**

---

## 📝 Next Steps After Domain Setup

1. ✅ Set up Sentry (error tracking)
2. ✅ Set up UptimeRobot (monitoring)
3. ✅ Add rate limiting
4. ✅ Add security headers
5. ✅ Test core user journey

---

## 🆘 Troubleshooting

### Domain Not Resolving:
- Wait 24-48 hours for DNS propagation
- Check nameservers are correct
- Verify DNS records in Cloudflare

### SSL Not Working:
- Ensure "Proxy" is enabled (orange cloud)
- Wait 10-15 minutes for SSL activation
- Check SSL mode is "Full" or "Full (strict)"

### OAuth Not Working:
- Verify callback URLs are updated in OAuth providers
- Check `FRONTEND_URL` environment variable
- Ensure HTTPS is used (not HTTP)

### CORS Errors:
- Check `ALLOWED_ORIGINS` includes your domain
- Verify credentials are enabled
- Check browser console for specific error

---

## 💡 Pro Tips

1. **Use Cloudflare Tunnel for Beta**: Easiest setup, no VPS needed
2. **Enable Cloudflare Analytics**: Free insights into traffic
3. **Set Up Page Rules**: Custom caching rules for different paths
4. **Monitor SSL**: Cloudflare dashboard shows SSL status
5. **Test on Mobile**: Ensure mobile experience works

---

**Ready to set up? Start with Step 1 (Buy Domain) and work through each step!**


