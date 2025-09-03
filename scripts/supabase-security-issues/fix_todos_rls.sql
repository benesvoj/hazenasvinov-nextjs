-- Fix todos RLS security warning
-- This script enables Row Level Security on the todos table

-- 1. Enable Row Level Security on todos table
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for todos table
-- This table contains project management todos with user emails, so we need proper access control

-- Policy 1: Allow all authenticated users to read todos
-- Todos are generally public within the organization for project management
CREATE POLICY "Allow authenticated users to read todos" ON todos
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow users to insert todos (they can add their own todos)
CREATE POLICY "Allow authenticated users to insert todos" ON todos
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Users can only insert todos with their own email
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Policy 3: Allow users to update their own todos
CREATE POLICY "Allow users to update their own todos" ON todos
    FOR UPDATE
    TO authenticated
    USING (
        -- Users can only update todos with their own email
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        -- Users can only update todos with their own email
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Policy 4: Allow users to delete their own todos
CREATE POLICY "Allow users to delete their own todos" ON todos
    FOR DELETE
    TO authenticated
    USING (
        -- Users can only delete todos with their own email
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Policy 5: Allow admins to perform all operations on any todo
CREATE POLICY "Allow admins full access to todos" ON todos
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
GRANT SELECT ON todos TO authenticated;
GRANT INSERT, UPDATE, DELETE ON todos TO authenticated;

-- 4. Add comment explaining the table's purpose and RLS setup
COMMENT ON TABLE todos IS 'Project management todos - public read, users can manage their own, admins have full access';
COMMENT ON POLICY "Allow authenticated users to read todos" ON todos IS 'All authenticated users can read todos for project collaboration';
COMMENT ON POLICY "Allow authenticated users to insert todos" ON todos IS 'Users can add todos with their own email address';
COMMENT ON POLICY "Allow users to update their own todos" ON todos IS 'Users can only update todos they created';
COMMENT ON POLICY "Allow users to delete their own todos" ON todos IS 'Users can only delete todos they created';
COMMENT ON POLICY "Allow admins full access to todos" ON todos IS 'Admins can perform all operations on any todo';

-- 5. Verify RLS is enabled and policies are created
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE tablename = 'todos' 
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
WHERE tablename = 'todos' 
AND schemaname = 'public'
ORDER BY policyname;
