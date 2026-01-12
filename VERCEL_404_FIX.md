# Fixing 404 Error on /api Endpoint

## Issue

Getting 404 on `https://your-app.vercel.app/api/`

## Root Cause

When Vercel routes `/api/*` to `api/index.py`, it **strips the `/api` prefix** before passing the path to Mangum. So:
- Request: `/api/` → Mangum receives: `/`
- Request: `/api/sessions` → Mangum receives: `/sessions`

But your FastAPI routes are defined with `/api` prefix:
- `@app.get("/api/sessions")` 
- `@app.get("/api/notifications")`

This causes a mismatch → 404 errors.

## Solution

You have two options:

### Option 1: Remove `/api` prefix from FastAPI routes (Recommended)

Remove the `/api` prefix from all FastAPI routes in `backend/main_supabase.py`:

**Change:**
```python
@app.get("/api/sessions")
@app.post("/api/sessions")
```

**To:**
```python
@app.get("/sessions")
@app.post("/sessions")
```

Do this for ALL routes:
- `/api/sessions` → `/sessions`
- `/api/notifications` → `/notifications`
- `/api/analytics/*` → `/analytics/*`

**Keep the root endpoint as:**
```python
@app.get("/")  # This handles /api/ → Mangum receives /
```

### Option 2: Configure Mangum to preserve the path (Not Recommended)

This is more complex and not recommended for Vercel.

## Quick Fix Checklist

1. ✅ Update all FastAPI route decorators in `backend/main_supabase.py`:
   - Remove `/api` prefix from all routes
   - Keep only `/` for root endpoint

2. ✅ Update error handler routes in `api/index.py`:
   - Change `@error_app.get("/api/{path:path}")` → `@error_app.get("/{path:path}")`

3. ✅ Test:
   - `/api/` should return health check
   - `/api/sessions` should return sessions list

## Verification

After deployment:
1. Visit `https://your-app.vercel.app/api/` → Should return JSON health check
2. Visit `https://your-app.vercel.app/api/sessions` → Should return sessions (or empty array)
