# Vercel Deployment Guide - Supabase Backend

This guide will help you deploy the Debate Tracker application with Supabase backend to Vercel.

## Prerequisites

1. ✅ Supabase project created and configured
2. ✅ SQL migration run in Supabase
3. ✅ Environment variables ready
4. ✅ GitHub repository (for Vercel integration)

## Step 1: Prepare Environment Variables

You'll need to set these environment variables in Vercel:

### Required Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon public key

### Frontend Variables (Optional)

- `VITE_API_URL` - Auto-set to `/api` for same-origin requests
- `FRONTEND_URL` - Your Vercel deployment URL (for CORS)

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "Add New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

5. **Add Environment Variables:**
   - Go to "Environment Variables" section
   - Add the following:
     ```
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - Select "Production", "Preview", and "Development"
   - Click "Save"

6. **Deploy!**
   - Click "Deploy"
   - Wait for the build to complete

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

## Step 3: Update Frontend API URL

After deployment, your API will be available at:
- Production: `https://your-app.vercel.app/api`
- Preview: `https://your-app-xyz.vercel.app/api`

The frontend should automatically use `/api` for same-origin requests, but you can also set:

```bash
# In Vercel Environment Variables
VITE_API_URL=/api
```

Or for cross-origin deployments:
```bash
VITE_API_URL=https://your-app.vercel.app/api
```

## Step 4: Initialize Demo User

After deployment, initialize the demo user by calling:

```bash
curl https://your-app.vercel.app/api/
```

This will trigger the demo user creation automatically. Alternatively, you can run the init script locally pointing to your Supabase instance.

## Important Notes

### WebSocket Limitations

⚠️ **Note**: Vercel serverless functions have limitations with WebSocket connections. The WebSocket endpoint (`/ws`) may not work in serverless environments.

**Workarounds:**
1. Use polling for real-time updates
2. Use Supabase Realtime (if needed)
3. Consider deploying backend separately on Railway/Render for WebSocket support

### Function Timeout

- Vercel serverless functions have a 10-second timeout (Hobby plan)
- Pro plan has 60-second timeout
- For long-running operations, consider optimizing or using background jobs

### Cold Starts

- First request after inactivity may be slower (cold start)
- Subsequent requests are fast
- Consider using Vercel Pro for better performance

## Architecture

```
┌─────────────────┐
│   Vercel CDN    │  ← Frontend (React/Vite)
└────────┬────────┘
         │
         ├── /api/* → Python Serverless Function
         │              └── FastAPI + Supabase
         │
         └── /* → index.html (SPA routing)
```

## Environment Variables Reference

### Production
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=/api
FRONTEND_URL=https://your-app.vercel.app
```

### Development
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

### Error: "Module not found"
- ✅ Ensure `api/index.py` exists
- ✅ Check that `backend/` directory is included in deployment
- ✅ Verify Python runtime in `vercel.json`

### Error: "Invalid API key"
- ✅ Check environment variables are set correctly in Vercel
- ✅ Verify no extra spaces or quotes
- ✅ Ensure variables are set for all environments (Production, Preview, Development)

### Error: "CORS error"
- ✅ Update CORS origins in `main_supabase.py` with your Vercel URL
- ✅ Check `FRONTEND_URL` environment variable
- ✅ Verify API endpoint is `/api/*`

### Cold Start Timeout
- ✅ Optimize imports (lazy load)
- ✅ Reduce dependencies
- ✅ Consider Vercel Pro plan

### Database Connection Issues
- ✅ Verify Supabase project is active
- ✅ Check Row Level Security policies
- ✅ Ensure demo user can be created

## Testing Deployment

1. **Check API Health:**
   ```bash
   curl https://your-app.vercel.app/api/
   ```
   Should return:
   ```json
   {
     "message": "Debate Tracker API (Supabase)",
     "status": "running",
     "demo_user_id": "demo-user-12345"
   }
   ```

2. **Test Session Creation:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/sessions \
     -H "Content-Type: application/json" \
     -d '{"partner":"husband","start_time":"2024-01-01T10:00:00Z"}'
   ```

3. **Check Frontend:**
   - Visit `https://your-app.vercel.app`
   - Open browser console
   - Check for API connection errors

## Deployment Checklist

- [ ] Supabase project created
- [ ] SQL migration executed
- [ ] Environment variables set in Vercel
- [ ] Frontend builds successfully
- [ ] API endpoint responds correctly
- [ ] CORS configured properly
- [ ] Demo user initialized
- [ ] Test session creation works
- [ ] Frontend can connect to API

## Cost Considerations

### Vercel Hobby (Free)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions included
- ⚠️ 10-second function timeout
- ⚠️ Cold starts possible

### Vercel Pro ($20/month)
- ✅ 1TB bandwidth
- ✅ 60-second function timeout
- ✅ Better performance
- ✅ Team collaboration

### Supabase Free Tier
- ✅ 500MB database
- ✅ 2GB bandwidth
- ✅ Unlimited API requests
- ✅ Perfect for demo/development

## Next Steps

1. Set up custom domain (optional)
2. Configure analytics (optional)
3. Set up monitoring (optional)
4. Enable Supabase backups
5. Configure environment-specific variables

---

**Status**: ✅ Ready for deployment
**Backend**: Supabase (cloud-hosted)
**Frontend**: Vercel (serverless)
**Database**: Supabase PostgreSQL
