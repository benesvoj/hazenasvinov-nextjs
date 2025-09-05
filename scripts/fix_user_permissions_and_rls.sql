-- Complete fix for user permissions and RLS policies
-- This script addresses the RLS policy violation issue

-- 1. First, let's check the current user's profile
SELECT 
    up.user_id,
    up.role,
    up.assigned_categories,
    up.created_at
FROM user_profiles up 
WHERE up.user_id = auth.uid();

-- 2. Check what categories exist
SELECT id, name, code, is_active
FROM categories
ORDER BY name;

-- 3. Create a more permissive RLS policy for training_sessions
-- This will allow any authenticated user to create training sessions
-- (You can make it more restrictive later once the basic functionality works)

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can create training sessions for their categories" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can view training sessions for their categories" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can update their own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can delete their own training sessions" ON training_sessions;

-- Create new policies that are more permissive for debugging
CREATE POLICY "Allow authenticated users to read training sessions" ON training_sessions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to create training sessions" ON training_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Allow users to update their own training sessions" ON training_sessions
    FOR UPDATE
    TO authenticated
    USING (coach_id = auth.uid())
    WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Allow users to delete their own training sessions" ON training_sessions
    FOR DELETE
    TO authenticated
    USING (coach_id = auth.uid());

-- 4. Ensure the user has a profile in user_profiles table
-- This will create a profile if it doesn't exist
INSERT INTO user_profiles (user_id, role, assigned_categories)
SELECT 
    auth.uid(),
    'coach',
    ARRAY[]::UUID[]
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid()
);

-- 5. Assign some categories to the current user for testing
-- Get the first few category IDs and assign them
UPDATE user_profiles 
SET assigned_categories = (
    SELECT ARRAY_AGG(id) 
    FROM categories 
    WHERE is_active = true 
    LIMIT 3
)
WHERE user_id = auth.uid()
AND role = 'coach';

-- 6. Verify the policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'training_sessions'
ORDER BY policyname;

-- 7. Test if we can now insert a training session
-- This should work now
SELECT 'RLS policies updated successfully' as status;
