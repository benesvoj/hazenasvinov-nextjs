-- Check which tables have category_id column and which don't
-- This will help identify what's missing from the migration

-- Step 1: Check all tables that should have category_id
SELECT 
    'Tables with category_id column' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'category_id'
ORDER BY table_name;

-- Step 2: Check all tables that still have legacy category column
SELECT 
    'Tables with legacy category column' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'category'
AND data_type = 'character varying'
ORDER BY table_name;

-- Step 3: Check all tables that have code column
SELECT 
    'Tables with code column' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'code'
AND data_type = 'character varying'
ORDER BY table_name;

-- Step 4: List all tables in the public schema
SELECT 
    'All tables in public schema' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Step 5: Check specific tables that should have category_id
DO $$ 
DECLARE
    table_name TEXT;
    has_category_id BOOLEAN;
    expected_tables TEXT[] := ARRAY[
        'training_sessions', 
        'category_lineup_members', 
        'members', 
        'matches', 
        'standings', 
        'blog_posts',
        'category_lineups',
        'club_categories',
        'club_teams'
    ];
BEGIN
    RAISE NOTICE '=== CATEGORY_ID COLUMN CHECK ===';
    
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        -- Check if table exists and has category_id column
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_name
            AND column_name = 'category_id'
        ) INTO has_category_id;
        
        IF has_category_id THEN
            RAISE NOTICE '✅ % - HAS category_id column', table_name;
        ELSE
            RAISE NOTICE '❌ % - MISSING category_id column', table_name;
        END IF;
    END LOOP;
END $$;
