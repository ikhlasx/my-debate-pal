# Debugging Vercel Serverless Function Crash (500 Error)

## Error: FUNCTION_INVOCATION_FAILED

This error means the serverless function is crashing when called. Here's how to fix it:

## Step 1: Check Vercel Function Logs

1. Go to **Vercel Dashboard** → Your Project
2. Click on the **failed deployment**
3. Go to **Functions** tab
4. Click on the function that's failing (usually `/api/index.py`)
5. **Check the logs** - you'll see the actual error message

Common errors you might see:
- `ModuleNotFoundError: No module named 'X'` - Missing dependency
- `ValueError: SUPABASE_URL must be set` - Missing environment variable
- `ImportError: cannot import name 'X'` - Import path issue

## Step 2: Verify Environment Variables

**CRITICAL**: These MUST be set in Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Verify you have:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-public-key-here
   ```
3. **Make sure**:
   - ☑ Selected for "Production" environment
   - ☑ No extra spaces or quotes
   - ☑ Values are the actual credentials (not placeholders)
4. **Redeploy** after adding/updating variables

## Step 3: Verify Dependencies

Check `api/requirements.txt` has all dependencies:

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic>=2.11.7,<3.0.0
python-multipart==0.0.6
websockets>=15.0
supabase>=2.27.0
mangum>=0.17.0
python-dotenv>=1.0.0
email-validator==2.1.0
httpx>=0.25.0
```

## Step 4: Check File Structure

Ensure these files exist:
- ✅ `api/index.py` - Serverless function entry point
- ✅ `api/requirements.txt` - Python dependencies
- ✅ `backend/main_supabase.py` - FastAPI app
- ✅ `backend/schemas.py` - Pydantic schemas
- ✅ `backend/analytics_supabase.py` - Analytics functions

## Step 5: Test Locally (Optional)

To test the serverless function locally before deploying:

```bash
# Install Vercel CLI
npm i -g vercel

# Test the function
cd api
vercel dev
```

## Common Fixes

### Fix 1: Missing Environment Variables
**Symptom**: Error about `SUPABASE_URL` or `SUPABASE_ANON_KEY`

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add the variables
3. **Redeploy** (important!)

### Fix 2: Missing Dependencies
**Symptom**: `ModuleNotFoundError` in logs

**Solution**:
1. Add missing package to `api/requirements.txt`
2. Commit and push
3. Vercel will automatically rebuild

### Fix 3: Import Errors
**Symptom**: `ImportError` or `cannot import name` in logs

**Solution**:
1. Check if all files exist in `backend/` directory
2. Verify import paths are correct
3. Check for circular imports

### Fix 4: Supabase Connection Issues
**Symptom**: Connection errors or "Invalid API key"

**Solution**:
1. Verify Supabase credentials are correct
2. Check Supabase dashboard - is project active?
3. Verify tables exist (run SQL migration)
4. Make sure you're using the **anon public** key (not service_role)

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] `SUPABASE_URL` is set in Vercel Environment Variables
- [ ] `SUPABASE_ANON_KEY` is set in Vercel Environment Variables
- [ ] Variables are set for "Production" environment
- [ ] Values are correct (not placeholders)
- [ ] App has been redeployed after setting variables
- [ ] `api/requirements.txt` has all dependencies
- [ ] `api/index.py` exists and is correct
- [ ] `backend/main_supabase.py` exists
- [ ] Supabase tables exist (check Supabase dashboard)
- [ ] SQL migration has been run in Supabase

## Getting More Information

If the error persists:

1. **Check Vercel Function Logs** (most important!)
   - Go to Deployment → Functions tab
   - Look for Python traceback
   - This will tell you exactly what's failing

2. **Test the root endpoint**:
   ```
   https://your-app.vercel.app/api/
   ```
   Should return JSON with status info

3. **Test a simple endpoint**:
   ```
   https://your-app.vercel.app/api/api/sessions
   ```
   (Note: `/api/api/` because vercel.json rewrites `/api/*` to `/api`)

4. **Check browser console** on your deployed app:
   - Open DevTools (F12)
   - Go to Network tab
   - Try to use the app
   - See what API calls are failing

## Next Steps

Once you check the Vercel Function Logs, you'll see the exact error. Common ones:

- **Missing env vars**: Add them in Vercel Dashboard
- **Missing dependencies**: Add to `api/requirements.txt`
- **Import errors**: Check file paths and imports
- **Supabase errors**: Verify credentials and tables
