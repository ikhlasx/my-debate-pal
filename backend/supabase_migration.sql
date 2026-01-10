-- Supabase Migration Script
-- Run this in your Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    partner_id TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner Links table (for future use)
CREATE TABLE IF NOT EXISTS partner_links (
    id BIGSERIAL PRIMARY KEY,
    partner1_id TEXT REFERENCES users(partner_id),
    partner2_id TEXT REFERENCES users(partner_id),
    invite_code TEXT UNIQUE NOT NULL,
    linked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debate Sessions table
CREATE TABLE IF NOT EXISTS debate_sessions (
    id BIGSERIAL PRIMARY KEY,
    partner_id TEXT REFERENCES users(partner_id),
    partner TEXT NOT NULL CHECK (partner IN ('husband', 'wife')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER, -- in seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    partner_id TEXT REFERENCES users(partner_id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    partner TEXT CHECK (partner IN ('husband', 'wife')),
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read INTEGER DEFAULT 0 CHECK (read IN (0, 1))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_partner_id ON debate_sessions(partner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_partner ON debate_sessions(partner);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON debate_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_notifications_partner_id ON notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable Row Level Security (RLS) - but allow all for demo user
-- Since we're using a single demo user, we'll use RLS to ensure only demo user data is accessible
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_links ENABLE ROW LEVEL SECURITY;

-- Create policies that allow access to demo user data only
CREATE POLICY "Allow demo user access" ON users
    FOR ALL USING (partner_id = 'demo-user-12345');

CREATE POLICY "Allow demo user sessions" ON debate_sessions
    FOR ALL USING (partner_id = 'demo-user-12345');

CREATE POLICY "Allow demo user notifications" ON notifications
    FOR ALL USING (partner_id = 'demo-user-12345');

CREATE POLICY "Allow demo user partner links" ON partner_links
    FOR ALL USING (partner1_id = 'demo-user-12345' OR partner2_id = 'demo-user-12345');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON debate_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
