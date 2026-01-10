-- Enable Supabase Realtime for Debate Tracker tables
-- Run this in your Supabase SQL Editor to enable real-time subscriptions

-- Enable realtime publication (if not already enabled)
-- This allows tables to broadcast changes via WebSocket

-- Add debate_sessions table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE debate_sessions;

-- Add notifications table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verify the tables are added (optional check)
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Note: After running this, any INSERT, UPDATE, or DELETE operations on these tables
-- will automatically broadcast changes to all connected clients via Supabase Realtime.
