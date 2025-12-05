# 🚀 Cloudflare Pages Deployment Guide - Step-by-Step

Complete detailed guide to deploy your Vue.js frontend to Cloudflare Pages with exact button locations and navigation paths.

---

## 📋 **Prerequisites Checklist**

Before starting, ensure you have:

- ✅ **Cloudflare Account**: Sign up at https://dash.cloudflare.com/sign-up (if you don't have one)
- ✅ **GitHub Account**: Your code must be in a GitHub repository
- ✅ **Domain on Cloudflare**: Your domain `labzero.io` should be added to Cloudflare (you already have this)
- ✅ **Backend Deployed**: Railway backend should be running (you already have this)
- ✅ **Repository Pushed**: All code should be pushed to GitHub

---

## **Step 1: Access Cloudflare Dashboard**

### **1.1 Navigate to Cloudflare Dashboard**

1. **Open your web browser**
2. **Go to**: https://dash.cloudflare.com
3. **Log in** with your Cloudflare account credentials
4. **You should see**: The main Cloudflare dashboard with your domains listed

### **1.2 Navigate to Pages**

**Location**: Left sidebar navigation menu

1. **Look at the left sidebar** (vertical menu on the left side of the screen)
2. **Scroll down** if needed to find the "Workers & Pages" section
3. **Click on**: **"Workers & Pages"** (it may show as an icon or text)
4. **You should see**: A submenu or dropdown
5. **Click on**: **"Pages"** (it should be in the submenu or directly visible)

**Alternative Path**:
- If you don't see "Workers & Pages", look for **"Pages"** directly in the left sidebar
- Or click on your domain name (`labzero.io`) → Look for **"Pages"** in the left sidebar

**What you should see**: A page titled "Pages" or "Cloudflare Pages" with a list of projects (may be empty if this is your first time)

---

## **Step 2: Create a New Project**

### **2.1 Click Create Project Button**

**Location**: Top right of the Pages dashboard

1. **Look at the top right corner** of the Pages page
2. **Find the button**: **"Create a project"** or **"Create a new project"**
   - It's usually a blue or purple button
   - May have a "+" icon next to it
3. **Click on**: **"Create a project"**

**What you should see**: A modal/popup window or a new page with project creation options

### **2.2 Choose Git Provider**

**Location**: In the create project modal/page

1. **You should see**: Options to connect to Git providers
2. **Look for**: **"Connect to Git"** button or **"GitHub"** option
3. **Click on**: **"Connect to Git"** or **"GitHub"**

**What you should see**: A page asking you to authorize GitHub access

---

## **Step 3: Connect GitHub Repository**

### **3.1 Authorize Cloudflare to Access GitHub**

**Location**: GitHub authorization page

1. **You should see**: A page asking to "Authorize Cloudflare Pages"
2. **Read the permissions**: It will ask for access to your repositories
3. **Click on**: **"Authorize Cloudflare Pages"** or **"Install & Authorize"**
   - This is usually a green button
4. **If prompted**: Enter your GitHub password or use GitHub's authentication

**What you should see**: A list of your GitHub repositories

### **3.2 Select Your Repository**

**Location**: Repository selection page

1. **You should see**: A list of your GitHub repositories
2. **Look for**: `redcube3_xhs` or `LingyiLuan/redcube3_xhs`
3. **Click on**: Your repository name (`redcube3_xhs`)

**What you should see**: A configuration page with build settings

---

## **Step 4: Configure Project Settings**

### **4.1 Set Project Name**

**Location**: Top of the configuration page

1. **Find the field**: **"Project name"** or **"Project Name"**
   - It's usually the first field at the top
2. **Enter**: `redcube3-xhs` or `labzero-frontend`
   - This will be part of your URL: `your-project-name.pages.dev`
   - Use lowercase, hyphens only (no spaces or special characters)
3. **Note**: This name can be changed later, but it's easier to set it correctly now

### **4.2 Set Production Branch**

**Location**: Below project name

1. **Find the field**: **"Production branch"** or **"Branch"**
2. **Enter**: `main`
   - This is your default branch (most likely `main` or `master`)
   - You can verify this in your GitHub repository settings

### **4.3 Configure Build Settings**

**Location**: Build settings section (usually in the middle of the page)

#### **4.3.1 Framework Preset**

