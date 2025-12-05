# 🔌 Railway Service Ports

## **Ports for Each Service:**

When Railway asks "Enter the port your app is listening on", use these:

### **user-service:**
**Port:** `3001`
- Service listens on: `process.env.PORT || 3001`
- Railway will provide PORT env var, but default is 3001

### **interview-service:**
**Port:** `3002`
- Service listens on: `process.env.PORT || 3002`
- Railway will provide PORT env var, but default is 3002

### **content-service:**
**Port:** `3003`
- Service listens on: `process.env.PORT || 3003`
- Railway will provide PORT env var, but default is 3003

### **notification-service:**
**Port:** `3004`
- Service listens on: `process.env.PORT || 3004`
- Railway will provide PORT env var, but default is 3004

---

## **How to Generate Domains:**

For each service:

1. **Go to service** → Settings → Networking
2. **Click "Generate domain"**
3. **When asked for port:**
   - user-service → Enter: `3001`
   - interview-service → Enter: `3002`
   - content-service → Enter: `3003`
   - notification-service → Enter: `3004`
4. **Click "Generate"**
5. **Wait 10-30 seconds**
6. **Refresh page**
7. **Copy the domain**

---

## **Note:**

Railway provides a `PORT` environment variable automatically, but:
- Services have fallback defaults (3001, 3002, 3003, 3004)
- Railway's domain generator needs to know which port to expose
- Use the default port numbers above
