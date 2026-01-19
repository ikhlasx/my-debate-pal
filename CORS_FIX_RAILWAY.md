# CORS Fix for Railway Backend

## Issue
CORS error when accessing Railway backend from Vercel frontend:
```
Access to fetch at 'https://web-production-32e8d.up.railway.app/sessions' 
from origin 'https://my-debate-pal.vercel.app' 
has been blocked by CORS policy
```

## Solution

### 1. **Redeploy Railway Backend**

The CORS configuration has been updated in `backend/main_supabase.py`. You need to redeploy your Railway backend:

1. **Push your changes to Git**:
   ```bash
   git add backend/main_supabase.py
   git commit -m "Fix CORS configuration for Vercel frontend"
   git push
   ```

2. **Railway will automatically redeploy** if you have auto-deploy enabled, OR manually trigger a redeploy in Railway dashboard.

### 2. **Verify CORS Configuration**

The updated CORS configuration includes:
- ✅ `https://my-debate-pal.vercel.app` in allowed origins
- ✅ Regex pattern for all Vercel subdomains: `https://.*\.(vercel\.app|railway\.app|vercel\.sh)`
- ✅ All necessary HTTP methods (GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD)
- ✅ Credentials allowed
- ✅ All headers allowed

### 3. **Test CORS**

After redeploying, test with:

```bash
# Test from command line
curl -H "Origin: https://my-debate-pal.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://web-production-32e8d.up.railway.app/sessions \
     -v
```

You should see headers like:
```
Access-Control-Allow-Origin: https://my-debate-pal.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD
Access-Control-Allow-Credentials: true
```

### 4. **Alternative: Temporary CORS Fix (Development Only)**

If you need a quick fix for testing (NOT recommended for production), you can temporarily allow all origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Only for testing!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**⚠️ WARNING**: Never use `allow_origins=["*"]` in production! It's a security risk.

### 5. **Check Railway Logs**

If CORS still doesn't work after redeploy:

1. Go to Railway Dashboard → Your Service → Deployments
2. Check the latest deployment logs
3. Verify the code was deployed correctly
4. Check if there are any errors during startup

### 6. **Verify Environment Variables**

Make sure Railway has the correct environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

These are needed for the backend to start properly.

## Current CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://my-debate-pal.vercel.app",
        "https://my-debate-pal.onrender.com",
        "https://my-debate-pal-production.up.railway.app",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
    ],
    allow_origin_regex=r"https://.*\.(vercel\.app|railway\.app|vercel\.sh)",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)
```

## Still Having Issues?

1. **Clear browser cache** - Old CORS responses might be cached
2. **Check browser console** - Look for detailed CORS error messages
3. **Test with curl** - Use the curl command above to test CORS
4. **Check Railway deployment** - Make sure the latest code is deployed
5. **Verify URL** - Make sure `VITE_API_URL` in Vercel points to the correct Railway URL

## Quick Checklist

- [ ] Code pushed to Git
- [ ] Railway backend redeployed
- [ ] CORS headers visible in response (test with curl)
- [ ] Browser cache cleared
- [ ] Test in incognito/private window
- [ ] Check Railway logs for errors
