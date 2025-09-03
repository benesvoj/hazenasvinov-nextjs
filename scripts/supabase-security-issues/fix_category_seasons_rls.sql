-- Fix category_seasons RLS security warning
-- This script enables Row Level Security on the category_seasons table

-- 1. Enable Row Level Security on category_seasons table
ALTER TABLE category_seasons ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for category_seasons table
-- This table contains public competition configuration data, so we need appropriate access control

-- Policy 1: Allow all authenticated users to read category_seasons data
-- This is safe because category-season relationships are public configuration data
CREATE POLICY "Allow authenticated users to read category_seasons" ON category_seasons
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow admins to insert new category_seasons relationships
CREATE POLICY "Allow admins to insert category_seasons" ON category_seasons
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update category_seasons relationships
CREATE POLICY "Allow admins to update category_seasons" ON category_seasons
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

-- Policy 4: Allow admins to delete category_seasons relationships
CREATE POLICY "Allow admins to delete category_seasons" ON category_seasons
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
GRANT SELECT ON category_seasons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON category_seasons TO authenticated;

-- 4. Add comment explaining the table's purpose and RLS setup
COMMENT ON TABLE category_seasons IS 'Junction table for category-season relationships - public read access, admin write access';
COMMENT ON POLICY "Allow authenticated users to read category_seasons" ON category_seasons IS 'All authenticated users can read category-season relationships (public configuration)';
COMMENT ON POLICY "Allow admins to insert category_seasons" ON category_seasons IS 'Only admins can create new category-season relationships';
COMMENT ON POLICY "Allow admins to update category_seasons" ON category_seasons IS 'Only admins can update category-season relationships';
COMMENT ON POLICY "Allow admins to delete category_seasons" ON category_seasons IS 'Only admins can delete category-season relationships';

-- 5. Verify RLS is enabled and policies are created
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE tablename = 'category_seasons' 
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
WHERE tablename = 'category_seasons' 
AND schemaname = 'public'
ORDER BY policyname;
