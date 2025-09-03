-- Troubleshooting Script for Login Logs Table
-- Run this in your Supabase SQL editor to diagnose issues

-- Check if the table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'login_logs';

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'login_logs'
ORDER BY ordinal_position;

-- Check if there are any existing records
SELECT COUNT(*) as total_records FROM login_logs;

-- Check for any foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'login_logs';

-- Check RLS policies
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

-- Check permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'login_logs';

-- If you need to drop and recreate the table (WARNING: This will delete all data)
-- DROP TABLE IF EXISTS login_logs CASCADE;

-- If you need to remove foreign key constraints
-- ALTER TABLE login_logs DROP CONSTRAINT IF EXISTS login_logs_user_id_fkey;

-- Check current auth.users to see what user IDs exist
SELECT id, email, created_at 
FROM auth.users 
LIMIT 5;
