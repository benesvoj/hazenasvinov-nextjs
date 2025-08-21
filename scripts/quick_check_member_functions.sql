-- =====================================================
-- Quick Check: Member Functions Table Status
-- Purpose: See what's currently in your database
-- =====================================================

-- Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'member_functions') 
        THEN '✅ Table exists' 
        ELSE '❌ Table does not exist' 
    END as table_status;

-- If table exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'member_functions'
ORDER BY ordinal_position;

-- If table exists, show any data
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'member_functions')
        THEN (SELECT COUNT(*) FROM member_functions)::text
        ELSE 'N/A'
    END as row_count;

-- Show sample data if any exists
SELECT 
    id,
    name,
    display_name,
    is_active
FROM member_functions 
LIMIT 5;
