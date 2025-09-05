-- Debug script to check user permissions for training_sessions
-- Run this in Supabase SQL Editor to diagnose RLS policy issues

-- 1. Check current user
SELECT auth.uid() as current_user_id;

-- 2. Check user profile and role
SELECT 
    up.user_id,
    up.role,
    up.assigned_categories,
    up.created_at
FROM user_profiles up 
WHERE up.user_id = auth.uid();

-- 3. Check if user has any assigned categories
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

-- 4. Check the RLS policies on training_sessions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'training_sessions'
ORDER BY policyname;

-- 5. Test if the user can see any training sessions (SELECT policy test)
SELECT COUNT(*) as visible_sessions
FROM training_sessions;

-- 6. Check if there are any training sessions in the database
SELECT 
    id,
    title,
    category,
    season_id,
    coach_id,
    created_at
FROM training_sessions
LIMIT 5;

-- 7. Check seasons table to see if the season_id exists
SELECT 
    id,
    name,
    is_active,
    start_date,
    end_date
FROM seasons
WHERE id = 'your-season-id-here' -- Replace with actual season ID
LIMIT 1;
