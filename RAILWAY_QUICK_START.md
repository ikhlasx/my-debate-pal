# 🚀 Quick Start: Deploy to Railway

## 1️⃣ Commit Changes (1 minute)

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

## 2️⃣ Deploy to Railway (2 minutes)

1. Go to **[railway.app](https://railway.app)**
2. Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select **`my-debate-pal`**
5. Click **"Deploy Now"**

## 3️⃣ Add Environment Variables (1 minute)

In Railway Dashboard → Your Project → Variables tab:

```env
SUPABASE_URL=https://kewecsjrdoyecujcmxuf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtld2Vjc2pyZG95ZWN1amNteHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMDk4NjgsImV4cCI6MjA4MzU4NTg2OH0.mE-AZSwJFTNNHGw1LpM3XeHYe93zAmXsr7vZjHJwEY4
```

## 4️⃣ Generate Domain (30 seconds)

Railway Dashboard → Settings → Networking → **Generate Domain**

Your URL will be: `https://my-debate-pal-production.up.railway.app`

## 5️⃣ Update Frontend (1 minute)

**In Vercel:**
1. Go to your Vercel project
2. Settings → Environment Variables
3. Update `VITE_API_URL` to your Railway URL
4. Redeploy

**Or update `.env` locally:**
```env
VITE_API_URL=https://my-debate-pal-production.up.railway.app
```

## ✅ Test It!

Visit: `https://my-debate-pal-production.up.railway.app/health`

Should return:
```json
{
  "status": "healthy",
  "service": "debate-pal-backend",
  "timestamp": "2026-01-19T10:11:30.123456"
}
```

---

## 🎉 Done!

**Total time:** ~5 minutes  
**Benefits:**
- ⚡ 10x faster deploys
- 🚀 No cold starts
- 💰 Free (within $5/month credit)
- 📊 Beautiful monitoring dashboard

---

**Need detailed instructions?** See [`RAILWAY_DEPLOYMENT.md`](./RAILWAY_DEPLOYMENT.md)
