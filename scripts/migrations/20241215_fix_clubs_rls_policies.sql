-- Fix RLS policies for clubs table to allow admin users to create clubs
-- This migration ensures admin users can create, read, update, and delete clubs

-- First, let's check current policies and drop them if they exist
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view clubs" ON clubs;
    DROP POLICY IF EXISTS "Users can insert clubs" ON clubs;
    DROP POLICY IF EXISTS "Users can update clubs" ON clubs;
    DROP POLICY IF EXISTS "Users can delete clubs" ON clubs;
    DROP POLICY IF EXISTS "Admin users can manage clubs" ON clubs;
    DROP POLICY IF EXISTS "Public can view clubs" ON clubs;
    DROP POLICY IF EXISTS "Authenticated users can manage clubs" ON clubs;
END $$;

-- Create comprehensive RLS policies for clubs table

-- Policy 1: Allow public read access to clubs (for public pages)
CREATE POLICY "Public can view clubs" ON clubs
    FOR SELECT
    USING (true);

-- Policy 2: Allow authenticated users with admin role to manage clubs
CREATE POLICY "Admin users can manage clubs" ON clubs
    FOR ALL
    USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 3: Allow authenticated users with coach role to view clubs
CREATE POLICY "Coaches can view clubs" ON clubs
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coach', 'head_coach')
        )
    );

-- Policy 4: Allow service role to manage clubs (for server-side operations)
CREATE POLICY "Service role can manage clubs" ON clubs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Add comment to the table
COMMENT ON TABLE clubs IS 'Clubs table with RLS policies for admin, coach, and public access';

-- Verify RLS is enabled
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Show the policies that were created
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'clubs'
ORDER BY policyname;
