-- Check which database objects depend on categories.code column
-- This will help us understand what needs to be updated before dropping the column

SELECT '=== DEPENDENCIES ON CATEGORIES.CODE ===' as info;

-- Check for views that depend on categories.code
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition LIKE '%categories.code%' 
   OR definition LIKE '%code%'
ORDER BY viewname;

-- Check for functions that might depend on categories.code
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%categories.code%'
   OR pg_get_functiondef(p.oid) LIKE '%code%'
ORDER BY p.proname;

-- Check for triggers that might depend on categories.code
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE pg_get_triggerdef(t.oid) LIKE '%categories.code%'
   OR pg_get_triggerdef(t.oid) LIKE '%code%'
ORDER BY t.tgname;

-- Check for constraints that might depend on categories.code
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE cc.check_clause LIKE '%categories.code%'
   OR cc.check_clause LIKE '%code%'
ORDER BY tc.table_name, tc.constraint_name;

SELECT '=== END OF DEPENDENCY CHECK ===' as info;
