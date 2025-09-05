-- Fix vojtechbe@gmail.com admin access
-- Run this in your Supabase SQL Editor

-- Step 1: First, you need to get the user ID for vojtechbe@gmail.com
-- Go to Supabase Dashboard > Authentication > Users
-- Find vojtechbe@gmail.com and copy the user ID
-- Replace 'USER_ID_HERE' below with the actual user ID

-- Step 2: Create user profile with admin role
INSERT INTO user_profiles (user_id, role, created_at)
VALUES ('USER_ID_HERE', 'admin', NOW())
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- Step 3: Add admin role to user_roles table
INSERT INTO user_roles (user_id, role, created_at)
VALUES ('USER_ID_HERE', 'admin', NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Verify the setup
SELECT 
    u.id as user_id,
    u.email,
    up.role as profile_role,
    ur.role as user_role,
    up.created_at as profile_created
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'vojtechbe@gmail.com';

-- If the above query returns no results, vojtechbe@gmail.com doesn't exist in auth.users
-- In that case, you need to create the user first in the Supabase dashboard
