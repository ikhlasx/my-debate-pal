# Supabase Integration Setup Guide

This guide will help you set up Supabase as the centralized database for the Debate Tracker application with a demo user.

## Prerequisites

1. A Supabase account (sign up at https://app.supabase.com)
2. Python 3.8+ installed
3. pip or your preferred Python package manager

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name**: debate-tracker (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to you
4. Click "Create new project"
5. Wait for the project to be created (takes 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys" → "anon public")

## Step 3: Set Up Database Tables

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase_migration.sql`
4. Click "Run" to execute the migration
5. Verify tables were created by going to **Table Editor** - you should see:
   - `users`
   - `debate_sessions`
   - `notifications`
   - `partner_links`

## Step 4: Configure Environment Variables

Create a `.env` file in the `backend` directory (or set environment variables):

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Replace `your-project-id` and `your-anon-key-here` with your actual values from Step 2.

## Step 5: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Step 6: Initialize Demo User

Run the initialization script to create the demo user:

```bash
python init_supabase.py
```

This will:
- Create the demo user (`demo-user-12345`)
- Optionally add sample data if `ADD_SAMPLE_DATA=true` is set

To add sample data for demonstration:

```bash
ADD_SAMPLE_DATA=true python init_supabase.py
```

## Step 7: Run the Application

Use the Supabase version of the main application:

```bash
python main_supabase.py
```

Or use uvicorn directly:

```bash
uvicorn main_supabase:app --host 0.0.0.0 --port 8000 --reload
```

## Step 8: Verify It's Working

1. The API should start on `http://localhost:8000`
2. Visit `http://localhost:8000/` - you should see:
   ```json
   {
     "message": "Debate Tracker API (Supabase)",
     "status": "running",
     "demo_user_id": "demo-user-12345"
   }
   ```
3. Test creating a session:
   ```bash
   curl -X POST http://localhost:8000/api/sessions \
     -H "Content-Type: application/json" \
     -d '{
       "partner": "husband",
       "start_time": "2024-01-01T10:00:00Z"
     }'
   ```

## Demo User Details

- **User ID**: `demo-user-12345`
- **Email**: `demo@debatepal.com`
- **No Authentication Required**: All data is automatically associated with this demo user

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Only data with `partner_id = 'demo-user-12345'` is accessible
- The `anon` key is safe to use in frontend applications
- For production, consider using the `service_role` key only on the backend

## Troubleshooting

### Error: "SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set"
- Make sure you've created a `.env` file with the correct values
- Or set the environment variables in your shell/system

### Error: "relation does not exist"
- Make sure you've run the SQL migration script in Supabase SQL Editor
- Check that all tables were created successfully

### Error: "permission denied"
- Check that Row Level Security policies were created correctly
- Verify the demo user exists in the `users` table

### Data not showing up
- Ensure all queries filter by `partner_id = 'demo-user-12345'`
- Check the Supabase Table Editor to see if data was inserted

## Migration from SQLite

If you were previously using SQLite:

1. Export your existing data (if needed)
2. Run the Supabase migration script
3. Update your `.env` file with Supabase credentials
4. Use `main_supabase.py` instead of `main.py`
5. Optionally import your existing data into Supabase

## Next Steps

- The frontend should work without changes (it uses the same API endpoints)
- All data is now stored in Supabase cloud database
- You can view and manage data through the Supabase dashboard
- The demo user is ready to use for demonstrations
