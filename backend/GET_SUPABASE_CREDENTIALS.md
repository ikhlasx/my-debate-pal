# How to Get Your Supabase Credentials

## Step-by-Step Guide

### 1. Create a Supabase Account (if you don't have one)
- Go to https://app.supabase.com
- Sign up or log in

### 2. Create a New Project
- Click "New Project"
- Fill in:
  - **Name**: `debate-tracker` (or any name you prefer)
  - **Database Password**: Choose a strong password (save it!)
  - **Region**: Choose the closest to you
- Click "Create new project"
- Wait 1-2 minutes for the project to be created

### 3. Get Your Credentials

Once your project is ready:

1. **In your Supabase dashboard**, click on **Settings** (gear icon in the left sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:

   **a) Project URL**
   - Look for "Project URL" section
   - It will look like: `https://abcdefghijklmnop.supabase.co`
   - Copy this entire URL

   **b) API Keys**
   - Look for "Project API keys" section
   - Find the key labeled **"anon public"** (NOT "service_role")
   - It's a long string starting with `eyJ...`
   - Click the eye icon to reveal it, then copy it

### 4. Update Your .env File

1. Open `backend/.env` in a text editor
2. Replace the placeholder values:

   ```bash
   # Replace this:
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here

   # With your actual values:
   SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Important**: 
   - No quotes around the values
   - No spaces before or after the `=` sign
   - Use the **anon public** key, NOT the service_role key

### 5. Example .env File

Your `.env` file should look like this:

```bash
# Supabase Configuration
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Set to "true" to add sample data when initializing
ADD_SAMPLE_DATA=false
```

### 6. Verify Your Setup

After updating `.env`, test it:

```bash
python init_supabase.py
```

If successful, you'll see:
```
🚀 Initializing Supabase database...
📝 Demo User ID: demo-user-12345
✅ Demo user created: demo-user-12345
✅ Database initialization complete!
```

## Troubleshooting

### Error: "Invalid API key"
- ✅ Make sure you copied the **anon public** key (not service_role)
- ✅ Check for extra spaces or quotes in your .env file
- ✅ Verify the URL is correct (should end with `.supabase.co`)

### Error: "Please update your .env file"
- ✅ Make sure you replaced the placeholder values
- ✅ Check that your .env file is in the `backend` folder
- ✅ Verify the file is named exactly `.env` (not `.env.txt`)

### Can't find the API keys?
- Go to: Settings → API
- Look for "Project API keys" section
- Use the **anon public** key (the first one listed)

## Security Note

- ✅ The **anon public** key is safe to use in frontend applications
- ✅ It's designed to be public and only allows access based on Row Level Security (RLS)
- ✅ Never share your **service_role** key (it has full access)

## Next Steps

Once your credentials are set up:
1. Run the SQL migration: Copy `supabase_migration.sql` to Supabase SQL Editor and run it
2. Initialize: `python init_supabase.py`
3. Start server: `python main_supabase.py`
