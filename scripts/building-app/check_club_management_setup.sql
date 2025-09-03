-- Diagnostic script to check the current state of club management tables
-- Run this to see what's actually in your database

-- 1. Check if tables exist
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_name IN ('clubs', 'club_teams', 'club_categories')
ORDER BY table_name;

-- 2. Check table structure for clubs
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clubs'
ORDER BY ordinal_position;

-- 3. Check table structure for club_teams
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'club_teams'
ORDER BY ordinal_position;

-- 4. Check table structure for club_categories
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'club_categories'
ORDER BY ordinal_position;

-- 5. Check if views exist
SELECT 
    table_name as view_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.views 
WHERE table_name IN ('club_overview', 'club_category_details')
ORDER BY table_name;

-- 6. Check sample data (if any exists)
SELECT 'clubs' as table_name, COUNT(*) as record_count FROM clubs
UNION ALL
SELECT 'club_teams' as table_name, COUNT(*) as record_count FROM club_teams
UNION ALL
SELECT 'club_categories' as table_name, COUNT(*) as record_count FROM club_categories;

-- 7. Check for any existing club data
SELECT * FROM clubs LIMIT 5;

-- 8. Check for any existing club_teams data
SELECT * FROM club_teams LIMIT 5;

-- 9. Check for any existing club_categories data
SELECT * FROM club_categories LIMIT 5;

-- 10. Check if the max_teams column exists in club_categories
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'club_categories' AND column_name = 'max_teams'
        ) THEN 'max_teams column EXISTS'
        ELSE 'max_teams column MISSING'
    END as max_teams_status;
