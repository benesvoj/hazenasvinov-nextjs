-- Remove the legacy 'code' column from categories table (Final Version)
-- Based on actual database state analysis
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
    
    -- Check if we have slugs as replacement
    IF categories_with_slug = 0 AND has_slug_column THEN
        RAISE WARNING 'No categories have slug field! Consider adding slugs before removing code.';
    ELSIF NOT has_slug_column THEN
        RAISE WARNING 'No slug column found! Consider adding slug column before removing code.';
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

-- Step 4: Check for any dependencies on the code column
-- This checks if any other tables reference the code column
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
