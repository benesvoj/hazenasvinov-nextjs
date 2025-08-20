-- Check Supabase Database Connection
-- This simple script tests if your database is accessible

-- 1. Test basic connection
SELECT 'Database connection successful!' as status, NOW() as current_time;

-- 2. Test if we can read from existing tables
SELECT 
    'lineups' as table_name,
    COUNT(*) as record_count
FROM lineups
UNION ALL
SELECT 
    'lineup_players' as table_name,
    COUNT(*) as record_count
FROM lineup_players
UNION ALL
SELECT 
    'lineup_coaches' as table_name,
    COUNT(*) as record_count
FROM lineup_coaches
UNION ALL
SELECT 
    'members' as table_name,
    COUNT(*) as record_count
FROM members
UNION ALL
SELECT 
    'teams' as table_name,
    COUNT(*) as record_count
FROM teams;

-- 3. Test if we can create a simple function
CREATE OR REPLACE FUNCTION test_connection()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Supabase database is working correctly!';
END;
$$ LANGUAGE plpgsql;

-- 4. Test the function
SELECT test_connection() as test_result;

-- 5. Clean up test function
DROP FUNCTION IF EXISTS test_connection();
