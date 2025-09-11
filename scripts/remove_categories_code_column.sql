-- Remove the legacy 'code' column from categories table
-- This script safely removes the old code column after migration to category_id is complete
-- 
-- ⚠️ WARNING: Only run this if you're certain no external systems depend on the code field
-- and all internal references have been updated to use category_id or slug

-- Step 1: Verify that migration is complete
DO $$ 
DECLARE
    tables_with_category_id INTEGER;
    tables_with_legacy_category INTEGER;
    total_tables INTEGER;
BEGIN
    -- Count tables that should have category_id
    SELECT COUNT(*) INTO total_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'training_sessions', 
        'category_lineup_members', 
        'members', 
        'matches', 
        'standings', 
        'blog_posts',
        'category_lineups',
        'club_categories',
        'club_teams'
    );
    
    -- Count tables with category_id column
    SELECT COUNT(*) INTO tables_with_category_id
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND column_name = 'category_id'
    AND table_name IN (
        'training_sessions', 
        'category_lineup_members', 
        'members', 
        'matches', 
        'standings', 
        'blog_posts',
        'category_lineups',
        'club_categories',
        'club_teams'
    );
    
    -- Count tables with legacy category column
    SELECT COUNT(*) INTO tables_with_legacy_category
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND column_name = 'category'
    AND data_type = 'character varying'
    AND table_name IN (
        'training_sessions', 
        'category_lineup_members', 
        'members', 
        'matches', 
        'standings', 
        'blog_posts',
        'category_lineups',
        'club_categories',
        'club_teams'
    );
    
    -- Report the status
    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    RAISE NOTICE 'Total tables to check: %', total_tables;
    RAISE NOTICE 'Tables with category_id: %', tables_with_category_id;
    RAISE NOTICE 'Tables with legacy category: %', tables_with_legacy_category;
    
    -- Check if migration is complete
    IF tables_with_legacy_category > 0 THEN
        RAISE EXCEPTION 'Migration not complete! % tables still have legacy category column. Please complete the migration first.', tables_with_legacy_category;
    END IF;
    
    IF tables_with_category_id < total_tables THEN
        RAISE EXCEPTION 'Migration incomplete! Not all tables have category_id column. Please complete the migration first.';
    END IF;
    
    RAISE NOTICE 'Migration verification passed. Safe to remove categories.code column.';
END $$;

-- Step 2: Check if any external systems might depend on the code field
SELECT 
    'External dependencies check' as info,
    COUNT(*) as total_categories,
    COUNT(code) as categories_with_code,
    COUNT(slug) as categories_with_slug
FROM categories;

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

-- Step 5: Remove the code column
-- UNCOMMENT THE FOLLOWING LINES ONLY AFTER VERIFICATION
-- ALTER TABLE categories DROP COLUMN IF EXISTS code;

-- Step 6: Update comments
-- COMMENT ON COLUMN categories.slug IS 'URL-friendly category identifier - replaces legacy code field';

-- Step 7: Final verification
-- SELECT 
--     'Final verification' as step,
--     COUNT(*) as total_categories,
--     COUNT(slug) as categories_with_slug
-- FROM categories;

-- Step 8: Show sample after removal (uncomment after running)
-- SELECT 
--     'Sample categories after code removal' as info,
--     id,
--     name,
--     slug,
--     is_active
-- FROM categories
-- ORDER BY name
-- LIMIT 10;

-- Step 9: Cleanup backup table (optional, run after confirming everything works)
-- DROP TABLE IF EXISTS categories_code_backup;
