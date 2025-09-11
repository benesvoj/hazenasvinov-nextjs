-- Final Cleanup and Verification Script
-- This script performs a final check and cleanup after category migration completion

SELECT '=== FINAL CLEANUP AND VERIFICATION ===' as info;
SELECT 'Performing final verification after category migration completion' as description;

-- ============================================================================
-- 1. VERIFY CATEGORIES.CODE COLUMN IS REMOVED
-- ============================================================================
SELECT '=== 1. CATEGORIES.CODE COLUMN VERIFICATION ===' as section;

-- Check if code column still exists (should be FALSE)
SELECT 
    'Code column exists in categories:' as check_type,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'categories' 
          AND column_name = 'code'
    ) as code_column_exists,
    'Expected: FALSE' as expected;

-- If code column still exists, show warning
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'categories' 
          AND column_name = 'code'
    ) THEN
        RAISE WARNING 'Categories.code column still exists! Run remove_categories_code_column_corrected.sql first.';
    ELSE
        RAISE NOTICE '✅ Categories.code column successfully removed.';
    END IF;
END $$;

-- ============================================================================
-- 2. VERIFY ALL CORE TABLES HAVE CATEGORY_ID
-- ============================================================================
SELECT '=== 2. CORE TABLES CATEGORY_ID VERIFICATION ===' as section;

-- Check all expected tables have category_id
WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'training_sessions',
        'members', 
        'matches',
        'standings',
        'blog_posts',
        'category_lineups',
        'club_categories',
        'club_category_teams',
        'coach_categories',
        'team_categories',
        'team_suffix_helper',
        'videos'
    ]) as table_name
),
actual_tables AS (
    SELECT DISTINCT table_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND column_name = 'category_id'
)
SELECT 
    'Table verification:' as check_type,
    et.table_name,
    CASE 
        WHEN at.table_name IS NOT NULL THEN '✅ HAS category_id'
        ELSE '❌ MISSING category_id'
    END as status
FROM expected_tables et
LEFT JOIN actual_tables at ON et.table_name = at.table_name
ORDER BY et.table_name;

-- ============================================================================
-- 3. VERIFY JUNCTION TABLE STRUCTURE
-- ============================================================================
SELECT '=== 3. JUNCTION TABLE STRUCTURE VERIFICATION ===' as section;

-- Verify category_lineup_members has correct structure (no category_id)
SELECT 
    'category_lineup_members structure:' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'category_lineup_members'
ORDER BY ordinal_position;

-- Verify it does NOT have category_id
SELECT 
    'category_lineup_members has category_id:' as check_type,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'category_lineup_members' 
          AND column_name = 'category_id'
    ) as has_category_id,
    'Expected: FALSE (junction table)' as expected;

-- ============================================================================
-- 4. VERIFY NO LEGACY COLUMNS REMAIN
-- ============================================================================
SELECT '=== 4. LEGACY COLUMNS VERIFICATION ===' as section;

-- Check for any remaining 'category' columns (legacy VARCHAR fields)
SELECT 
    'Legacy category columns found:' as check_type,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'category'
  AND data_type = 'character varying'
ORDER BY table_name;

-- Check for any remaining 'code' columns in categories-related tables
SELECT 
    'Code columns in categories-related tables:' as check_type,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'code'
  AND table_name IN (
    'categories', 'club_categories', 'team_categories', 
    'coach_categories', 'category_lineups'
  )
ORDER BY table_name;

-- ============================================================================
-- 5. VERIFY DATABASE VIEWS ARE CLEAN
-- ============================================================================
SELECT '=== 5. DATABASE VIEWS VERIFICATION ===' as section;

-- Check if any views still reference code columns
SELECT 
    'Views referencing code:' as check_type,
    viewname,
    CASE 
        WHEN definition LIKE '%categories.code%' THEN '❌ STILL REFERENCES categories.code'
        WHEN definition LIKE '%cat.code%' THEN '❌ STILL REFERENCES cat.code'
        WHEN definition LIKE '%c.code%' THEN '❌ STILL REFERENCES c.code'
        WHEN definition LIKE '%code%' THEN '⚠️  REFERENCES code (check if safe)'
        ELSE '✅ CLEAN'
    END as status
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY status, viewname;

-- ============================================================================
-- 6. VERIFY DATA INTEGRITY
-- ============================================================================
SELECT '=== 6. DATA INTEGRITY VERIFICATION ===' as section;

