# Vercel Production Setup Guide

## ✅ You DON'T Need to Run Backend Locally!

If your app is deployed on **Vercel** and your backend is a **Vercel serverless function**, you don't need to run `python main_supabase.py` locally. The backend runs automatically on Vercel.

## How It Works

### Architecture:
- **Frontend**: Deployed on Vercel (React/Vite)
- **Backend API**: Vercel serverless function (`api/index.py`)
- **Database**: Supabase (cloud-hosted)

### API Routes:
- Frontend calls: `/api/sessions`, `/api/analytics/weekly`, etc.
- Vercel routes `/api/*` to the serverless function
- Serverless function (`api/index.py`) handles the request using FastAPI
- FastAPI connects to Supabase using environment variables

## Required Setup (One-Time)

### 1. Environment Variables in Vercel

**CRITICAL**: Add these in Vercel Dashboard:

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
```

4. **IMPORTANT**: Select all three environments:
   - ☑ Production
   - ☑ Preview  
   - ☑ Development

5. Click **Save**

6. **Redeploy** your app (or push a new commit) for variables to take effect

### 2. Verify Supabase Setup

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Make sure you've run the SQL migration (`backend/supabase_migration.sql`)
3. Verify tables exist:
   - `users`
   - `debate_sessions`
   - `notifications`

### 3. Test Your Deployment

1. Visit your Vercel app: `https://your-app.vercel.app`
2. Open browser console (F12)
3. Check if API is accessible:

```javascript
fetch('/api/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Should return:
```json
{
  "message": "Debate Tracker API (Supabase)",
  "status": "running",
  "demo_user_id": "demo-user-12345"
}
```

## Troubleshooting "Could not save to database"

### If you see this warning:

1. **Check Vercel Environment Variables**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
   - Make sure they're set for Production environment
   - **Redeploy** after adding/updating variables

2. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click latest deployment
   - Go to "Functions" tab
   - Look for errors about Supabase connection

3. **Test API endpoint**:
   - Visit: `https://your-app.vercel.app/api/`
   - Should return JSON response
   - If 404, check `vercel.json` and `api/index.py` exist

4. **Check Browser Console**:
   - Open DevTools (F12) → Console tab
   - Look for detailed error messages
   - Check Network tab to see if `/api/sessions` requests are failing

## Common Issues

### Issue: API returns 404

**Solution:**
- Check `vercel.json` has `/api/:path*` rewrite to `/api`
- Verify `api/index.py` exists
- Check `api/requirements.txt` has all dependencies (especially `mangum`)

### Issue: API returns 500

**Solution:**
- Check Vercel Function Logs for detailed errors
- Verify Supabase environment variables are set correctly
- Check Supabase tables exist (run SQL migration)

### Issue: "Invalid API key" or 401 error

**Solution:**
- Verify `SUPABASE_ANON_KEY` in Vercel is the **anon public** key (not service_role)
- Make sure no extra spaces or quotes in environment variables
- Redeploy after updating environment variables

## Local Development (Optional)

**Only needed if you want to test locally:**

1. Create `backend/.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

2. Create root `.env`:
```env
VITE_API_URL=http://localhost:8000
```

3. Run backend locally:
```bash
cd backend
python main_supabase.py
```

4. Run frontend:
```bash
npm run dev
```

**For production on Vercel, skip steps 1-4 above!**

## Summary

✅ **Production on Vercel**: Just set environment variables in Vercel Dashboard  
✅ **No local backend needed**: Backend runs as serverless function  
✅ **Data syncs automatically**: Both partners see same data from Supabase  
✅ **No data reset**: Switching demo mode on/off doesn't clear data
