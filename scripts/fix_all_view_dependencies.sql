-- Comprehensive script to fix all database views that depend on categories.code
-- This script will update all views to use category_id instead of code

-- First, let's see what we're working with
SELECT '=== ANALYZING CURRENT VIEWS ===' as info;

-- Get all views that might reference categories.code
SELECT 
    viewname,
    CASE 
        WHEN definition LIKE '%categories.code%' THEN 'DIRECT_REFERENCE'
        WHEN definition LIKE '%code%' THEN 'POSSIBLE_REFERENCE'
        ELSE 'NO_REFERENCE'
    END as reference_type,
    LENGTH(definition) as definition_length
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY reference_type, viewname;

-- Now let's fix the specific views mentioned in the error

-- 1. Fix club_category_details view
SELECT '=== FIXING club_category_details VIEW ===' as info;

-- First, let's see the current definition
SELECT 'Current club_category_details definition:' as info;
SELECT definition FROM pg_views WHERE viewname = 'club_category_details';

-- Drop the view
DROP VIEW IF EXISTS club_category_details CASCADE;

-- Recreate with category_id instead of code
CREATE VIEW club_category_details AS
SELECT 
    cc.id,
    cc.club_id,
    cc.category_id,
    c.name as category_name,
    c.description as category_description,
    c.is_active as category_is_active,
    cc.is_active,
    cc.created_at,
    cc.updated_at
FROM club_categories cc
JOIN categories c ON cc.category_id = c.id;

-- 2. Fix user_role_summary view
SELECT '=== FIXING user_role_summary VIEW ===' as info;

-- First, let's see the current definition
SELECT 'Current user_role_summary definition:' as info;
SELECT definition FROM pg_views WHERE viewname = 'user_role_summary';

-- Drop the view
DROP VIEW IF EXISTS user_role_summary CASCADE;

-- Recreate with category_id instead of code
CREATE VIEW user_role_summary AS
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.category_id,
    c.name as category_name,
    c.description as category_description,
    ur.is_active,
    ur.created_at,
    ur.updated_at
FROM user_roles ur
LEFT JOIN categories c ON ur.category_id = c.id;

-- Verify the views were created successfully
SELECT '=== VERIFICATION ===' as info;

-- Test the views
SELECT 'club_category_details row count:' as test, COUNT(*) as count FROM club_category_details;
SELECT 'user_role_summary row count:' as test, COUNT(*) as count FROM user_role_summary;

-- Show the new view definitions
SELECT 'New club_category_details definition:' as info;
SELECT definition FROM pg_views WHERE viewname = 'club_category_details';

SELECT 'New user_role_summary definition:' as info;
SELECT definition FROM pg_views WHERE viewname = 'user_role_summary';

-- Check if there are any remaining dependencies on categories.code
SELECT '=== CHECKING FOR REMAINING DEPENDENCIES ===' as info;

SELECT 
    'Remaining views with code reference:' as check_type,
    viewname,
    CASE 
        WHEN definition LIKE '%categories.code%' THEN 'STILL_HAS_CATEGORIES_CODE'
        WHEN definition LIKE '%code%' THEN 'HAS_CODE_REFERENCE'
        ELSE 'CLEAN'
    END as status
FROM pg_views 
WHERE schemaname = 'public'
  AND (definition LIKE '%categories.code%' OR definition LIKE '%code%')
ORDER BY status, viewname;

SELECT '=== VIEWS FIXED SUCCESSFULLY ===' as info;
SELECT 'You can now run the remove_categories_code_column_corrected.sql script' as next_step;
