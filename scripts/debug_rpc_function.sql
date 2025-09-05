-- Debug script for get_training_sessions RPC function
-- This will help identify why the RPC function returns empty results

-- 1. Check current user's profile and assigned categories
SELECT 
    up.user_id,
    up.role,
    up.assigned_categories,
    up.created_at
FROM user_profiles up 
WHERE up.user_id = auth.uid();

-- 2. Check what categories the user has assigned
SELECT 
    c.id,
    c.name,
    c.code,
    c.is_active
FROM categories c
WHERE c.id = ANY(
    SELECT unnest(up.assigned_categories)
    FROM user_profiles up 
    WHERE up.user_id = auth.uid()
);

-- 3. Check what training sessions exist
SELECT 
    id,
    title,
    category,
    season_id,
    coach_id,
    created_at
FROM training_sessions
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check what categories exist in the system
SELECT 
    id,
    name,
    code,
    is_active
FROM categories
ORDER BY name;

-- 5. Test the RPC function with debug information
-- Replace 'your-category-code' and 'your-season-id' with actual values
-- SELECT * FROM get_training_sessions('your-category-code', 'your-season-id', auth.uid());

-- 6. Check if there's a mismatch between category codes
-- This query will show if the category codes match between training_sessions and categories
SELECT DISTINCT 
    ts.category as training_session_category,
    c.code as category_code,
    c.name as category_name
FROM training_sessions ts
LEFT JOIN categories c ON c.code = ts.category
ORDER BY ts.category;