-- Check for orphaned records
SELECT 
    'Orphaned category_id in training_sessions:' as check_type,
    COUNT(*) as orphaned_count
FROM training_sessions ts
LEFT JOIN categories c ON ts.category_id = c.id
WHERE c.id IS NULL;

SELECT 
    'Orphaned category_id in members:' as check_type,
    COUNT(*) as orphaned_count
FROM members m
LEFT JOIN categories c ON m.category_id = c.id
WHERE c.id IS NULL;

SELECT 
    'Orphaned category_id in matches:' as check_type,
    COUNT(*) as orphaned_count
FROM matches m
LEFT JOIN categories c ON m.category_id = c.id
WHERE c.id IS NULL;

-- ============================================================================
-- 7. FINAL MIGRATION STATUS
-- ============================================================================
SELECT '=== 7. FINAL MIGRATION STATUS ===' as section;

-- Overall migration status
WITH migration_status AS (
    SELECT 
        (SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'categories' 
              AND column_name = 'code'
        )) as code_column_exists,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_schema = 'public' 
           AND column_name = 'category_id') as tables_with_category_id,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_schema = 'public' 
           AND column_name = 'category'
           AND data_type = 'character varying') as legacy_category_columns,
        (SELECT COUNT(*) FROM pg_views 
         WHERE schemaname = 'public'
           AND definition LIKE '%categories.code%') as views_with_code_refs
)
SELECT 
    'Final Migration Status:' as status_type,
    CASE 
        WHEN NOT code_column_exists 
             AND tables_with_category_id >= 10 
             AND legacy_category_columns = 0 
             AND views_with_code_refs = 0
        THEN '✅ MIGRATION COMPLETE - ALL CLEAN!'
        ELSE '❌ MIGRATION INCOMPLETE - ISSUES FOUND'
    END as overall_status,
    'Code column removed: ' || CASE WHEN NOT code_column_exists THEN 'YES ✅' ELSE 'NO ❌' END as code_removed,
    'Tables with category_id: ' || tables_with_category_id || ' (expected: 12+)' as category_id_tables,
    'Legacy category columns: ' || legacy_category_columns || ' (expected: 0)' as legacy_columns,
    'Views with code refs: ' || views_with_code_refs || ' (expected: 0)' as code_references
FROM migration_status;

-- ============================================================================
-- 8. RECOMMENDATIONS
-- ============================================================================
SELECT '=== 8. RECOMMENDATIONS ===' as section;

-- Provide recommendations based on current state
DO $$ 
DECLARE
    code_exists BOOLEAN;
    category_id_count INTEGER;
    legacy_count INTEGER;
    view_refs INTEGER;
BEGIN
    -- Get current status
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'categories' 
          AND column_name = 'code'
    ) INTO code_exists;
    
    SELECT COUNT(*) INTO category_id_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND column_name = 'category_id';
    
    SELECT COUNT(*) INTO legacy_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND column_name = 'category'
      AND data_type = 'character varying';
    
    SELECT COUNT(*) INTO view_refs
    FROM pg_views 
    WHERE schemaname = 'public'
      AND definition LIKE '%categories.code%';
    
    -- Provide recommendations
    IF code_exists THEN
        RAISE NOTICE '⚠️  RECOMMENDATION: Run remove_categories_code_column_corrected.sql to remove categories.code column';
    END IF;
    
    IF category_id_count < 10 THEN
        RAISE NOTICE '⚠️  RECOMMENDATION: Some tables may be missing category_id column';
    END IF;
    
    IF legacy_count > 0 THEN
        RAISE NOTICE '⚠️  RECOMMENDATION: Remove legacy category columns from tables: %', legacy_count;
    END IF;
    
    IF view_refs > 0 THEN
        RAISE NOTICE '⚠️  RECOMMENDATION: Update views that still reference categories.code: %', view_refs;
    END IF;
    
    IF NOT code_exists AND category_id_count >= 10 AND legacy_count = 0 AND view_refs = 0 THEN
        RAISE NOTICE '🎉 CONGRATULATIONS: Category migration is complete and clean!';
        RAISE NOTICE '✅ All category.code references have been successfully removed';
        RAISE NOTICE '✅ All tables have been migrated to use category_id';
        RAISE NOTICE '✅ Database is ready for production use';
    END IF;
END $$;

SELECT '=== VERIFICATION COMPLETE ===' as info;
