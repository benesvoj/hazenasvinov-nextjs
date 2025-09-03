-- Fix user_profiles RLS security warning
-- This script enables Row Level Security on the user_profiles table

-- 1. Enable Row Level Security on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for user_profiles table
-- This table contains sensitive user role information, so we need strict access control

-- Policy 1: Allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy 2: Allow users to update their own profile (limited fields)
-- Users can only update non-sensitive fields like assigned_categories
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND
        -- Prevent users from changing their own role
        role = (SELECT role FROM user_profiles WHERE user_id = auth.uid())
    );

-- Policy 3: Allow admins to read all user profiles
CREATE POLICY "Admins can read all user profiles" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 4: Allow admins to insert new user profiles
CREATE POLICY "Admins can insert user profiles" ON user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 5: Allow admins to update any user profile
CREATE POLICY "Admins can update any user profile" ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 6: Allow admins to delete user profiles
CREATE POLICY "Admins can delete user profiles" ON user_profiles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- 3. Grant necessary permissions
GRANT SELECT ON user_profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_profiles TO authenticated;

-- 4. Add comment explaining the table's purpose and RLS setup
COMMENT ON TABLE user_profiles IS 'User profile information including roles - strict access control with RLS';
COMMENT ON POLICY "Users can read their own profile" ON user_profiles IS 'Users can only read their own profile data';
COMMENT ON POLICY "Users can update their own profile" ON user_profiles IS 'Users can update their own profile but cannot change their role';
COMMENT ON POLICY "Admins can read all user profiles" ON user_profiles IS 'Admins can read all user profile data';
COMMENT ON POLICY "Admins can insert user profiles" ON user_profiles IS 'Only admins can create new user profiles';
COMMENT ON POLICY "Admins can update any user profile" ON user_profiles IS 'Only admins can update any user profile';
COMMENT ON POLICY "Admins can delete user profiles" ON user_profiles IS 'Only admins can delete user profiles';

-- 5. Verify RLS is enabled and policies are created
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE tablename = 'user_profiles' 
AND schemaname = 'public';

-- 6. Show created policies
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
AND schemaname = 'public'
ORDER BY policyname;
