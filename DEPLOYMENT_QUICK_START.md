# Quick Deployment Guide - Vercel + Supabase

## 🚀 Deploy in 5 Minutes

### Prerequisites
- ✅ Supabase project created
- ✅ SQL migration run
- ✅ GitHub repository ready

### Step 1: Set Up Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel auto-detects Vite configuration

### Step 2: Add Environment Variables

In Vercel dashboard → Your Project → Settings → Environment Variables:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Set for all environments (Production, Preview, Development)

### Step 3: Deploy!

Click "Deploy" and wait ~2-3 minutes.

### Step 4: Initialize Demo User

After deployment, visit:
```
https://your-app.vercel.app/api/
```

This will automatically create the demo user.

### Step 5: Test

1. **Check API Health:**
   ```bash
   curl https://your-app.vercel.app/api/
   ```

2. **Test Frontend:**
   - Visit `https://your-app.vercel.app`
   - Should load the Debate Tracker app
   - API calls go to `/api/*`

## 📋 Configuration Files

- `vercel.json` - Vercel deployment config
- `api/index.py` - Serverless function handler
- `api/requirements.txt` - Python dependencies
- `backend/.env` - Local development only (not deployed)

## ⚠️ Important Notes

### WebSocket Limitation
Vercel serverless functions don't support WebSockets. The `/ws` endpoint won't work. Real-time features will need alternative solutions:
- Use polling
- Use Supabase Realtime
- Deploy backend separately (Railway, Render, etc.)

### Function Timeout
- Free tier: 10 seconds
- Pro tier: 60 seconds
- Optimize slow endpoints if needed

### Cold Starts
First request after inactivity may be slower (~1-2 seconds). Subsequent requests are fast.

## 🔧 Troubleshooting

### Build Fails
- Check `vercel.json` syntax
- Verify Python runtime version
- Check build logs in Vercel dashboard

### API Not Working
- Verify environment variables are set
- Check function logs in Vercel dashboard
- Test API endpoint directly: `/api/`

### CORS Errors
- Update CORS origins in `backend/main_supabase.py`
- Add your Vercel URL to allowed origins

## 📚 Full Documentation

- **Detailed Guide**: `VERCEL_DEPLOYMENT_SUPABASE.md`
- **Supabase Setup**: `backend/SUPABASE_SETUP.md`
- **Quick Start**: `backend/QUICK_START_SUPABASE.md`

---

**Status**: ✅ Ready for deployment
**Backend**: Supabase (cloud)
**Frontend**: Vercel (serverless)
**Database**: Supabase PostgreSQL
