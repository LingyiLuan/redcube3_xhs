# ▲ Vercel Deployment Guide

## **Step-by-Step Guide to Deploy Frontend to Vercel**

This guide will help you deploy your Vue.js frontend to Vercel for fast, global CDN delivery.

---

## **Prerequisites**

- ✅ GitHub account with your code pushed
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ Railway backend deployed (see `RAILWAY_DEPLOYMENT_GUIDE.md`)

---

## **Step 1: Create Vercel Account**

1. **Sign up for Vercel:**
   - Go to https://vercel.com
   - Click "Sign Up"
   - Sign up with GitHub (recommended)

2. **Verify Email:**
   - Check your email
   - Click verification link

---

## **Step 2: Import Project**

1. **Import from GitHub:**
   - In Vercel dashboard, click "Add New" → "Project"
   - Click "Import Git Repository"
   - Select your repository: `redcube3_xhs`
   - Click "Import"

2. **Configure Project:**
   - **Framework Preset**: Vite
   - **Root Directory**: `vue-frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

3. **Environment Variables:**
   - Click "Environment Variables"
   - Add:
     ```
     VITE_API_GATEWAY_URL=https://api.labzero.io
     ```
   - Click "Add" for each environment (Production, Preview, Development)

---

## **Step 3: Configure Build Settings**

Vercel should auto-detect Vue.js, but verify:

1. **Framework Settings:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. **Node.js Version:**
   - Go to "Settings" → "General"
   - Set Node.js Version: `20.x` (or `22.x`)

---

## **Step 4: Deploy**

1. **Click "Deploy":**
   - Vercel will start building
   - Watch the build logs
   - Wait for deployment to complete (~2-3 minutes)

2. **Check Deployment:**
   - Once deployed, you'll get a URL like: `redcube3-xhs.vercel.app`
   - Click to preview your app

---

## **Step 5: Configure Custom Domain**

1. **Add Domain:**
   - Go to "Settings" → "Domains"
   - Click "Add Domain"
   - Enter: `labzero.io`
   - Click "Add"

2. **Configure DNS:**
   - Vercel will show DNS records to add
   - Go to Cloudflare dashboard
   - Add DNS records:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21 (Vercel's IP)
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

3. **Verify Domain:**
   - Vercel will verify DNS
   - Wait 1-24 hours for DNS propagation
   - Once verified, SSL certificate is auto-generated

---

## **Step 6: Update API Gateway URL**

1. **Verify Environment Variable:**
   - In Vercel dashboard, go to "Settings" → "Environment Variables"
   - Verify `VITE_API_GATEWAY_URL=https://api.labzero.io` is set

2. **Redeploy:**
   - Go to "Deployments"
   - Click "..." → "Redeploy"
   - This ensures the environment variable is used

---

## **Step 7: Test Production Build**

1. **Test Frontend:**
   - Visit: `https://labzero.io`
   - Verify page loads
   - Check browser console for errors

2. **Test API Connection:**
   - Try logging in
   - Verify API calls go to `https://api.labzero.io`
   - Check Network tab in browser DevTools

---

## **Step 8: Configure Rewrites (Optional)**

If you need API proxying, Vercel's `vercel.json` is already configured:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://api.labzero.io/api/$1"
    }
  ]
}
```

This allows frontend to call `/api/*` and it will proxy to Railway backend.

---

## **Step 9: Enable Analytics (Optional)**

1. **Vercel Analytics:**
   - Go to "Analytics" tab
   - Enable Web Analytics (free tier available)
   - Track page views, performance, etc.

---

## **Step 10: Set Up Preview Deployments**

Vercel automatically creates preview deployments for each PR:

1. **Preview URLs:**
   - Each PR gets a unique URL
   - Test before merging
   - Share with team for review

2. **Configure Preview Environment:**
   - Go to "Settings" → "Environment Variables"
   - Set `VITE_API_GATEWAY_URL` for "Preview" environment
   - Use staging API URL if available

---

## **Troubleshooting**

### **Build Fails:**
- Check build logs in Vercel dashboard
- Verify `package.json` has correct scripts
- Check Node.js version compatibility

### **API Calls Fail:**
- Verify `VITE_API_GATEWAY_URL` is set correctly
- Check CORS settings on backend
- Verify Railway backend is accessible

### **Domain Not Working:**
- Check DNS records in Cloudflare
- Wait for DNS propagation (up to 24 hours)
- Verify SSL certificate is issued

### **Environment Variables Not Working:**
- Variables must start with `VITE_` to be exposed to frontend
- Redeploy after adding variables
- Check variable names match exactly

---

## **Cost Estimate**

- **Hobby Plan**: Free (generous limits)
- **Pro Plan**: $20/month (for teams)
- **Estimated Cost**: Free for beta/launch

**Free Tier Includes:**
- 100GB bandwidth/month
- Unlimited deployments
- Custom domains
- SSL certificates
- Preview deployments

---

## **Next Steps**

1. ✅ Test all features on production
2. ✅ Set up monitoring (Sentry, LogRocket)
3. ✅ Configure error tracking
4. ✅ Set up analytics

---

## **Support**

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- Vercel Status: https://www.vercel-status.com

