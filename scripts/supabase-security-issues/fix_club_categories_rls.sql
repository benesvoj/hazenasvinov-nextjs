-- Fix club_categories RLS security warning
-- This script enables Row Level Security on the club_categories table

-- 1. Enable Row Level Security on club_categories table
ALTER TABLE club_categories ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for club_categories table
-- This table contains public club-category configuration data, so we need appropriate access control

-- Policy 1: Allow all authenticated users to read club_categories data
-- This is safe because club-category relationships are public configuration data
CREATE POLICY "Allow authenticated users to read club_categories" ON club_categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow admins to insert new club_categories relationships
CREATE POLICY "Allow admins to insert club_categories" ON club_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update club_categories relationships
CREATE POLICY "Allow admins to update club_categories" ON club_categories
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

-- Policy 4: Allow admins to delete club_categories relationships
CREATE POLICY "Allow admins to delete club_categories" ON club_categories
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
GRANT SELECT ON club_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON club_categories TO authenticated;

-- 4. Add comment explaining the table's purpose and RLS setup
COMMENT ON TABLE club_categories IS 'Junction table for club-category relationships - public read access, admin write access';
COMMENT ON POLICY "Allow authenticated users to read club_categories" ON club_categories IS 'All authenticated users can read club-category relationships (public configuration)';
COMMENT ON POLICY "Allow admins to insert club_categories" ON club_categories IS 'Only admins can create new club-category relationships';
COMMENT ON POLICY "Allow admins to update club_categories" ON club_categories IS 'Only admins can update club-category relationships';
COMMENT ON POLICY "Allow admins to delete club_categories" ON club_categories IS 'Only admins can delete club-category relationships';

-- 5. Verify RLS is enabled and policies are created
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE tablename = 'club_categories' 
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
WHERE tablename = 'club_categories' 
AND schemaname = 'public'
ORDER BY policyname;
