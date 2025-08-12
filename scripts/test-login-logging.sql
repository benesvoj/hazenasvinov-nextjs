-- Test Script for Login Logging System
-- Run this in your Supabase SQL editor to verify the system is working

-- 1. Check if the table exists and has the correct structure
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'login_logs';

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'login_logs'
ORDER BY ordinal_position;

-- 3. Check current records
SELECT 
    id,
    email,
    status,
    ip_address,
    user_agent,
    created_at
FROM login_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'login_logs';

-- 5. Test inserting a record manually (this should work for authenticated users)
-- Note: You need to be logged in to run this
INSERT INTO login_logs (email, status, ip_address, user_agent) VALUES
    ('test@example.com', 'success', '192.168.1.100', 'Test User Agent');

-- 6. Check if the record was inserted
SELECT 
    id,
    email,
    status,
    ip_address,
    user_agent,
    created_at
FROM login_logs 
WHERE email = 'test@example.com'
ORDER BY created_at DESC;

-- 7. Clean up test data
DELETE FROM login_logs WHERE email = 'test@example.com';

-- 8. Verify cleanup
SELECT COUNT(*) as remaining_records FROM login_logs WHERE email = 'test@example.com';
