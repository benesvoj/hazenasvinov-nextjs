-- Fix club_teams RLS security warning
-- This script enables Row Level Security on the club_teams table

-- 1. Enable Row Level Security on club_teams table
ALTER TABLE club_teams ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for club_teams table
-- Since this table contains public club-team relationships, we'll allow read access to all authenticated users
-- and write access only to admins

-- Policy 1: Allow all authenticated users to read club_teams data
-- This is safe because club-team relationships are public information
CREATE POLICY "Allow authenticated users to read club_teams" ON club_teams
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow admins to insert new club_teams relationships
CREATE POLICY "Allow admins to insert club_teams" ON club_teams
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update club_teams relationships
CREATE POLICY "Allow admins to update club_teams" ON club_teams
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

-- Policy 4: Allow admins to delete club_teams relationships
CREATE POLICY "Allow admins to delete club_teams" ON club_teams
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
GRANT SELECT ON club_teams TO authenticated;
GRANT INSERT, UPDATE, DELETE ON club_teams TO authenticated;

-- 4. Add comment explaining the table's purpose and RLS setup
COMMENT ON TABLE club_teams IS 'Junction table linking clubs to teams - public read access, admin write access';
COMMENT ON POLICY "Allow authenticated users to read club_teams" ON club_teams IS 'All authenticated users can read club-team relationships (public information)';
COMMENT ON POLICY "Allow admins to insert club_teams" ON club_teams IS 'Only admins can create new club-team relationships';
COMMENT ON POLICY "Allow admins to update club_teams" ON club_teams IS 'Only admins can update club-team relationships';
COMMENT ON POLICY "Allow admins to delete club_teams" ON club_teams IS 'Only admins can delete club-team relationships';

-- 5. Verify RLS is enabled and policies are created
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE tablename = 'club_teams' 
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
WHERE tablename = 'club_teams' 
AND schemaname = 'public'
ORDER BY policyname;
