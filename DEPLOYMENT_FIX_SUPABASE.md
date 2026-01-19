# Supabase Deployment Fix Guide

## Issues Fixed

### 1. **Double Slash URL Issue** ✅
**Problem**: URLs like `https://web-production-32e8d.up.railway.app//sessions` (double slash)
**Fix**: 
- Added URL normalization in `src/lib/api.ts` to handle trailing slashes
- Properly constructs URLs whether using relative (`/api`) or absolute URLs

### 2. **Authentication Required Error** ✅
**Problem**: All endpoints required authentication, causing 401 errors
**Fix**:
- Made authentication optional in `backend/main_supabase.py`
- Falls back to demo user if no token is provided
- Allows app to work without full auth setup

### 3. **Supabase Realtime Connection Issues** ✅
**Problem**: Realtime connection failing with missing credentials
**Fix**:
- Added graceful handling for missing Supabase credentials
- Prevents crashes when credentials are not configured
- Better error messages

### 4. **Better Error Messages** ✅
**Problem**: Generic error messages made debugging difficult
**Fix**:
- Added detailed error messages with troubleshooting steps
- Context-specific help for 404, 401, and 500 errors
- Better network error handling

## Deployment Configuration

### For Vercel (Recommended)

1. **Environment Variables in Vercel Dashboard**:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

2. **DO NOT set `VITE_API_URL`** - The app automatically uses `/api` for Vercel serverless functions

3. **Verify**:
   - Frontend deployed on Vercel
   - Backend runs as serverless functions via `api/index.py`
   - All API calls go to `/api/*` which routes to your FastAPI backend

### For Railway Backend + Vercel Frontend

1. **Vercel Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=https://your-app.up.railway.app
   ```

2. **Railway Environment Variables**:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

3. **CORS Configuration**:
   - Make sure Railway backend CORS allows your Vercel frontend domain
   - Check `backend/main_supabase.py` CORS settings

### For Railway (Both Frontend + Backend)

1. **Railway Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=https://your-backend.up.railway.app
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

## Common Issues and Solutions

### Issue: 404 Not Found on `/sessions`

**Causes**:
1. Backend not running
2. Wrong API URL configuration
3. CORS blocking requests

**Solutions**:
1. **Check API URL**:
   - Open browser console
   - Look for the actual URL being called
   - Verify it matches your backend URL

2. **For Vercel**: 
   - Don't set `VITE_API_URL` (uses `/api` automatically)
   - Check that `api/index.py` exists and is properly configured

3. **For Railway**:
   - Set `VITE_API_URL` to your Railway backend URL (no trailing slash!)
   - Example: `https://web-production-32e8d.up.railway.app` (NOT `https://...railway.app/`)

4. **Check Backend Health**:
   - Visit `https://your-backend-url/health` or `https://your-backend-url/`
   - Should return JSON with status

### Issue: Supabase Realtime Not Connecting

**Causes**:
1. Missing Supabase credentials
2. Realtime not enabled in Supabase
3. Network/firewall blocking WebSocket connections

**Solutions**:
1. **Verify Credentials**:
   - Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel
   - Must use `VITE_` prefix for frontend variables

2. **Enable Realtime in Supabase**:
   - Go to Supabase Dashboard → Database → Replication
   - Enable replication for `debate_sessions` and `notifications` tables
   - Or run the SQL from `backend/enable_realtime.sql`

3. **Check Browser Console**:
   - Look for Realtime connection errors
   - Verify credentials are not placeholders

### Issue: Authentication Errors (401)

**Note**: Authentication is now optional! The app will work in demo mode without auth.

**If you want full authentication**:
1. Set up Supabase Auth
2. Implement sign-in/sign-up in your frontend
3. The app will automatically use authenticated user instead of demo user

### Issue: Database Errors (500)

**Causes**:
1. Supabase credentials not set in backend
2. Database tables don't exist
3. Wrong Supabase project

**Solutions**:
1. **Verify Backend Environment Variables**:
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` must be set
   - Check Railway/Vercel environment variables

2. **Run Database Migration**:
   - Go to Supabase Dashboard → SQL Editor
   - Run the SQL from `backend/supabase_migration.sql`
   - This creates all required tables

3. **Check Backend Logs**:
   - Railway: Check deployment logs
   - Vercel: Check Function Logs in dashboard

## Testing Your Deployment

1. **Test Backend Health**:
   ```bash
   curl https://your-backend-url/health
   ```
   Should return: `{"status": "healthy", ...}`

2. **Test API Endpoint**:
   ```bash
   curl https://your-backend-url/sessions
   ```
   Should return: `[]` (empty array) or session data

3. **Test Frontend**:
   - Open your deployed frontend
   - Open browser console (F12)
   - Check for errors
   - Try creating a session
   - Check if data saves

## Quick Checklist

- [ ] Supabase credentials set in Vercel/Railway
- [ ] Database tables created (run migration SQL)
- [ ] Realtime enabled in Supabase (if using real-time features)
- [ ] API URL configured correctly:
  - Vercel: Don't set `VITE_API_URL` (uses `/api`)
  - Railway: Set `VITE_API_URL` to Railway backend URL
- [ ] CORS configured to allow your frontend domain
- [ ] Backend health check returns success
- [ ] Frontend can make API calls (check browser console)

## Need More Help?

1. Check browser console for detailed error messages
2. Check backend logs (Railway/Vercel Function Logs)
3. Verify all environment variables are set correctly
4. Test backend endpoints directly with curl/Postman
5. Check Supabase Dashboard for database and auth status
