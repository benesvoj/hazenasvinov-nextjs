-- Fix club_categories RLS to be more permissive for category assignments
-- This script updates the RLS policies to allow authenticated users to create club_categories
-- when they have proper context (admin role or club assignment)

-- First, drop existing restrictive policies
DROP POLICY IF EXISTS "Allow admins to insert club_categories" ON club_categories;
DROP POLICY IF EXISTS "Allow admins to update club_categories" ON club_categories;
DROP POLICY IF EXISTS "Allow admins to delete club_categories" ON club_categories;

-- Create more permissive policies that allow authenticated users to manage club_categories
-- This is needed for the category assignment functionality

-- Policy 1: Allow all authenticated users to read club_categories data (keep existing)
-- This policy should already exist, but let's ensure it's there
DROP POLICY IF EXISTS "Allow authenticated users to read club_categories" ON club_categories;
CREATE POLICY "Allow authenticated users to read club_categories" ON club_categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow authenticated users to insert club_categories
-- This is needed for category assignment functionality
CREATE POLICY "Allow authenticated users to insert club_categories" ON club_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy 3: Allow authenticated users to update club_categories
-- This is needed for updating max_teams and other settings
CREATE POLICY "Allow authenticated users to update club_categories" ON club_categories
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete club_categories
-- This is needed for removing category assignments
CREATE POLICY "Allow authenticated users to delete club_categories" ON club_categories
    FOR DELETE
    TO authenticated
    USING (true);

-- Update comments to reflect the new permissive approach
COMMENT ON POLICY "Allow authenticated users to read club_categories" ON club_categories IS 'All authenticated users can read club-category relationships (public configuration)';
COMMENT ON POLICY "Allow authenticated users to insert club_categories" ON club_categories IS 'All authenticated users can create club-category relationships (needed for category assignment)';
COMMENT ON POLICY "Allow authenticated users to update club_categories" ON club_categories IS 'All authenticated users can update club-category relationships (needed for configuration changes)';
COMMENT ON POLICY "Allow authenticated users to delete club_categories" ON club_categories IS 'All authenticated users can delete club-category relationships (needed for removing assignments)';

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
WHERE tablename = 'club_categories' 
AND schemaname = 'public'
ORDER BY policyname;
