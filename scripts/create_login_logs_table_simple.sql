-- Simple Login Logs Table Creation Script
-- Run this step by step in your Supabase SQL editor

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- No foreign key constraint initially
    email TEXT NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT, -- Changed from INET to TEXT for simplicity
    user_agent TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies
CREATE POLICY "Allow authenticated users to read login logs" ON login_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert login logs" ON login_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_time ON login_logs(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(email);
CREATE INDEX IF NOT EXISTS idx_login_logs_status ON login_logs(status);

-- Step 5: Insert sample data
INSERT INTO login_logs (email, login_time, ip_address, user_agent, status) VALUES
    ('admin@hazenasvinov.cz', NOW() - INTERVAL '1 hour', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success'),
    ('user@hazenasvinov.cz', NOW() - INTERVAL '2 hours', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'success'),
    ('test@hazenasvinov.cz', NOW() - INTERVAL '3 hours', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'success'),
    ('unknown@example.com', NOW() - INTERVAL '30 minutes', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'failed'),
    ('invalid@example.com', NOW() - INTERVAL '1 day', '192.168.1.104', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'failed');

-- Step 6: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON login_logs TO authenticated;

-- Optional: Add foreign key constraint later (after you have users)
-- ALTER TABLE login_logs ADD CONSTRAINT login_logs_user_id_fkey 
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
