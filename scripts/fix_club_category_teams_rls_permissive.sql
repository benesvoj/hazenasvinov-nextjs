-- Fix club_category_teams RLS to be more permissive for team generation
-- This script updates the RLS policies to allow authenticated users to create club_category_teams
-- when they have proper context (needed for team generation from categories)

-- First, drop existing restrictive policies
DROP POLICY IF EXISTS "Allow admins to insert club_category_teams" ON club_category_teams;
DROP POLICY IF EXISTS "Allow admins to update club_category_teams" ON club_category_teams;
DROP POLICY IF EXISTS "Allow admins to delete club_category_teams" ON club_category_teams;

-- Create more permissive policies that allow authenticated users to manage club_category_teams
-- This is needed for the team generation functionality

-- Policy 1: Allow all authenticated users to read club_category_teams data (keep existing)
-- This policy should already exist, but let's ensure it's there
DROP POLICY IF EXISTS "Allow authenticated users to read club_category_teams" ON club_category_teams;
CREATE POLICY "Allow authenticated users to read club_category_teams" ON club_category_teams
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow authenticated users to insert club_category_teams
-- This is needed for team generation functionality
CREATE POLICY "Allow authenticated users to insert club_category_teams" ON club_category_teams
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy 3: Allow authenticated users to update club_category_teams
-- This is needed for updating team information and suffixes
CREATE POLICY "Allow authenticated users to update club_category_teams" ON club_category_teams
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete club_category_teams
-- This is needed for removing team records
CREATE POLICY "Allow authenticated users to delete club_category_teams" ON club_category_teams
    FOR DELETE
    TO authenticated
    USING (true);

-- Update comments to reflect the new permissive approach
COMMENT ON POLICY "Allow authenticated users to read club_category_teams" ON club_category_teams IS 'All authenticated users can read team information (public data)';
COMMENT ON POLICY "Allow authenticated users to insert club_category_teams" ON club_category_teams IS 'All authenticated users can create team records (needed for team generation)';
COMMENT ON POLICY "Allow authenticated users to update club_category_teams" ON club_category_teams IS 'All authenticated users can update team records (needed for team management)';
COMMENT ON POLICY "Allow authenticated users to delete club_category_teams" ON club_category_teams IS 'All authenticated users can delete team records (needed for team cleanup)';

-- Verify the policies are created
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