1. **Find the dropdown**: **"Framework preset"** or **"Framework"**
2. **Click on the dropdown** to open it
3. **Select**: **"Vite"** or **"Vue.js"**
   - If you don't see Vite, select "Vue.js" or "None" (we'll configure manually)

#### **4.3.2 Root Directory**

1. **Find the field**: **"Root directory"** or **"Root Directory"**
2. **Enter**: `vue-frontend`
   - This tells Cloudflare where your frontend code is located
   - Since your Vue app is in the `vue-frontend` folder, we need to specify this

#### **4.3.3 Build Command**

1. **Find the field**: **"Build command"** or **"Build Command"**
2. **Enter**: `npm install && npm run build`
   - This installs dependencies and builds your project
   - Cloudflare may auto-fill this, but verify it's correct

#### **4.3.4 Build Output Directory**

1. **Find the field**: **"Build output directory"** or **"Output Directory"**
2. **Enter**: `dist`
   - This is where Vite outputs the built files
   - Cloudflare may auto-fill this as `dist` or `build`, make sure it's `dist`

**Summary of Build Settings**:
- **Framework preset**: Vite (or Vue.js)
- **Root directory**: `vue-frontend`
- **Build command**: `npm install && npm run build`
- **Build output directory**: `dist`

---

## **Step 5: Set Environment Variables**

### **5.1 Open Environment Variables Section**

**Location**: Below build settings, usually a collapsible section

1. **Look for**: **"Environment variables"** or **"Environment Variables"**
   - It may be a section header you can expand
   - Or a button that says "Add environment variable"
