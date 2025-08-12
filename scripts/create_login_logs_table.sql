-- Create login_logs table for tracking user authentication
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Changed to SET NULL
    email TEXT NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins)
CREATE POLICY "Allow authenticated users to read login logs" ON login_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert login logs" ON login_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_time ON login_logs(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(email);
CREATE INDEX IF NOT EXISTS idx_login_logs_status ON login_logs(status);

-- Create a function to log successful logins
CREATE OR REPLACE FUNCTION log_successful_login(
    p_user_id UUID,
    p_email TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO login_logs (user_id, email, ip_address, user_agent, status, session_id)
    VALUES (p_user_id, p_email, p_ip_address, p_user_agent, 'success', p_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to log failed login attempts
CREATE OR REPLACE FUNCTION log_failed_login(
    p_email TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO login_logs (email, ip_address, user_agent, status)
    VALUES (p_email, p_ip_address, p_user_agent, 'failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON login_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_successful_login TO authenticated;
GRANT EXECUTE ON FUNCTION log_failed_login TO authenticated;

-- Insert sample data that won't violate foreign key constraints
-- Note: We'll insert logs without user_id references initially
INSERT INTO login_logs (email, login_time, ip_address, user_agent, status) VALUES
    ('admin@hazenasvinov.cz', NOW() - INTERVAL '1 hour', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success'),
    ('user@hazenasvinov.cz', NOW() - INTERVAL '2 hours', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'success'),
    ('test@hazenasvinov.cz', NOW() - INTERVAL '3 hours', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'success'),
    ('unknown@example.com', NOW() - INTERVAL '30 minutes', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'failed'),
    ('invalid@example.com', NOW() - INTERVAL '1 day', '192.168.1.104', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'failed');

-- After you have actual users in your system, you can update the logs to reference them
-- Example (run this after you have real users):
-- UPDATE login_logs 
-- SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@hazenasvinov.cz' LIMIT 1)
-- WHERE email = 'admin@hazenasvinov.cz' AND user_id IS NULL;
