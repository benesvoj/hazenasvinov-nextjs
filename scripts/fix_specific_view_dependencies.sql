-- Fix the specific database views that depend on categories.code
-- Based on the actual view definitions provided

SELECT '=== FIXING SPECIFIC VIEW DEPENDENCIES ===' as info;

-- 1. Fix club_category_details view
-- Current view uses: cat.code AS category_code
-- New view will use: cat.id AS category_id and cat.name AS category_name

SELECT '=== DROPPING club_category_details VIEW ===' as info;
DROP VIEW IF EXISTS club_category_details CASCADE;

SELECT '=== RECREATING club_category_details VIEW ===' as info;
CREATE VIEW club_category_details AS
SELECT 
    cc.id,
    c.name AS club_name,
    c.short_name AS club_short_name,
    cat.id AS category_id,
    cat.name AS category_name,
    cat.description AS category_description,
    cc.max_teams,
    cc.is_active,
    cc.created_at,
    count(cct.id) AS current_teams
FROM club_categories cc
JOIN clubs c ON cc.club_id = c.id
JOIN categories cat ON cc.category_id = cat.id
LEFT JOIN club_category_teams cct ON cc.id = cct.club_category_id
GROUP BY cc.id, c.name, c.short_name, cat.id, cat.name, cat.description, cc.max_teams, cc.is_active, cc.created_at;

-- 2. Fix user_role_summary view  
-- Current view uses: c.code AS assigned_category_codes
-- New view will use: c.id AS assigned_category_ids and c.name AS assigned_category_names

SELECT '=== DROPPING user_role_summary VIEW ===' as info;
DROP VIEW IF EXISTS user_role_summary CASCADE;

SELECT '=== RECREATING user_role_summary VIEW ===' as info;
CREATE VIEW user_role_summary AS
SELECT 
    up.user_id,
    up.role AS profile_role,
    CASE
        WHEN up.role IS NOT NULL THEN ARRAY[up.role]
        ELSE ARRAY[]::text[]
    END AS roles,
    COALESCE(up.assigned_categories, ARRAY[]::uuid[]) AS assigned_categories,
    COALESCE(array_agg(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL), ARRAY[]::uuid[]) AS assigned_category_ids,
    COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), ARRAY[]::text[]) AS assigned_category_names
FROM user_profiles up
LEFT JOIN categories c ON c.id = ANY(COALESCE(up.assigned_categories, ARRAY[]::uuid[]))
GROUP BY up.user_id, up.role, up.assigned_categories;

-- Verify the views were created successfully
SELECT '=== VERIFICATION ===' as info;

-- Test the views
SELECT 'club_category_details row count:' as test, COUNT(*) as count FROM club_category_details;
SELECT 'user_role_summary row count:' as test, COUNT(*) as count FROM user_role_summary;

-- Show sample data from the views
SELECT '=== SAMPLE DATA FROM club_category_details ===' as info;
SELECT 
    club_name, 
    club_short_name, 
    category_id, 
    category_name, 
    current_teams 
FROM club_category_details 
LIMIT 3;

SELECT '=== SAMPLE DATA FROM user_role_summary ===' as info;
SELECT 
    user_id, 
    profile_role, 
    assigned_category_ids, 
    assigned_category_names 
FROM user_role_summary 
LIMIT 3;

-- Check for any remaining dependencies on categories.code
SELECT '=== CHECKING FOR REMAINING DEPENDENCIES ===' as info;

SELECT 
    'Remaining views with code reference:' as check_type,
    viewname,
    CASE 
        WHEN definition LIKE '%categories.code%' THEN 'STILL_HAS_CATEGORIES_CODE'
        WHEN definition LIKE '%cat.code%' THEN 'STILL_HAS_CAT_CODE'
        WHEN definition LIKE '%c.code%' THEN 'STILL_HAS_C_CODE'
        WHEN definition LIKE '%code%' THEN 'HAS_CODE_REFERENCE'
        ELSE 'CLEAN'
    END as status
FROM pg_views 
WHERE schemaname = 'public'
  AND (definition LIKE '%code%')
ORDER BY status, viewname;

SELECT '=== VIEWS FIXED SUCCESSFULLY ===' as info;
SELECT 'You can now run the remove_categories_code_column_corrected.sql script' as next_step;
