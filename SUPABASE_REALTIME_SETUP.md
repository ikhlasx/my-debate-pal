# Supabase Realtime Setup Guide

This guide explains how to set up Supabase Realtime for real-time synchronization across devices in your Debate Tracker app.

## Why Supabase Realtime?

Vercel serverless functions do not support persistent WebSocket connections. Supabase Realtime provides a WebSocket-based solution that works seamlessly with serverless architectures, allowing real-time synchronization of debate sessions and notifications across all devices.

## Prerequisites

- Supabase project with database tables already created
- Supabase URL and Anon Key

## Step 1: Enable Realtime in Supabase

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Run the following SQL to enable Realtime for your tables:

```sql
-- Enable realtime for debate_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE debate_sessions;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

Alternatively, you can run the SQL file:
```bash
# Copy the SQL from backend/enable_realtime.sql and run it in Supabase SQL Editor
```

## Step 2: Configure Environment Variables

Add the following environment variables to your **Vercel project**:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add these variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Your Supabase anonymous key |

**Important Notes:**
- These are **public** environment variables (prefixed with `VITE_`) that will be exposed to the frontend
- The `anon` key is safe to expose - it's designed for client-side use
- Never expose your `service_role` key in the frontend

### Getting Your Supabase Credentials

1. Go to **Supabase Dashboard** → Your Project → **Settings** → **API**
2. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public** key → Use as `VITE_SUPABASE_ANON_KEY`

## Step 3: Verify Setup

After deploying, check the browser console. You should see:
- ✅ `Supabase Realtime connected` (when connected)
- ❌ `Cannot connect to Supabase Realtime: credentials missing` (if credentials are not set)

## How It Works

1. **Frontend subscribes** to database changes via Supabase Realtime
2. **Backend creates/updates/deletes** records in Supabase
3. **Supabase broadcasts** changes to all connected clients
4. **Frontend receives** updates and refreshes the UI automatically

## Event Types

The Realtime client listens for these events:
- `session_created` - When a new debate session is created
- `session_updated` - When a session is updated (e.g., ended)
- `session_deleted` - When a session is deleted
- `notification` - When a notification is created

## Troubleshooting

### Realtime not connecting

1. **Check environment variables:**
   ```javascript
   // In browser console
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
   ```

2. **Verify tables are enabled:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
   You should see `debate_sessions` and `notifications` in the results.

3. **Check Supabase Dashboard:**
   - Go to **Database** → **Replication** → Verify tables are enabled

### Changes not syncing

1. Ensure Realtime is enabled for the tables (Step 1)
2. Check browser console for connection errors
3. Verify Supabase credentials are correct
4. Check network tab for WebSocket connection (`wss://`)

## Local Development

For local development, create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then restart your dev server:
```bash
npm run dev
```

## Benefits

✅ **Works with Vercel** - No serverless function limitations  
✅ **Real-time sync** - Changes appear instantly on all devices  
✅ **Automatic reconnection** - Handles network issues gracefully  
✅ **Secure** - Uses Supabase's built-in authentication and security  
✅ **Scalable** - Supabase handles all the infrastructure  

## Next Steps

- Test real-time sync by opening the app on two devices
- Create a session on one device and watch it appear on the other
- Check the browser console to see Realtime events being received
