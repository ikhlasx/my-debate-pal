# Supabase Setup for Real User Mode

This guide explains how to configure the application to use Supabase for real user data storage. When demo mode is **OFF**, all data is stored in Supabase, allowing both husband and wife to access the same shared data from any device.

## Why Supabase for Real Users?

- **Shared Database**: Both partners see the same data in real-time
- **Cross-Device Sync**: Access data from any device (phone, tablet, computer)
- **Cloud Storage**: Data is stored securely in the cloud, not just locally
- **Real-Time Updates**: Changes from one device are immediately visible on other devices via WebSocket

## Backend Setup

### Step 1: Configure Supabase

1. **Create a Supabase project** at [https://app.supabase.com](https://app.supabase.com)

2. **Run the SQL migration**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and run the SQL from `backend/supabase_migration.sql`

3. **Get your credentials**:
   - Go to Settings > API
   - Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - Copy your **anon public** key

### Step 2: Configure Backend Environment

1. **Create `.env` file in the `backend` directory**:

```bash
cd backend
cp env.example .env
```

2. **Edit `.env` file** with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Run Supabase Backend

**IMPORTANT**: For real user mode, you must run `main_supabase.py`, NOT `main.py`

```bash
# Make sure you're in the backend directory
cd backend

# Install dependencies if not already done
pip install -r requirements.txt

# Run the Supabase backend
python main_supabase.py
```

Or with uvicorn directly:

```bash
uvicorn main_supabase:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Step 4: Configure Frontend

1. **Create `.env` file in the root directory** (if not exists):

```env
VITE_API_URL=http://localhost:8000
```

2. **Start the frontend**:

```bash
npm run dev
```

## How It Works

### Demo Mode vs Real User Mode

- **Demo Mode (Toggle ON)**: 
  - Shows sample/fake data
  - Data is stored locally only (not in Supabase)
  - Debate toggles are disabled
  - Perfect for exploring the app features

- **Real User Mode (Toggle OFF)**:
  - Uses real data from Supabase
  - Both husband and wife see the same shared data
  - Data syncs across all devices in real-time
  - All debate sessions are saved to Supabase cloud database

### Data Sharing

When in **Real User Mode**, all data is stored with a shared `partner_id` in Supabase. This means:

- ✅ Both partners access the same database
- ✅ When husband starts a debate on his phone, wife sees it on her device
- ✅ Analytics show data from both partners
- ✅ Calendar view shows all debates from both partners
- ✅ Data persists across devices and browser sessions

### Switching Between Modes

**From Demo to Real User Mode:**
1. Toggle the "Demo" switch OFF in the header
2. Confirm the reset dialog
3. All demo data is cleared
4. App connects to Supabase backend
5. Fresh start with real user data

**From Real User to Demo Mode:**
1. Toggle the "Demo" switch ON in the header
2. Demo data is loaded locally
3. Real user data remains in Supabase (not deleted)
4. When switching back, your real data will be restored

## Troubleshooting

### Backend Connection Issues

If you see errors like "Failed to load sessions from Supabase API":

1. **Check if backend is running**:
   ```bash
   # Make sure main_supabase.py is running, not main.py
   python main_supabase.py
   ```

2. **Verify Supabase credentials** in `backend/.env`:
   - Make sure `SUPABASE_URL` is correct
   - Make sure `SUPABASE_ANON_KEY` is the anon/public key (not service_role)

3. **Check Supabase dashboard**:
   - Verify tables exist: `users`, `debate_sessions`, `notifications`
   - Check if demo user was created automatically

4. **Check frontend API URL** in root `.env`:
   ```
   VITE_API_URL=http://localhost:8000
   ```

### Data Not Syncing

- Make sure WebSocket connection is established (check browser console)
- Verify both devices are using the same Supabase backend
- Check network connectivity
- Ensure backend is running `main_supabase.py` (not SQLite version)

### Reset Data

If you want to completely reset all data:

1. Go to Supabase dashboard
2. Navigate to Table Editor
3. Delete all rows from `debate_sessions` and `notifications` tables
4. Or run SQL: `TRUNCATE TABLE debate_sessions, notifications;`

## Production Deployment

For production deployment on Vercel, see `VERCEL_DEPLOYMENT_SUPABASE.md` for detailed instructions.

The key points:
- Backend API should be deployed and use `main_supabase.py`
- Environment variables must be set in Vercel dashboard
- Frontend `VITE_API_URL` should point to your deployed API

## Summary

✅ **For Real Users**: Always use `main_supabase.py` backend  
✅ **Data is Shared**: Both partners see the same data  
✅ **Cross-Device**: Works on any device with internet connection  
✅ **Real-Time**: Changes sync instantly via WebSocket  
✅ **Persistent**: Data stored in cloud, never lost
