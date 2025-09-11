-- Check existing functions in the database
-- Run this in Supabase SQL Editor to see what functions exist

SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name IN ('get_training_sessions', 'get_attendance_summary', 'get_attendance_records')
ORDER BY routine_name, routine_type;

-- Also check for any functions with similar names
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name LIKE '%attendance%'
    OR routine_name LIKE '%training%'
ORDER BY routine_name;
