# 🚀 Railway Deployment Guide

Deploy your Debate Pal backend to Railway in minutes! Railway offers faster deployment, better performance, and a more intuitive interface than Render.

## Why Railway?

✅ **Faster deploys** - Build and deploy in seconds, not minutes  
✅ **Better performance** - Global CDN and edge caching  
✅ **Automatic HTTPS** - SSL certificates included  
✅ **Simple pricing** - Pay for what you use, $5 free credit monthly  
✅ **Great DX** - Beautiful dashboard and CLI  

---

## 📋 Prerequisites

1. **GitHub Account** - Your code should be on GitHub
2. **Railway Account** - Sign up at [railway.app](https://railway.app) (free, no credit card needed for trial)
3. **Supabase Project** - You should already have this set up

---

## 🎯 Step 1: Prepare Your Repository

Your repository is already configured! We've added:
- ✅ `railway.toml` - Railway configuration
- ✅ `Procfile` - Process definition
- ✅ `nixpacks.toml` - Build configuration
- ✅ `/health` endpoint in your FastAPI app

Commit and push these changes:

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

---

## 🚂 Step 2: Deploy to Railway

### Option A: Deploy via Web Dashboard (Recommended)

1. **Go to Railway**: Visit [railway.app](https://railway.app) and sign in with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `my-debate-pal` repository
   - Click "Deploy Now"

3. **Railway will automatically**:
   - Detect it's a Python project
   - Install dependencies from `backend/requirements.txt`
   - Start your app with the command in `Procfile`

### Option B: Deploy via CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

---

## ⚙️ Step 3: Configure Environment Variables

After deployment, add your Supabase credentials:

1. **In Railway Dashboard**:
   - Go to your project
   - Click on the service (it will be named after your repo)
   - Go to the "Variables" tab
   - Click "New Variable"

2. **Add these variables**:

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Get Supabase credentials**:
   - Go to [app.supabase.com](https://app.supabase.com)
   - Select your project
   - Go to Settings → API
   - Copy the **Project URL** and **anon/public key**

4. **Save** - Railway will automatically redeploy with the new variables

---

## 🌐 Step 4: Get Your Railway URL

1. In Railway Dashboard, go to your service
2. Click the "Settings" tab
3. Scroll to "Networking"
4. Click "Generate Domain"
5. Your backend will be available at: `https://your-app.up.railway.app`

**Test it**: Open `https://your-app.up.railway.app/health` in your browser. You should see:
```json
{
  "status": "healthy",
  "service": "debate-pal-backend",
  "timestamp": "2026-01-19T10:11:30.123456"
}
```

---

## 🔗 Step 5: Update Your Frontend

Update your frontend environment variables to point to Railway:

### In Vercel Dashboard:
1. Go to your Vercel project
2. Settings → Environment Variables
3. Update `VITE_API_URL`:
   ```
   VITE_API_URL=https://your-app.up.railway.app
   ```
4. Save and redeploy

### Or update `.env` locally:
```env
VITE_API_URL=https://your-app.up.railway.app
```

---

## 📊 Step 6: Monitor Your Deployment

Railway provides excellent monitoring:

1. **View Logs**:
   - In Railway Dashboard, click on your service
   - Go to "Deployments" tab
   - Click on the latest deployment
   - View real-time logs

2. **Check Metrics**:
   - Go to "Metrics" tab
   - See CPU, Memory, Network usage
   - Monitor response times

3. **Set up Alerts** (optional):
   - Go to "Settings"
   - Configure health check notifications

---

## 🎉 You're Done!

Your backend is now deployed on Railway! Here's what you get:

✅ Automatic deployments on every git push  
✅ Built-in HTTPS  
✅ Global CDN  
✅ Automatic health checks  
✅ Easy rollbacks  
✅ $5/month free tier  

---

## 🔧 Troubleshooting

### Deployment fails during build
**Issue**: Dependencies not installing  
**Solution**: Check that `backend/requirements.txt` exists and is valid

### App crashes on startup
**Issue**: Missing environment variables  
**Solution**: Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Railway Variables tab

### Frontend can't connect to backend
**Issue**: CORS error or network issue  
**Solution**: 
1. Verify the Railway URL is correct in your frontend env vars
2. Check that your Railway domain is in the CORS allowed origins (already configured!)
3. Ensure the Railway service is running (check Deployments tab)

### Health check fails
**Issue**: `/health` endpoint not responding  
**Solution**: Check Railway logs for startup errors. Ensure `uvicorn` is starting correctly.

---

## 🚀 Advanced: Custom Domain (Optional)

Want to use your own domain like `api.yourdomain.com`?

1. In Railway Dashboard → Settings → Networking
2. Click "Custom Domain"
3. Enter your domain
4. Add the provided CNAME record to your DNS
5. Wait for DNS propagation (usually 5-10 minutes)

---

## 💰 Pricing

Railway offers generous free tier:
- **$5 free credit per month**
- Pay only for what you use after that
- Typical usage for this app: ~$2-3/month (well within free tier!)

Compare with Render:
- Render Free Tier: Spins down after inactivity (cold starts!)
- Railway: Always on, instant response

---

## 📚 Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway) - Great community support
- [Railway Status](https://status.railway.app) - Check service status

---

## 🎯 Next Steps

1. ✅ Deploy to Railway (you're here!)
2. Set up automatic deployments (already configured via GitHub!)
3. Monitor your app performance
4. Celebrate! 🎉

Need help? Check the Railway Discord or create an issue in your repository.
