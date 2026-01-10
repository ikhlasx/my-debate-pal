# Troubleshooting Database Connection Issues

If you see the warning "Could not save to database. Data may not sync across devices", follow these steps to diagnose and fix the issue.

## Quick Checklist

1. ✅ **Is demo mode OFF?** (Check the toggle in the header)
2. ✅ **Are Supabase credentials configured in Vercel?** (For production)
3. ✅ **Is the API accessible?** (Check if `/api` routes work on your Vercel deployment)

## Important: Local vs Production Setup

### 🚀 **If You're Deployed on Vercel (Production)**
You **DON'T** need to run the backend locally! The backend runs as a Vercel serverless function.
- Backend API is accessible via `/api/*` routes on your Vercel domain
- Supabase credentials should be in Vercel environment variables
- Frontend automatically uses relative URLs (`/api`) in production

### 💻 **Local Development Only**
Only run the backend locally if you're developing/testing on your machine:
```bash
cd backend
python main_supabase.py
```

## Step-by-Step Troubleshooting

### 1. Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab. Look for error messages that will tell you exactly what's wrong:

- **Network error**: API endpoint not accessible (check Vercel deployment)
- **401/403 error**: Supabase credentials issue in Vercel environment variables
- **500 error**: Backend serverless function error (check Vercel function logs)
- **404 error**: API route not found (check vercel.json configuration)

### 2. For Production (Vercel Deployment)

**Check if API endpoint is accessible:**

Open in browser: `https://your-app.vercel.app/api/`

You should see:
```json
{
  "message": "Debate Tracker API (Supabase)",
  "status": "running",
  "demo_user_id": "demo-user-12345"
}
```

**If you get 404:**
- Check `vercel.json` configuration
- Verify `api/index.py` exists
- Check Vercel deployment logs

### 3. Check Supabase Configuration

