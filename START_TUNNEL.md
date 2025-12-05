# 🚀 Start Your Domain: labzero.io

Quick guide to get your domain live right now!

---

## ✅ Current Status

- ✅ Domain: `labzero.io` configured
- ✅ DNS: Routed to Cloudflare Tunnel
- ✅ API Gateway: Running on port 8080 ✅
- ✅ Frontend: Running on port 5173 ✅
- ✅ Tunnel Config: Updated

---

## 🚀 Start Cloudflare Tunnel (2 minutes)

### Option 1: Run in Terminal (Recommended for Testing)

Open a **new terminal window** and run:

```bash
cd /Users/luan02/Desktop/redcube3_xhs
cloudflared tunnel --config cloudflare-tunnel-config.yml run labzero
```

**Keep this terminal open!** The tunnel runs in the foreground.

### Option 2: Run in Background

```bash
cd /Users/luan02/Desktop/redcube3_xhs
nohup cloudflared tunnel --config cloudflare-tunnel-config.yml run labzero > tunnel.log 2>&1 &
```

Check logs:
```bash
tail -f tunnel.log
```

---

## ✅ Verify Tunnel is Running

In another terminal, check:

```bash
# Check tunnel status
cloudflared tunnel info labzero

# Should show:
# - Status: ACTIVE
# - Connections: 1 or more
```

---

## 🌐 Test Your Domain

### 1. Test Frontend (Wait 2-3 minutes for DNS)
```bash
# Test HTTPS
curl -I https://labzero.io

# Should return: HTTP/2 200
```

### 2. Test API
```bash
# Test API health
curl https://api.labzero.io/health

# Should return: OK
```

### 3. Open in Browser
1. Visit: `https://labzero.io`
2. Should see your landing page
3. Check for green lock (SSL working)

---

## ⚠️ Important: Update OAuth Providers

**Before testing login, update these:**

### Google OAuth:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth client
3. Add redirect URI: `https://api.labzero.io/api/auth/google/callback`
4. Add JavaScript origin: `https://labzero.io`

### LinkedIn OAuth:
1. Go to: https://www.linkedin.com/developers/apps
2. Edit your app → Auth tab
3. Add redirect URL: `https://api.labzero.io/api/auth/linkedin/callback`

---

## 🐛 Troubleshooting

### "Connection refused" or "502 Bad Gateway"

**Check services are running:**
```bash
# Check API
curl http://localhost:8080/health
# Should return: OK

# Check frontend
curl http://localhost:5173
# Should return: HTML
```

**If frontend not running:**
```bash
cd vue-frontend
npm run dev
```

### Domain not loading

1. **Wait 5-10 minutes** for DNS propagation
2. **Check tunnel is running:**
   ```bash
   cloudflared tunnel list
   ```
3. **Check DNS:**
   ```bash
   nslookup labzero.io
   # Should show Cloudflare IPs
   ```

### SSL not working

- Cloudflare provides SSL automatically
- Wait 5-10 minutes after starting tunnel
- Check Cloudflare dashboard → SSL/TLS → should be "Full"

---

## 📝 Quick Commands

```bash
# Start tunnel
cloudflared tunnel --config cloudflare-tunnel-config.yml run labzero

# Check tunnel status
cloudflared tunnel info labzero

# Stop tunnel
# Press Ctrl+C (if running in foreground)
# OR
pkill cloudflared

# View tunnel logs (if running in background)
tail -f tunnel.log
```

---

## ✅ Success Checklist

- [ ] Tunnel is running (`cloudflared tunnel info labzero`)
- [ ] Frontend accessible: `https://labzero.io`
- [ ] API accessible: `https://api.labzero.io/health`
- [ ] SSL working (green lock in browser)
- [ ] OAuth providers updated
- [ ] Can login with Google

---

**Ready? Start the tunnel now and test your domain!** 🚀


