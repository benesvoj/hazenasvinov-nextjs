-- Drop old club_teams table
-- This table is no longer needed after migrating to the new club_category_teams structure

-- 1. First, check if there are any remaining references
SELECT 
    'Checking for remaining references to club_teams' as status;

-- Check if any tables still reference club_teams
SELECT 
    tc.table_name,
    tc.column_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'club_teams'
  AND tc.table_schema = 'public';

-- 2. Check if club_teams table exists and has data
SELECT 
    'Checking club_teams table status' as status;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'club_teams') THEN
        RAISE NOTICE 'club_teams table exists';
        
        -- Count remaining records
        EXECUTE 'SELECT COUNT(*) as remaining_records FROM club_teams';
    ELSE
        RAISE NOTICE 'club_teams table does not exist';
    END IF;
END $$;

-- 3. Check if any foreign key constraints exist
SELECT 
    'Checking for foreign key constraints' as status;

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
  AND (tc.table_name = 'club_teams' OR ccu.table_name = 'club_teams');

-- 4. Drop the table if it exists and has no constraints
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'club_teams') THEN
        -- Check if there are any foreign key constraints referencing this table
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'club_teams' AND tc.constraint_type = 'FOREIGN KEY'
        ) THEN
            -- Safe to drop
            DROP TABLE club_teams;
            RAISE NOTICE 'Successfully dropped club_teams table';
        ELSE
            RAISE NOTICE 'Cannot drop club_teams table - foreign key constraints exist';
        END IF;
    ELSE
        RAISE NOTICE 'club_teams table does not exist';
    END IF;
END $$;

-- 5. Verify the table is gone
SELECT 
    'Verification' as status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'club_teams') 
        THEN 'club_teams table still exists'
        ELSE 'club_teams table successfully dropped'
    END as result;

-- 6. Show current structure
SELECT 
    'Current club management tables' as status;

SELECT 
    table_name,
    CASE 
        WHEN table_name = 'clubs' THEN '✅ Core club information'
        WHEN table_name = 'club_categories' THEN '✅ Club-category-season assignments'
        WHEN table_name = 'club_category_teams' THEN '✅ Generated teams for categories'
        WHEN table_name = 'club_teams' THEN '❌ OLD - should be dropped'
        ELSE '❓ Unknown table'
    END as description
FROM information_schema.tables 
WHERE table_name LIKE 'club%'
  AND table_schema = 'public'
ORDER BY table_name;