**🚀 For Production (Vercel Deployment):**
1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add these variables:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. **IMPORTANT**: Select "Production", "Preview", and "Development" environments
4. **IMPORTANT**: Redeploy your app after adding variables (or they won't take effect)

**💻 For Local Development Only:**
Create `backend/.env` file:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Get your Supabase credentials:**
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings** > **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY` (NOT service_role key!)

### 4. Check Frontend API URL

**🚀 For Production (Vercel):**
- ✅ **NO configuration needed!**
- Frontend automatically uses `/api` (relative URL) when deployed
- The `api/index.py` serverless function handles all `/api/*` routes
- **Don't set `VITE_API_URL` in Vercel** - it's not needed

**💻 For Local Development:**
Create root `.env` file (only for local testing):
```env
VITE_API_URL=http://localhost:8000
```

### 5. Test API Connection

**For Production (Vercel):**
Open browser console on your deployed app and run:
```javascript
fetch('/api/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**For Local Development:**
```javascript
fetch('http://localhost:8000/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Test creating a session (Production):**
```javascript
fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    partner: 'husband',
    start_time: new Date().toISOString(),
    duration: 60
  })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### 6. Common Issues and Solutions

#### Issue: "Network error: Cannot connect to API"

**For Production (Vercel):**
- Check Vercel deployment logs for serverless function errors
- Verify `api/index.py` exists and is configured correctly
- Check `vercel.json` has correct API route rewrites
- Ensure Supabase environment variables are set in Vercel

**For Local Development:**
- Make sure backend is running: `python main_supabase.py`
- Check if port 8000 is available
- Verify `VITE_API_URL` in root `.env` matches backend URL

#### Issue: "API error: 401 Unauthorized" or "Invalid API key"

**For Production (Vercel):**
- Check `SUPABASE_ANON_KEY` in **Vercel Environment Variables** (not backend/.env)
- Make sure you're using the **anon public** key, not service_role
- Verify the key is correct in Supabase dashboard
- **Important**: Redeploy after updating environment variables

**For Local Development:**
- Check `SUPABASE_ANON_KEY` in `backend/.env`
- Make sure you're using the **anon public** key, not service_role
- Verify the key is correct in Supabase dashboard

#### Issue: "API error: 500 Internal Server Error"

**For Production (Vercel):**
- Check **Vercel Function Logs** (Dashboard → Your Project → Deployments → Click deployment → Functions tab)
- Verify Supabase tables exist (run SQL migration in Supabase dashboard)
- Check if Supabase environment variables are set correctly in Vercel
- Verify `api/index.py` and `api/requirements.txt` are configured correctly

**For Local Development:**
- Check backend console for error messages
- Verify Supabase tables exist (run SQL migration)
- Check if demo user was created (should see in backend logs)

#### Issue: CORS Error

**Solution:**
- Make sure backend CORS includes your frontend URL
- For local dev, backend should allow `http://localhost:8080` or `http://localhost:5173`
- Check `backend/main_supabase.py` CORS configuration

#### Issue: "Failed to load sessions from Supabase API"

**For Production (Vercel):**
- Check browser Network tab to see the actual request/response
- Verify `/api/sessions` endpoint is accessible (visit `https://your-app.vercel.app/api/`)
- Check Vercel Function Logs for errors
- Verify Supabase environment variables are set in Vercel

**For Local Development:**
- Backend might not be running (`python main_supabase.py`)
- Check browser Network tab to see the actual request/response
- Verify Supabase connection in backend logs

### 7. Verify Supabase Tables

**Check if tables exist:**

1. Go to Supabase dashboard
2. Navigate to Table Editor
3. You should see:
   - `users` table
   - `debate_sessions` table
   - `notifications` table

**If tables don't exist:**

Run the SQL migration from `backend/supabase_migration.sql` in Supabase SQL Editor.

### 8. Check Backend Logs

**For Production (Vercel):**
- Go to Vercel Dashboard → Your Project → Deployments
- Click on the latest deployment
- Go to "Functions" tab to see serverless function logs
- Look for errors about Supabase connection

**For Local Development:**
When you start the backend, you should see:
```
[OK] Demo user created: demo-user-12345
INFO:     Application startup complete.
```

If you see errors about Supabase:
- Check your `backend/.env` file (for local dev only)
- Verify credentials are correct
- Make sure no extra spaces or quotes around values

**For Production:**
- Check Vercel Environment Variables (Dashboard → Settings → Environment Variables)
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Redeploy after adding/updating variables

### 9. For Production/Vercel Deployment

**✅ Setup Checklist:**

1. **Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `SUPABASE_URL` = Your Supabase project URL
     - `SUPABASE_ANON_KEY` = Your Supabase anon public key
   - **Important**: Set for "Production", "Preview", and "Development" if needed
   - Redeploy after adding variables

2. **Verify API Function:**
   - Ensure `api/index.py` exists
   - Ensure `api/requirements.txt` has all dependencies
   - Check `vercel.json` has API route rewrites

3. **Verify API endpoint works:**
   - Visit: `https://your-app.vercel.app/api/`
   - Should return: `{"message": "Debate Tracker API (Supabase)", ...}`
   - If 404, check Vercel function logs

4. **Frontend Configuration:**
   - No `VITE_API_URL` needed in production (uses `/api` automatically)
   - Frontend calls `/api/sessions` which routes to serverless function
   - Check browser Network tab to see if requests go to `/api/*`

## Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Check backend console** for server-side errors
3. **Check Network tab** in browser DevTools to see the actual HTTP request/response
4. **Verify all environment variables** are set correctly
5. **Test API directly** using curl or Postman

## Error Messages Explained

- **"Network error"**: 
  - Production: API endpoint not accessible (check Vercel deployment, verify `/api` routes work)
  - Local: Backend not running (`python main_supabase.py`)
- **"API error: 401"**: Supabase credentials wrong (check Vercel env vars for production, `backend/.env` for local)
- **"API error: 404"**: Endpoint doesn't exist (check `vercel.json` config, verify `api/index.py` exists)
- **"API error: 500"**: 
  - Production: Backend serverless function error (check Vercel Function Logs)
  - Local: Backend server error (check backend console)
- **"CORS error"**: 
  - Production: Usually not an issue (same origin with `/api` routes)
  - Local: Backend CORS not configured for your frontend URL

## Quick Fix Commands

```bash
# Start backend (from backend directory)
cd backend
python main_supabase.py

# Check if backend is running
curl http://localhost:8000/

# Test API endpoint
curl -X POST http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"partner":"husband","start_time":"2024-01-01T00:00:00Z","duration":60}'
```
