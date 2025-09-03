-- Fix clubs RLS security warning
-- This script enables Row Level Security on the clubs table

-- 1. Enable Row Level Security on clubs table
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for clubs table
-- This table contains public club information, so we need appropriate access control

-- Policy 1: Allow all authenticated users to read clubs data
-- This is safe because club information is public data
CREATE POLICY "Allow authenticated users to read clubs" ON clubs
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow admins to insert new clubs
CREATE POLICY "Allow admins to insert clubs" ON clubs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update clubs
CREATE POLICY "Allow admins to update clubs" ON clubs
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

-- Policy 4: Allow admins to delete clubs
CREATE POLICY "Allow admins to delete clubs" ON clubs
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
GRANT SELECT ON clubs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON clubs TO authenticated;

-- 4. Add comment explaining the table's purpose and RLS setup
COMMENT ON TABLE clubs IS 'Club information - public read access, admin write access';
COMMENT ON POLICY "Allow authenticated users to read clubs" ON clubs IS 'All authenticated users can read club information (public data)';
COMMENT ON POLICY "Allow admins to insert clubs" ON clubs IS 'Only admins can create new clubs';
COMMENT ON POLICY "Allow admins to update clubs" ON clubs IS 'Only admins can update club information';
COMMENT ON POLICY "Allow admins to delete clubs" ON clubs IS 'Only admins can delete clubs';

-- 5. Verify RLS is enabled and policies are created
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE tablename = 'clubs' 
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
WHERE tablename = 'clubs' 
AND schemaname = 'public'
ORDER BY policyname;