2. **Click on**: **"Environment variables"** to expand it (if it's collapsed)
   - Or click **"Add environment variable"** button

### **5.2 Add API Gateway URL**

1. **Find the "Name" field**: Enter `VITE_API_GATEWAY_URL`
2. **Find the "Value" field**: Enter your API Gateway URL
   - If using Railway: `https://api-gateway-production-b197.up.railway.app`
   - If using custom domain: `https://api.labzero.io`
3. **Select environment**: Check all three boxes:
   - ✅ **Production**
   - ✅ **Preview** (for pull requests)
   - ✅ **Development** (for local testing)
4. **Click**: **"Add"** or **"Save"** button

**Note**: Make sure the variable name starts with `VITE_` so Vite can access it during build time.

### **5.3 Add Node.js Version (Optional but Recommended)**

1. **Click**: **"Add environment variable"** again
2. **Name**: `NODE_VERSION`
3. **Value**: `20` (or `22` if you prefer, based on your package.json)
4. **Select**: All environments (Production, Preview, Development)
5. **Click**: **"Add"** or **"Save"**

**Your environment variables should look like**:
```
VITE_API_GATEWAY_URL = https://api-gateway-production-b197.up.railway.app
NODE_VERSION = 20
```

---

## **Step 6: Deploy Your Project**

### **6.1 Review Settings**

**Before deploying, double-check**:
- ✅ Project name is correct
- ✅ Production branch is `main`
- ✅ Root directory is `vue-frontend`
- ✅ Build command is `npm install && npm run build`
- ✅ Build output directory is `dist`
- ✅ Environment variables are set

### **6.2 Start Deployment**

**Location**: Bottom of the configuration page

1. **Scroll down** to the bottom of the page
2. **Find the button**: **"Save and Deploy"** or **"Deploy"**
   - It's usually a large blue or purple button
   - May be in the bottom right corner
3. **Click on**: **"Save and Deploy"**

**What you should see**: 
- The page will redirect to a deployment page
- You'll see build logs in real-time
- Status will show "Building..." or "Deploying..."

### **6.3 Monitor Deployment**

**Location**: Deployment page (automatic redirect after clicking deploy)

1. **Watch the build logs**: You'll see output like:
   ```
   Installing dependencies...
   Running build command...
   Building...
   Deploying...
   ```

2. **Wait for completion**: This usually takes 2-5 minutes
   - First deployment may take longer (installing dependencies)
   - Subsequent deployments are faster

3. **Look for success message**: 
   - ✅ "Deployment successful" or "Live"
   - ❌ If you see errors, check the build logs

### **6.4 Get Your Deployment URL**

**Location**: Top of the deployment page

1. **After successful deployment**, you'll see:
   - **URL**: `https://your-project-name.pages.dev`
   - **Status**: "Live" or "Active"
   - **Deployment time**: When it was deployed

2. **Click on the URL** to open your deployed site in a new tab
3. **Test your site**: Make sure it loads correctly

**Note**: Your site is now live! But we still need to connect your custom domain.

---

## **Step 7: Connect Custom Domain (labzero.io)**

### **7.1 Navigate to Custom Domains**

**Location**: Project dashboard (after deployment)

1. **You should be on**: The deployment page or project overview
2. **Look at the top navigation tabs**:
   - You should see tabs like: **"Deployments"**, **"Settings"**, **"Custom domains"**
3. **Click on**: **"Custom domains"** tab
   - Or look for **"Domains"** in the left sidebar of the project page

**Alternative Path**:
- Click on your project name in the Pages dashboard
- Look for **"Custom domains"** in the left sidebar or top tabs

### **7.2 Add Custom Domain**

**Location**: Custom domains page

1. **Find the button**: **"Set up a custom domain"** or **"Add custom domain"**
   - Usually a blue/purple button
   - May be at the top right or in the middle of the page
2. **Click on**: **"Set up a custom domain"**

**What you should see**: A modal or form asking for domain name

### **7.3 Enter Domain Name**

**Location**: Domain setup modal/form

1. **Find the input field**: **"Domain"** or **"Domain name"**
2. **Enter**: `labzero.io`
   - Don't include `https://` or `www.`
   - Just the domain name: `labzero.io`
3. **Click**: **"Continue"** or **"Next"** button

### **7.4 Configure DNS (Automatic if Domain is on Cloudflare)**

**If your domain is already on Cloudflare** (which it is):

1. **Cloudflare will automatically**:
   - Add a CNAME record pointing to your Pages site
   - Configure SSL/TLS automatically
   - Set up the domain

2. **You should see**: 
   - ✅ "Domain configured successfully"
   - ✅ "SSL certificate issued"
   - ✅ Status: "Active" or "Active (SSL)"

3. **Wait for DNS propagation**: Usually takes 1-5 minutes
   - Cloudflare will show the status
   - When it says "Active", your domain is ready

### **7.5 Verify Domain is Working**

1. **Wait for status**: Check that the domain shows as "Active"
2. **Open a new browser tab**
3. **Go to**: `https://labzero.io`
4. **You should see**: Your Vue.js app loading
5. **Test**: Make sure the app works correctly

**If domain is not on Cloudflare** (unlikely, but just in case):
- You'll need to add a CNAME record manually
- Point `labzero.io` to `your-project-name.pages.dev`
- Cloudflare will provide exact instructions

---

## **Step 8: Configure Additional Settings (Optional)**

### **8.1 Access Project Settings**

**Location**: Project dashboard

1. **Click on**: **"Settings"** tab (usually at the top)
2. **You should see**: Various configuration options

### **8.2 Configure Build Settings (If Needed)**

**Location**: Settings → Builds & deployments

1. **Look for**: **"Builds & deployments"** section
2. **Review**:
   - Build command
   - Output directory
   - Node.js version
3. **Make changes if needed**: Click **"Save"** after changes

### **8.3 Set Up Preview Deployments (Optional)**

**Location**: Settings → Builds & deployments

1. **Look for**: **"Preview deployments"** or **"Branch previews"**
2. **Enable**: Preview deployments for pull requests
   - This creates a preview URL for each PR
   - Useful for testing before merging

### **8.4 Configure Headers (Security)**

**Location**: Settings → Functions & Pages → Headers

1. **Click on**: **"Headers"** or **"Custom headers"**
2. **Add security headers** (optional but recommended):
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`

**Note**: These can also be added via `_headers` file in your project root.

---

## **Step 9: Verify Everything Works**

### **9.1 Test Your Deployed Site**

1. **Open**: `https://labzero.io` in your browser
2. **Check**:
   - ✅ Site loads correctly
   - ✅ No console errors (open browser DevTools)
   - ✅ API calls work (check Network tab)
   - ✅ Login/authentication works
   - ✅ All pages load correctly

### **9.2 Test API Connection**

1. **Open browser DevTools** (F12)
2. **Go to**: Network tab
3. **Try logging in** or making an API call
4. **Check**: 
   - ✅ API calls go to correct URL (`VITE_API_GATEWAY_URL`)
   - ✅ No CORS errors
   - ✅ Responses are successful

### **9.3 Check Build Logs**

**Location**: Project dashboard → Deployments tab

1. **Click on**: **"Deployments"** tab
2. **Click on**: Your latest deployment
3. **Review build logs**:
   - ✅ No errors
   - ✅ Build completed successfully
   - ✅ All dependencies installed

---

## **Step 10: Set Up Continuous Deployment**

### **10.1 Verify Auto-Deploy is Enabled**

**Location**: Settings → Builds & deployments

1. **Go to**: Settings → Builds & deployments
2. **Check**: **"Automatic deployments"** should be enabled
   - This is usually enabled by default
   - Every push to `main` branch will trigger a new deployment

### **10.2 Test Auto-Deploy**

1. **Make a small change** to your code (e.g., update a comment)
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```
3. **Go to**: Cloudflare Pages dashboard
4. **Watch**: A new deployment should start automatically
5. **Wait**: For deployment to complete
6. **Verify**: Your changes are live

---

## **Troubleshooting Common Issues**

### **Issue 1: Build Fails**

**Symptoms**: Build logs show errors

**Solutions**:
1. **Check build logs** for specific error messages
2. **Common issues**:
   - Missing environment variables → Add them in Settings
   - Wrong build command → Verify in Settings
   - Wrong output directory → Should be `dist`
   - Node.js version mismatch → Set `NODE_VERSION` environment variable

### **Issue 2: Site Loads but API Calls Fail**

**Symptoms**: Site loads but shows errors when making API calls

**Solutions**:
1. **Check environment variable**: `VITE_API_GATEWAY_URL` is set correctly
2. **Verify API Gateway URL**: Make sure it's accessible
3. **Check CORS**: API Gateway should allow requests from `labzero.io`
4. **Check browser console**: Look for CORS or network errors

### **Issue 3: Domain Not Working**

**Symptoms**: `labzero.io` doesn't load or shows error

**Solutions**:
1. **Check DNS**: Go to Cloudflare DNS settings
2. **Verify CNAME**: Should point to your Pages site
3. **Check SSL**: Should be "Full" or "Full (strict)"
4. **Wait**: DNS changes can take up to 24 hours (usually 1-5 minutes)

### **Issue 4: Environment Variables Not Working**

**Symptoms**: `process.env.VITE_API_GATEWAY_URL` is undefined

**Solutions**:
1. **Verify variable name**: Must start with `VITE_`
2. **Check environment**: Make sure it's set for Production
3. **Redeploy**: After adding variables, trigger a new deployment
4. **Check build logs**: Variables are injected at build time

---

## **Next Steps After Deployment**

### **1. Update API Gateway CORS**

Make sure your Railway API Gateway allows requests from `labzero.io`:

1. **Check**: `api-gateway/nginx.conf` or your API Gateway code
2. **Add**: `labzero.io` to allowed origins
3. **Redeploy**: API Gateway if needed

### **2. Test All Features**

1. **Login/Logout**: Test authentication
2. **API Calls**: Test all API endpoints
3. **File Uploads**: Test if you have any
4. **Real-time Features**: Test WebSocket connections if any

### **3. Monitor Performance**

1. **Cloudflare Analytics**: Check Pages dashboard for analytics
2. **Browser DevTools**: Check performance metrics
3. **API Response Times**: Monitor backend performance

### **4. Set Up Monitoring (Optional)**

1. **Cloudflare Analytics**: Built-in analytics in Pages dashboard
2. **Error Tracking**: Consider adding Sentry or similar
3. **Uptime Monitoring**: Use Cloudflare's monitoring tools

---

## **Summary Checklist**

After completing all steps, you should have:

- ✅ Project created on Cloudflare Pages
- ✅ GitHub repository connected
- ✅ Build settings configured correctly
- ✅ Environment variables set
- ✅ Site deployed and accessible at `your-project-name.pages.dev`
- ✅ Custom domain `labzero.io` connected
- ✅ Site accessible at `https://labzero.io`
- ✅ Auto-deploy enabled for continuous deployment
- ✅ All features working correctly

---

## **Useful Links**

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Vite Documentation**: https://vitejs.dev/
- **Vue.js Documentation**: https://vuejs.org/

---

## **Support**

If you encounter issues:

1. **Check Cloudflare Status**: https://www.cloudflarestatus.com/
2. **Cloudflare Community**: https://community.cloudflare.com/
3. **Review Build Logs**: Detailed error messages in deployment logs
4. **Check Browser Console**: For runtime errors

---

**Congratulations!** 🎉 Your Vue.js frontend is now deployed on Cloudflare Pages with your custom domain!

