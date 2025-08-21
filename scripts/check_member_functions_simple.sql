-- =====================================================
-- SQL Script: Check Member Functions Status (Simple Version)
-- Purpose: Diagnose issues with member_functions table
-- Created: $(date)
-- =====================================================

-- Check if the table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'member_functions') 
        THEN 'Table exists' 
        ELSE 'Table does not exist' 
    END as table_status;

-- Check if UUID extension is available
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_extension WHERE extname = 'uuid-ossp') 
        THEN 'UUID extension available' 
        ELSE 'UUID extension NOT available' 
    END as uuid_extension_status;

-- Check if gen_random_uuid function is available
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'gen_random_uuid') 
        THEN 'gen_random_uuid function available' 
        ELSE 'gen_random_uuid function NOT available' 
    END as gen_random_uuid_status;

-- Check if uuid_generate_v4 function is available
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'uuid_generate_v4') 
        THEN 'uuid_generate_v4 function available' 
        ELSE 'uuid_generate_v4 function NOT available' 
    END as uuid_generate_v4_status;

-- Show table structure if it exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'id' THEN 'PRIMARY KEY'
        WHEN column_name = 'name' THEN 'UNIQUE'
        ELSE 'Regular'
    END as constraint_type
FROM information_schema.columns 
WHERE table_name = 'member_functions'
ORDER BY ordinal_position;

-- Show table constraints if table exists
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'member_functions';

-- Show RLS status if table exists
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'member_functions';

-- Show data count if table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'member_functions')
        THEN (SELECT COUNT(*) FROM member_functions)::text
        ELSE 'N/A - Table does not exist'
    END as total_rows;

-- Show sample data if table exists and has data
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'member_functions')
        AND (SELECT COUNT(*) FROM member_functions) > 0
        THEN 'Sample data available - check next query'
        ELSE 'No sample data available'
    END as data_status;

-- If table exists and has data, show sample
SELECT 
    id,
    name,
    display_name,
    is_active,
    sort_order
FROM member_functions 
LIMIT 5;

-- Summary status
SELECT 
    'Database check completed' as status,
    NOW() as check_time,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'member_functions')
        THEN 'Table exists'
        ELSE 'Table missing - run setup script'
    END as recommendation;
