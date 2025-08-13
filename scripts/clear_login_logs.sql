-- Clear Login Logs Table
-- Run this in your Supabase SQL editor

-- Option 1: Simple DELETE (Recommended)
-- This removes all records but keeps the table structure
DELETE FROM login_logs;

-- Option 2: DELETE with confirmation (Shows what was deleted)
-- Uncomment the lines below if you want to see what was removed
-- DELETE FROM login_logs 
-- RETURNING id, email, action, status, login_time;

-- Option 3: TRUNCATE (Faster, resets auto-increment)
-- Uncomment the line below if you want to reset the ID sequence
-- TRUNCATE TABLE login_logs RESTART IDENTITY;

-- Option 4: Delete old records only (Keep recent ones)
-- Uncomment and modify the lines below to keep recent records
-- DELETE FROM login_logs 
-- WHERE login_time < NOW() - INTERVAL '7 days';  -- Keep last 7 days

-- Verify the table is empty
SELECT COUNT(*) as remaining_records FROM login_logs;

-- Show table structure (should still exist)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'login_logs' 
ORDER BY ordinal_position;
