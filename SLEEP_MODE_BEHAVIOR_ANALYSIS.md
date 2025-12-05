# Sleep Mode Behavior: Can Users Access LabZero When Computer Sleeps?

## 🔍 The Question

**If your computer goes to sleep (but not shut down), can other people still use your app through `labzero.io`?**

---

## ❌ Short Answer: **NO**

**When your Mac goes to sleep:**
- ❌ **Cloudflare Tunnel disconnects** (no network connection)
- ❌ **Docker containers pause** (services stop responding)
- ❌ **Domain becomes inaccessible** (users get connection errors)
- ❌ **All functions stop working**

**Your app will NOT be accessible when your computer is sleeping.**

---

## 🔬 Technical Explanation

### **1. Cloudflare Tunnel Behavior**

**How Cloudflare Tunnel Works:**
- Cloudflare Tunnel creates a **persistent connection** from your local machine to Cloudflare's servers
- This connection requires:
  - Your computer to be **awake and running**
  - Network connection to be **active**
  - The `cloudflared` process to be **running**

**What Happens When Computer Sleeps:**
- Network connection is **suspended**
- `cloudflared` process **stops** (or loses connection)
- Cloudflare Tunnel **disconnects**
- Domain `labzero.io` → **Connection refused / Timeout**

**Result:** Users trying to access `labzero.io` will get:
- `ERR_CONNECTION_REFUSED`
- `ERR_TIMED_OUT`
- `502 Bad Gateway` (if Cloudflare caches the error)

---

### **2. Docker Containers Behavior**

**When Mac Goes to Sleep:**
- Docker Desktop **pauses containers** (on macOS)
- Containers enter **suspended state**
- Services **stop responding** to requests
- Database connections **timeout**
- Redis connections **drop**

**What This Means:**
- `content-service` → **Not responding**
- `user-service` → **Not responding**
- `postgres` → **Not responding**
- `redis` → **Not responding**
- `api-gateway` (nginx) → **Not responding**

**Result:** Even if the tunnel somehow stayed connected, your services wouldn't work.

---

### **3. Network Connection**

**When Computer Sleeps:**
- WiFi/Ethernet connection is **suspended**
- Network interfaces go **offline**
- No incoming/outgoing traffic
- Cloudflare Tunnel **cannot maintain connection**

**Result:** No network = No access

---

## ✅ Solutions: Keep Your App Running 24/7

### **Option 1: Prevent Sleep (Recommended for Development)**

**On macOS:**

1. **System Settings → Energy Saver:**
   - Uncheck "Put hard disks to sleep when possible"
   - Set "Computer sleep" to **Never**
   - Set "Display sleep" to your preference (doesn't affect services)

2. **Or use `caffeinate` command:**
   ```bash
   # Prevent sleep indefinitely
   caffeinate -d
   
   # Prevent sleep for specific duration (e.g., 8 hours)
   caffeinate -d -t 28800
   ```

3. **Or use `pmset` (Power Management):**
   ```bash
   # Prevent sleep when plugged in
   sudo pmset -c sleep 0
   
   # Prevent sleep on battery (use with caution)
   sudo pmset -b sleep 0
   ```

**Result:** Computer stays awake, services keep running, domain stays accessible.

---

### **Option 2: Use a Cloud Server (Recommended for Production)**

**For 24/7 availability, you need a cloud server:**

1. **VPS Options:**
   - **DigitalOcean:** $6-12/month (Droplet)
   - **Linode:** $5-10/month (Nanode)
   - **Vultr:** $6/month (Regular Performance)
   - **AWS EC2:** $10-20/month (t3.micro)
   - **Google Cloud:** $10-20/month (e2-micro)

2. **Deploy Your App:**
   - Install Docker on the server
   - Clone your repo
   - Run `docker compose up -d`
   - Set up Cloudflare Tunnel on the server
   - Domain stays accessible 24/7

3. **Benefits:**
   - ✅ 24/7 availability
   - ✅ No need to keep your laptop on
   - ✅ Better performance (dedicated resources)
   - ✅ More reliable (no sleep/wake issues)

---

### **Option 3: Hybrid Approach (Development + Production)**

**Keep Development on Laptop:**
- Use laptop for development/testing
- Domain accessible when laptop is awake
- Use `caffeinate` when you need it running

**Deploy Production to Cloud:**
- Deploy to VPS for production
- Production domain: `app.labzero.io` or `prod.labzero.io`
- Development domain: `dev.labzero.io` (laptop)
- Users access production (always available)

---

## 🎯 Recommendations

### **For Beta Launch (Now):**

**Option A: Keep Laptop Awake**
- Use `caffeinate -d` to prevent sleep
- Keep laptop plugged in
- Monitor battery (if unplugged)
- **Pros:** Free, immediate
- **Cons:** Laptop must stay on, uses power

**Option B: Deploy to Cloud (Better)**
- Deploy to DigitalOcean/Linode ($6-12/month)
- Set up Cloudflare Tunnel on server
- Domain accessible 24/7
- **Pros:** Professional, reliable, scalable
- **Cons:** Costs $6-12/month

### **For Production (Later):**

**Definitely use a cloud server:**
- Professional deployment
- 24/7 availability
- Better performance
- Scalable infrastructure

---

## 📊 Comparison

| Solution | Cost | Availability | Reliability | Setup Time |
|----------|------|--------------|-------------|------------|
| **Laptop (Awake)** | Free | When awake | Medium | Immediate |
| **Laptop (Sleep)** | Free | ❌ Not available | ❌ Poor | N/A |
| **Cloud VPS** | $6-12/mo | ✅ 24/7 | ✅ High | 1-2 hours |
| **Hybrid** | $6-12/mo | ✅ 24/7 (prod) | ✅ High | 1-2 hours |

---

## 🚨 Important Notes

### **What Happens When Computer Wakes Up:**

**Good News:**
- Docker containers **automatically resume**
- Services **restart** (if configured)
- Cloudflare Tunnel **reconnects** (if `cloudflared` is running)

**Bad News:**
- There's a **delay** (30 seconds - 2 minutes) for everything to reconnect
- Users may experience **brief downtime** during wake-up
- Some connections may need **manual restart**

**To Ensure Smooth Wake-Up:**
1. Keep `cloudflared` running (use `brew services start cloudflared`)
2. Configure Docker to auto-start on boot
3. Use `docker compose restart` after wake-up

---

## ✅ Quick Fix: Prevent Sleep Right Now

**Run this command to prevent sleep:**
```bash
caffeinate -d
```

**This will:**
- ✅ Keep your computer awake
- ✅ Keep services running
- ✅ Keep domain accessible
- ✅ Until you press Ctrl+C or close terminal

**To prevent sleep permanently (until reboot):**
```bash
sudo pmset -c sleep 0
```

**To restore normal sleep behavior:**
```bash
sudo pmset -c sleep 10  # Sleep after 10 minutes of inactivity
```

---

## 🎯 Bottom Line

**NO, your app will NOT be accessible when your computer sleeps.**

**Solutions:**
1. **Short-term:** Use `caffeinate -d` to prevent sleep
2. **Long-term:** Deploy to a cloud server ($6-12/month)

**For beta launch, you can:**
- Keep laptop awake with `caffeinate -d`
- Or deploy to a cloud server for 24/7 availability

**For production, definitely use a cloud server.**
