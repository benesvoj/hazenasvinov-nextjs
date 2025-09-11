-- Fix database views that depend on categories.code before dropping the column
-- This script updates views to use category_id instead of code

-- First, let's see what these views currently look like
SELECT '=== CURRENT VIEW DEFINITIONS ===' as info;

-- Check club_category_details view
SELECT 'club_category_details view:' as view_name, definition 
FROM pg_views 
WHERE viewname = 'club_category_details';

-- Check user_role_summary view  
SELECT 'user_role_summary view:' as view_name, definition 
FROM pg_views 
WHERE viewname = 'user_role_summary';

-- Now let's recreate the views with category_id instead of code
-- We'll need to join with categories table to get the category information

-- Drop and recreate club_category_details view
DROP VIEW IF EXISTS club_category_details CASCADE;

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

-- Drop and recreate user_role_summary view
DROP VIEW IF EXISTS user_role_summary CASCADE;

CREATE VIEW user_role_summary AS
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.category_id,
    c.name as category_name,
    ur.is_active,
    ur.created_at,
    ur.updated_at
FROM user_roles ur
LEFT JOIN categories c ON ur.category_id = c.id;

-- Verify the views were created successfully
SELECT '=== UPDATED VIEW DEFINITIONS ===' as info;

SELECT 'club_category_details view:' as view_name, definition 
FROM pg_views 
WHERE viewname = 'club_category_details';

SELECT 'user_role_summary view:' as view_name, definition 
FROM pg_views 
WHERE viewname = 'user_role_summary';

-- Test the views to make sure they work
SELECT '=== TESTING VIEWS ===' as info;

SELECT 'club_category_details test:' as test_name, COUNT(*) as row_count
FROM club_category_details;

SELECT 'user_role_summary test:' as test_name, COUNT(*) as row_count  
FROM user_role_summary;

SELECT '=== VIEWS FIXED SUCCESSFULLY ===' as info;
SELECT 'You can now run the remove_categories_code_column_corrected.sql script' as next_step;
