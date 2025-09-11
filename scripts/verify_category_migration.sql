-- Verify Category Migration Status
-- This script checks the current state of the category migration across all tables

-- Step 1: Check training_sessions table
SELECT 
    'training_sessions' as table_name,
    COUNT(*) as total_records,
    COUNT(category_id) as records_with_category_id,
    COUNT(*) - COUNT(category_id) as records_missing_category_id,
    CASE 
        WHEN COUNT(*) = COUNT(category_id) THEN '✅ MIGRATED'
        ELSE '❌ NOT MIGRATED'
    END as migration_status
FROM training_sessions;

-- Step 2: Check category_lineup_members table
SELECT 
    'category_lineup_members' as table_name,
    COUNT(*) as total_records,
    COUNT(category_id) as records_with_category_id,
    COUNT(*) - COUNT(category_id) as records_missing_category_id,
    CASE 
        WHEN COUNT(*) = COUNT(category_id) THEN '✅ MIGRATED'
        ELSE '❌ NOT MIGRATED'
    END as migration_status
FROM category_lineup_members;

-- Step 3: Check for orphaned records in training_sessions
SELECT 
    'Orphaned training_sessions' as issue,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO ISSUES'
        ELSE '❌ HAS ORPHANED RECORDS'
    END as status
FROM training_sessions ts
LEFT JOIN categories c ON ts.category_id = c.id
WHERE ts.category_id IS NOT NULL AND c.id IS NULL;

-- Step 4: Check for orphaned records in category_lineup_members
SELECT 
    'Orphaned category_lineup_members' as issue,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO ISSUES'
        ELSE '❌ HAS ORPHANED RECORDS'
    END as status
FROM category_lineup_members clm
LEFT JOIN categories c ON clm.category_id = c.id
WHERE clm.category_id IS NOT NULL AND c.id IS NULL;

-- Step 5: Check categories table structure
SELECT 
    'categories' as table_name,
    COUNT(*) as total_categories,
    COUNT(code) as categories_with_code,
    COUNT(slug) as categories_with_slug,
    CASE 
        WHEN COUNT(code) = COUNT(*) THEN '✅ ALL HAVE CODE'
        ELSE '⚠️ SOME MISSING CODE'
    END as code_status
FROM categories;

-- Step 6: Show sample of categories
SELECT 
    'Sample categories' as info,
    id,
    code,
    name,
    slug,
    is_active
FROM categories
ORDER BY name
LIMIT 10;

-- Step 7: Check for any remaining legacy category columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'category'
AND data_type = 'character varying'
ORDER BY table_name;

-- Step 8: Check for any remaining legacy category code columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'code'
AND data_type = 'character varying'
ORDER BY table_name;

-- Step 9: Summary report
DO $$ 
DECLARE
    training_sessions_migrated BOOLEAN;
    lineup_members_migrated BOOLEAN;
    total_tables INTEGER;
    migrated_tables INTEGER;
BEGIN
    -- Check if training_sessions is fully migrated
    SELECT COUNT(*) = COUNT(category_id) INTO training_sessions_migrated
    FROM training_sessions;
    
    -- Check if category_lineup_members is fully migrated
    SELECT COUNT(*) = COUNT(category_id) INTO lineup_members_migrated
    FROM category_lineup_members;
    
    -- Count total tables that should be migrated
    SELECT COUNT(*) INTO total_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('training_sessions', 'category_lineup_members');
    
    -- Count migrated tables
    migrated_tables := 0;
    IF training_sessions_migrated THEN
        migrated_tables := migrated_tables + 1;
    END IF;
    IF lineup_members_migrated THEN
        migrated_tables := migrated_tables + 1;
    END IF;
    
    -- Report summary
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Training sessions migrated: %', CASE WHEN training_sessions_migrated THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'Lineup members migrated: %', CASE WHEN lineup_members_migrated THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'Tables migrated: %/%', migrated_tables, total_tables;
    
    IF migrated_tables = total_tables THEN
        RAISE NOTICE '🎉 ALL TABLES MIGRATED! Safe to proceed with cleanup.';
    ELSE
        RAISE NOTICE '⚠️ MIGRATION INCOMPLETE! Complete migration before cleanup.';
    END IF;
END $$;
