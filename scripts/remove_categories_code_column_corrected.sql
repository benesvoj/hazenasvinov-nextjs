-- Remove the legacy 'code' column from categories table (Corrected Version)
-- This script correctly identifies which tables should have category_id
-- 
-- ⚠️ WARNING: Only run this if you're certain no external systems depend on the code field

-- Step 1: Check current state of categories table
DO $$ 
DECLARE
    has_code_column BOOLEAN;
    has_slug_column BOOLEAN;
    total_categories INTEGER;
    categories_with_code INTEGER;
    categories_with_slug INTEGER;
BEGIN
    -- Check if categories table has code column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'code'
    ) INTO has_code_column;
    
    -- Check if categories table has slug column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'slug'
    ) INTO has_slug_column;
    
    IF NOT has_code_column THEN
        RAISE NOTICE 'Categories table does not have code column. Nothing to remove.';
        RETURN;
    END IF;
    
    -- Get category counts
    SELECT COUNT(*) INTO total_categories FROM categories;
    SELECT COUNT(*) INTO categories_with_code FROM categories WHERE code IS NOT NULL;
    SELECT COUNT(*) INTO categories_with_slug FROM categories WHERE slug IS NOT NULL;
    
    -- Report the status
    RAISE NOTICE '=== CATEGORIES TABLE STATUS ===';
    RAISE NOTICE 'Total categories: %', total_categories;
    RAISE NOTICE 'Categories with code: %', categories_with_code;
    RAISE NOTICE 'Categories with slug: %', categories_with_slug;
    RAISE NOTICE 'Has code column: %', has_code_column;
    RAISE NOTICE 'Has slug column: %', has_slug_column;
    
    RAISE NOTICE 'Ready to remove code column.';
END $$;

-- Step 2: Verify that core tables have category_id (excluding junction tables)
DO $$ 
DECLARE
    table_name TEXT;
    has_category_id BOOLEAN;
    core_tables TEXT[] := ARRAY[
        'training_sessions', 
        'members', 
        'matches', 
        'standings', 
        'blog_posts',
        'category_lineups',
        'club_categories',
        'club_teams'
    ];
    missing_tables TEXT[] := '{}';
BEGIN
    RAISE NOTICE '=== CORE TABLES VERIFICATION ===';
    
    FOREACH table_name IN ARRAY core_tables
    LOOP
        -- Check if table exists and has category_id
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = table_name
                AND column_name = 'category_id'
            ) INTO has_category_id;
            
            IF has_category_id THEN
                RAISE NOTICE '✅ % - Has category_id', table_name;
            ELSE
                RAISE NOTICE '❌ % - Missing category_id', table_name;
                missing_tables := array_append(missing_tables, table_name);
            END IF;
        ELSE
            RAISE NOTICE '❓ % - Table does not exist', table_name;
        END IF;
    END LOOP;
    
    -- Check junction table (should NOT have category_id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'category_lineup_members') THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'category_lineup_members'
            AND column_name = 'category_id'
        ) INTO has_category_id;
        
        IF has_category_id THEN
            RAISE NOTICE '⚠️ category_lineup_members - Has category_id (should be removed - it''s redundant)';
        ELSE
            RAISE NOTICE '✅ category_lineup_members - No category_id (correct - junction table)';
        END IF;
    END IF;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'Missing category_id in: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '🎉 All core tables have category_id!';
    END IF;
END $$;

-- Step 3: Show sample of categories before removal
SELECT 
    'Sample categories before code removal' as info,
    id,
    code,
    name,
    slug,
    is_active
FROM categories
ORDER BY name
LIMIT 10;

-- Step 4: Create backup of the code column data (just in case)
CREATE TABLE IF NOT EXISTS categories_code_backup AS 
SELECT id, code, name, created_at 
FROM categories 
WHERE code IS NOT NULL;

-- Step 5: Check for any dependencies on the code column
SELECT 
    'Potential dependencies on categories.code' as info,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'code'
AND table_name != 'categories'
ORDER BY table_name;

-- Step 6: Remove the code column
-- UNCOMMENT THE FOLLOWING LINES ONLY AFTER VERIFICATION
-- ALTER TABLE categories DROP COLUMN IF EXISTS code;

-- Step 7: Update comments
-- COMMENT ON COLUMN categories.slug IS 'URL-friendly category identifier - replaces legacy code field';

-- Step 8: Final verification
-- SELECT 
--     'Final verification' as step,
--     COUNT(*) as total_categories,
--     COUNT(slug) as categories_with_slug
-- FROM categories;

-- Step 9: Show sample after removal (uncomment after running)
-- SELECT 
--     'Sample categories after code removal' as info,
--     id,
--     name,
--     slug,
--     is_active
-- FROM categories
-- ORDER BY name
-- LIMIT 10;

-- Step 10: Cleanup backup table (optional, run after confirming everything works)
-- DROP TABLE IF EXISTS categories_code_backup;
