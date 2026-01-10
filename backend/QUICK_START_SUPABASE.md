# Quick Start: Supabase Integration

## 🚀 Quick Setup (5 minutes)

### 1. Create Supabase Project
- Go to https://app.supabase.com
- Create a new project
- Note your **Project URL** and **anon key** from Settings → API

### 2. Run Database Migration
- In Supabase dashboard → SQL Editor
- Copy/paste `supabase_migration.sql`
- Click "Run"

### 3. Set Environment Variables

Create `backend/.env` file (copy from `env.example`):
```bash
# Copy the example file
copy env.example .env

# Then edit .env and add your Supabase credentials:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Or create `.env` manually with your Supabase credentials.

### 4. Install & Run

```bash
cd backend
pip install -r requirements.txt
python init_supabase.py
python main_supabase.py
```

### 5. Test

Visit: http://localhost:8000

You should see:
```json
{
  "message": "Debate Tracker API (Supabase)",
  "status": "running",
  "demo_user_id": "demo-user-12345"
}
```

## 📝 Demo User

- **ID**: `demo-user-12345`
- **No authentication needed**
- All data automatically associated with this user

## 🔄 Switching from SQLite

1. Keep `main.py` for SQLite (backup)
2. Use `main_supabase.py` for Supabase
3. Same API endpoints - frontend works without changes!

## 📚 Full Documentation

See `SUPABASE_SETUP.md` for detailed instructions.
