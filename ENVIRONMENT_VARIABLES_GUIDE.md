# Environment Variables Guide

## Important: You Need BOTH Sets of Variables

Your application needs **two separate sets** of environment variables:

### 1. Frontend Variables (React/Vite)

These variables are used by the **frontend** (React app) and **MUST** have the `VITE_` prefix:

| Variable Name | Description | Where to Set |
|--------------|-------------|--------------|
| `VITE_SUPABASE_URL` | Supabase project URL for frontend Realtime | Vercel Environment Variables |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key for frontend | Vercel Environment Variables |

**Why `VITE_` prefix?** Vite only exposes environment variables with the `VITE_` prefix to client-side code for security reasons.

**Code location:** `src/lib/supabaseClient.ts` reads these:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
```

### 2. Backend Variables (Python/FastAPI)

These variables are used by the **backend** (Python serverless function) and **DO NOT** have the `VITE_` prefix:

| Variable Name | Description | Where to Set |
|--------------|-------------|--------------|
| `SUPABASE_URL` | Supabase project URL for backend API | Vercel Environment Variables |
| `SUPABASE_ANON_KEY` | Supabase anonymous key for backend | Vercel Environment Variables |

**Code location:** `backend/main_supabase.py` reads these:
```python
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
```

## Complete Vercel Environment Variables Setup

In **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**, add **ALL FOUR** variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** Both frontend and backend use the same Supabase URL and key, but they need to be set with different variable names because:
- Frontend uses `VITE_` prefix (required by Vite)
- Backend uses no prefix (standard Python environment variable)

## Getting Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use for both `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public** key → Use for both `VITE_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`

## Common Mistakes

❌ **Mistake 1:** Only setting `SUPABASE_URL` (without `VITE_` prefix)
- **Result:** Frontend error: `supabaseUrl is required`
- **Fix:** Add `VITE_SUPABASE_URL` (with `VITE_` prefix)

❌ **Mistake 2:** Only setting `VITE_SUPABASE_URL` (with `VITE_` prefix)
- **Result:** Backend can't connect to Supabase
- **Fix:** Add `SUPABASE_URL` (without `VITE_` prefix)

✅ **Correct:** Set **BOTH** `VITE_SUPABASE_URL` and `SUPABASE_URL` (and their keys)

## After Adding Variables

1. **Redeploy your Vercel project** after adding environment variables
2. Environment variables only take effect after redeployment

## Verification

After redeployment, check:

1. **Frontend:** Open browser console, you should NOT see `supabaseUrl is required` error
2. **Backend:** Visit `https://your-app.vercel.app/api/` - should return API status (not 404)
