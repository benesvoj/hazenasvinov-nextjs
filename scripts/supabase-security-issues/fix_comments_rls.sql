-- Fix comments RLS security warning
-- This script enables Row Level Security on the comments table

-- 1. Enable Row Level Security on comments table
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for comments table
-- This table contains project management comments with user emails, so we need proper access control

-- Policy 1: Allow all authenticated users to read comments
-- Comments are generally public within the organization for project management
CREATE POLICY "Allow authenticated users to read comments" ON comments
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow users to insert comments (they can add their own comments)
CREATE POLICY "Allow authenticated users to insert comments" ON comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Users can only insert comments with their own email
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Policy 3: Allow users to update their own comments
CREATE POLICY "Allow users to update their own comments" ON comments
    FOR UPDATE
    TO authenticated
    USING (
        -- Users can only update comments with their own email
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        -- Users can only update comments with their own email
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Policy 4: Allow users to delete their own comments
CREATE POLICY "Allow users to delete their own comments" ON comments
    FOR DELETE
    TO authenticated
    USING (
        -- Users can only delete comments with their own email
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Policy 5: Allow admins to perform all operations on any comment
CREATE POLICY "Allow admins full access to comments" ON comments
    FOR ALL
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

-- 3. Grant necessary permissions
GRANT SELECT ON comments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON comments TO authenticated;

-- 4. Add comment explaining the table's purpose and RLS setup
COMMENT ON TABLE comments IS 'Project management comments - public read, users can manage their own, admins have full access';
COMMENT ON POLICY "Allow authenticated users to read comments" ON comments IS 'All authenticated users can read comments for project collaboration';
COMMENT ON POLICY "Allow authenticated users to insert comments" ON comments IS 'Users can add comments with their own email address';
COMMENT ON POLICY "Allow users to update their own comments" ON comments IS 'Users can only update comments they created';
COMMENT ON POLICY "Allow users to delete their own comments" ON comments IS 'Users can only delete comments they created';
COMMENT ON POLICY "Allow admins full access to comments" ON comments IS 'Admins can perform all operations on any comment';

-- 5. Verify RLS is enabled and policies are created
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE tablename = 'comments' 
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
WHERE tablename = 'comments' 
AND schemaname = 'public'
ORDER BY policyname;
