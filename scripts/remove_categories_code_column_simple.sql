-- Remove the legacy 'code' column from categories table (Simplified Version)
-- This script safely removes the old code column after migration to category_id is complete
-- 
-- ⚠️ WARNING: Only run this if you're certain no external systems depend on the code field
-- and all internal references have been updated to use category_id or slug

-- Step 1: Check if categories table exists and has code column
DO $$ 
DECLARE
    has_code_column BOOLEAN;
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
    
    -- Check if we have slugs as replacement
    IF categories_with_slug = 0 THEN
        RAISE WARNING 'No categories have slug field! Consider adding slugs before removing code.';
    END IF;
    
    RAISE NOTICE 'Ready to remove code column.';
END $$;

-- Step 2: Show sample of categories before removal
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

-- Step 3: Create backup of the code column data (just in case)
CREATE TABLE IF NOT EXISTS categories_code_backup AS 
SELECT id, code, name, created_at 
FROM categories 
WHERE code IS NOT NULL;

-- Step 4: Remove the code column
-- UNCOMMENT THE FOLLOWING LINES ONLY AFTER VERIFICATION
-- ALTER TABLE categories DROP COLUMN IF EXISTS code;

-- Step 5: Update comments
-- COMMENT ON COLUMN categories.slug IS 'URL-friendly category identifier - replaces legacy code field';

-- Step 6: Final verification
-- SELECT 
--     'Final verification' as step,
--     COUNT(*) as total_categories,
--     COUNT(slug) as categories_with_slug
-- FROM categories;

-- Step 7: Show sample after removal (uncomment after running)
-- SELECT 
--     'Sample categories after code removal' as info,
--     id,
--     name,
--     slug,
--     is_active
-- FROM categories
-- ORDER BY name
-- LIMIT 10;

-- Step 8: Cleanup backup table (optional, run after confirming everything works)
-- DROP TABLE IF EXISTS categories_code_backup;
