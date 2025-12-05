# 🔧 Fix 403 Forbidden Error on labzero.io

The 403 error is from Cloudflare's security settings blocking the request. Here's how to fix it.

---

## ✅ What's Working

- ✅ Tunnel is running and connected
- ✅ Local service (port 5173) is accessible
- ✅ DNS is configured correctly
- ✅ Tunnel is active

---

## 🔧 Fix 1: Disable Cloudflare Security (Temporary - For Testing)

### Option A: Via Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard:**
   - https://dash.cloudflare.com
   - Select your domain: `labzero.io`

2. **Go to Security → WAF (Web Application Firewall):**
   - Click **"WAF"** in left sidebar
   - Look for **"Security Level"** or **"Challenge Passage"**
   - Set to **"Essentially Off"** or **"Low"** (temporarily for testing)

3. **Go to Security → Settings:**
   - Set **Security Level**: **Low** or **Medium**
   - Disable **"Bot Fight Mode"** (temporarily)
   - Disable **"Challenge Passage"** (temporarily)

4. **Go to SSL/TLS:**
   - Set mode to **"Full"** (not "Full (strict)")
   - This allows self-signed certificates

5. **Save changes and wait 1-2 minutes**

### Option B: Via Cloudflare API (Faster)

```bash
# Get your API token from Cloudflare dashboard
# Settings → API Tokens → Create Token

# Set security level to Low
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/settings/security_level" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"value":"low"}'
```

---

## 🔧 Fix 2: Check Firewall Rules

1. **Go to Cloudflare Dashboard → Security → WAF**
2. **Check "Custom Rules"** - make sure nothing is blocking
3. **Check "Rate Limiting Rules"** - disable temporarily
4. **Check "IP Access Rules"** - make sure your IP isn't blocked

---

## 🔧 Fix 3: Verify Tunnel Configuration

The tunnel config looks correct, but let's verify the service is reachable:

```bash
# Test local service
curl http://localhost:5173

# Should return HTML
```

---

## 🔧 Fix 4: Check Cloudflare SSL Mode

1. **Go to SSL/TLS → Overview**
2. **Set SSL/TLS encryption mode to: "Full"**
   - NOT "Full (strict)" (requires valid cert)
   - NOT "Flexible" (less secure)

3. **Wait 2-3 minutes for changes to propagate**

---

## 🔧 Fix 5: Bypass Cloudflare (For Testing)

If you need to test immediately, you can access directly via Cloudflare Tunnel's temporary URL:

```bash
# Get tunnel URL
cloudflared tunnel info labzero

# Or access via trycloudflare.com (if enabled)
```

---

## 🎯 Quick Fix Steps (Do These Now)

### Step 1: Lower Security Level (2 min)

1. Go to: https://dash.cloudflare.com
2. Select: `labzero.io`
3. Go to: **Security → Settings**
4. Set **Security Level**: **Low**
5. Click **Save**

### Step 2: Check SSL Mode (1 min)

1. Go to: **SSL/TLS → Overview**
2. Set mode to: **Full**
3. Click **Save**

### Step 3: Disable Bot Protection (1 min)

1. Go to: **Security → Bots**
2. Set **Bot Fight Mode**: **Off** (temporarily)
3. Click **Save**

### Step 4: Wait & Test (2 min)

Wait 2-3 minutes for changes to propagate, then:

```bash
curl -I https://labzero.io
```

Should return `HTTP/2 200` instead of `403`.

---

## 🐛 If Still Getting 403

### Check Tunnel Logs

Look at the terminal where tunnel is running. You should see connection logs.

### Verify Service is Running

```bash
# Check frontend
curl http://localhost:5173

# Check API
curl http://localhost:8080/health
```

### Check Cloudflare Analytics

1. Go to Cloudflare Dashboard → Analytics
2. Check **"Security Events"** tab
3. See what's being blocked and why

### Try Direct IP Access

```bash
# Get Cloudflare IP
nslookup labzero.io

# Try accessing directly (bypass Cloudflare)
# This won't work with tunnel, but helps diagnose
```

---

## ✅ Expected Result

After fixing security settings:

```bash
$ curl -I https://labzero.io
HTTP/2 200
content-type: text/html
...
```

And in browser:
- ✅ `https://labzero.io` loads
- ✅ Green lock icon (SSL working)
- ✅ No 403 error

---

## 🔒 Re-Enable Security After Testing

Once everything works:

1. **Set Security Level back to: Medium**
2. **Enable Bot Fight Mode** (if needed)
3. **Add specific firewall rules** instead of blocking everything
4. **Monitor Security Events** to see what's being blocked

---

**Start with Step 1-3 above (lower security settings) and test again!**


