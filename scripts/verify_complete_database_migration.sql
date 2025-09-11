-- Comprehensive Database Migration Verification Script
-- This script verifies that the category migration from code to category_id is complete
-- and that the categories.code column has been successfully removed

SELECT '=== COMPREHENSIVE DATABASE MIGRATION VERIFICATION ===' as info;
SELECT 'Checking database state after category migration completion' as description;

-- ============================================================================
-- 1. VERIFY CATEGORIES TABLE STRUCTURE
-- ============================================================================
SELECT '=== 1. CATEGORIES TABLE STRUCTURE ===' as section;

-- Check if categories table exists and its structure
SELECT 
    'Categories table columns:' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'categories'
ORDER BY ordinal_position;

-- Check if code column still exists (should be FALSE)
SELECT 
    'Code column exists:' as check_type,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'categories' 
          AND column_name = 'code'
    ) as code_column_exists;

-- Check if category_id column exists (should be TRUE)
SELECT 
    'Category_id column exists:' as check_type,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'categories' 
          AND column_name = 'id'
    ) as id_column_exists;

-- ============================================================================
-- 2. VERIFY CORE TABLES HAVE CATEGORY_ID
-- ============================================================================
SELECT '=== 2. CORE TABLES WITH CATEGORY_ID ===' as section;

-- List all tables that should have category_id column
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
    'Tables with category_id:' as check_type,
    et.table_name,
    CASE 
        WHEN at.table_name IS NOT NULL THEN '✅ HAS category_id'
        ELSE '❌ MISSING category_id'
    END as status
FROM expected_tables et
LEFT JOIN actual_tables at ON et.table_name = at.table_name
ORDER BY et.table_name;

-- ============================================================================
-- 3. VERIFY JUNCTION TABLES STRUCTURE
-- ============================================================================
SELECT '=== 3. JUNCTION TABLES STRUCTURE ===' as section;

-- Check category_lineup_members (should NOT have category_id)
SELECT 
    'category_lineup_members structure:' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'category_lineup_members'
ORDER BY ordinal_position;

-- Verify it has the correct structure (lineup_id, member_id, no category_id)
SELECT 
    'category_lineup_members has category_id:' as check_type,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'category_lineup_members' 
          AND column_name = 'category_id'
    ) as has_category_id,
    'Should be FALSE' as expected;

-- ============================================================================
-- 4. VERIFY LEGACY COLUMNS ARE REMOVED
-- ============================================================================
SELECT '=== 4. LEGACY COLUMNS REMOVAL ===' as section;

-- Check for any remaining 'category' columns (legacy VARCHAR fields)
SELECT 
    'Tables with legacy category column:' as check_type,
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
    'Tables with code column:' as check_type,
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
-- 5. VERIFY DATABASE VIEWS
-- ============================================================================
SELECT '=== 5. DATABASE VIEWS ===' as section;

-- Check if views still reference code columns
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
-- 6. VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================================
SELECT '=== 6. FOREIGN KEY CONSTRAINTS ===' as section;

-- Check foreign key constraints involving categories
SELECT 
    'Foreign keys to categories:' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'categories'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 7. VERIFY DATA INTEGRITY
-- ============================================================================
SELECT '=== 7. DATA INTEGRITY ===' as section;

-- Check for orphaned records (category_id references that don't exist in categories)
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
-- 8. VERIFY FUNCTIONS AND TRIGGERS
-- ============================================================================
SELECT '=== 8. FUNCTIONS AND TRIGGERS ===' as section;

-- Check for functions that might reference code
SELECT 
    'Functions referencing code:' as check_type,
    proname as function_name,
    CASE 
        WHEN pg_get_functiondef(oid) LIKE '%categories.code%' THEN '❌ REFERENCES categories.code'
        WHEN pg_get_functiondef(oid) LIKE '%code%' THEN '⚠️  REFERENCES code (check if safe)'
        ELSE '✅ CLEAN'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(oid) LIKE '%code%'
ORDER BY status, proname;

-- ============================================================================
-- 9. SUMMARY REPORT
-- ============================================================================
SELECT '=== 9. MIGRATION SUMMARY ===' as section;

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
    'Migration Status:' as status_type,
    CASE 
        WHEN NOT code_column_exists 
             AND tables_with_category_id >= 10 
             AND legacy_category_columns = 0 
             AND views_with_code_refs = 0
        THEN '✅ MIGRATION COMPLETE'
        ELSE '❌ MIGRATION INCOMPLETE'
    END as overall_status,
    'Code column removed: ' || CASE WHEN NOT code_column_exists THEN 'YES' ELSE 'NO' END as code_removed,
    'Tables with category_id: ' || tables_with_category_id as category_id_tables,
    'Legacy category columns: ' || legacy_category_columns as legacy_columns,
    'Views with code refs: ' || views_with_code_refs as code_references
FROM migration_status;

SELECT '=== VERIFICATION COMPLETE ===' as info;
