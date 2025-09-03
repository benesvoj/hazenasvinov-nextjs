-- Fix club_category_teams RLS security warning
-- This script enables Row Level Security on the club_category_teams table

-- 1. Enable Row Level Security on club_category_teams table
ALTER TABLE club_category_teams ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for club_category_teams table
-- This table contains public team data, so we need appropriate access control

-- Policy 1: Allow all authenticated users to read club_category_teams data
-- This is safe because team information is public data
CREATE POLICY "Allow authenticated users to read club_category_teams" ON club_category_teams
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow admins to insert new club_category_teams
CREATE POLICY "Allow admins to insert club_category_teams" ON club_category_teams
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update club_category_teams
CREATE POLICY "Allow admins to update club_category_teams" ON club_category_teams
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

-- Policy 4: Allow admins to delete club_category_teams
CREATE POLICY "Allow admins to delete club_category_teams" ON club_category_teams
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
GRANT SELECT ON club_category_teams TO authenticated;
GRANT INSERT, UPDATE, DELETE ON club_category_teams TO authenticated;

-- 4. Add comment explaining the table's purpose and RLS setup
COMMENT ON TABLE club_category_teams IS 'Team information for club-category combinations - public read access, admin write access';
COMMENT ON POLICY "Allow authenticated users to read club_category_teams" ON club_category_teams IS 'All authenticated users can read team information (public data)';
COMMENT ON POLICY "Allow admins to insert club_category_teams" ON club_category_teams IS 'Only admins can create new team records';
COMMENT ON POLICY "Allow admins to update club_category_teams" ON club_category_teams IS 'Only admins can update team records';
COMMENT ON POLICY "Allow admins to delete club_category_teams" ON club_category_teams IS 'Only admins can delete team records';

-- 5. Verify RLS is enabled and policies are created
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE tablename = 'club_category_teams' 
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
WHERE tablename = 'club_category_teams' 
AND schemaname = 'public'
ORDER BY policyname;
