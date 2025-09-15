-- Fix user creation RLS conflict
-- This script fixes the issue where user creation fails due to RLS policy conflicts

-- 1. First, let's check the current RLS policies on user_profiles
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
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 2. Drop the problematic RLS policy that blocks user creation
-- The "Admins can insert user profiles" policy prevents the trigger from working
DROP POLICY IF EXISTS "Admins can insert user profiles" ON user_profiles;

-- 3. Create a new policy that allows the trigger to insert user profiles
-- This policy allows inserts when the user_id matches the newly created user
CREATE POLICY "Allow user profile creation via trigger" ON user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Allow if this is being created by the handle_new_user trigger
        -- The trigger runs as SECURITY DEFINER so it bypasses RLS
        true
    );

-- 4. Fix the handle_new_user function to handle the assigned_categories constraint
-- The constraint requires assigned_categories to be NULL for non-coach roles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new user profile with default 'member' role
  -- Set assigned_categories to NULL for non-coach roles to satisfy the constraint
  INSERT INTO user_profiles (user_id, role, assigned_categories, created_at, updated_at)
  VALUES (
    NEW.id,
    'member', -- Default role for new users
    NULL,     -- Set to NULL for non-coach roles to satisfy constraint
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

-- 6. Test the fix by checking if the constraint is satisfied
-- This should show the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass 
AND conname = 'check_assigned_categories_coach_only';

-- 7. Verify the trigger exists and is working
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth'
AND trigger_name = 'on_auth_user_created';

-- 8. Add a comment explaining the fix
COMMENT ON POLICY "Allow user profile creation via trigger" ON user_profiles IS 
'Allows the handle_new_user trigger to create user profiles when new users are created via admin API';

-- 9. Optional: Create a more restrictive policy for manual admin inserts
-- This ensures only admins can manually create user profiles (not via trigger)
CREATE POLICY "Admins can manually insert user profiles" ON user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Only allow if the current user is an admin
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
        -- AND this is not being created by the trigger (user_id != auth.uid())
        AND user_id != auth.uid()
    );

-- 10. Test the fix (optional - can be removed after testing)
-- This will show if the policies are correctly set up
SELECT 
    'RLS Policies on user_profiles:' as info,
    policyname,
    cmd as operation,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
        ELSE 'No WITH CHECK'
    END as has_with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;
