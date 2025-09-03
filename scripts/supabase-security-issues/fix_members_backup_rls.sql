-- Fix members_backup RLS security warning
-- This script enables Row Level Security on the members_backup table

-- 1. Enable Row Level Security on members_backup table
ALTER TABLE members_backup ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for members_backup table
-- This table contains sensitive member backup data, so we need strict access control

-- Policy 1: Allow admins to read members_backup data
-- Only admins should have access to backup member data
CREATE POLICY "Allow admins to read members_backup" ON members_backup
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 2: Allow admins to insert into members_backup
-- Only admins should be able to create backup data
CREATE POLICY "Allow admins to insert members_backup" ON members_backup
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update members_backup
-- Only admins should be able to modify backup data
CREATE POLICY "Allow admins to update members_backup" ON members_backup
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

-- Policy 4: Allow admins to delete from members_backup
-- Only admins should be able to delete backup data
CREATE POLICY "Allow admins to delete members_backup" ON members_backup
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
GRANT SELECT ON members_backup TO authenticated;
GRANT INSERT, UPDATE, DELETE ON members_backup TO authenticated;

-- 4. Add comment explaining the table's purpose and RLS setup
COMMENT ON TABLE members_backup IS 'Backup table for members data - admin-only access for sensitive member information';
COMMENT ON POLICY "Allow admins to read members_backup" ON members_backup IS 'Only admins can read backup member data';
COMMENT ON POLICY "Allow admins to insert members_backup" ON members_backup IS 'Only admins can create backup member data';
COMMENT ON POLICY "Allow admins to update members_backup" ON members_backup IS 'Only admins can update backup member data';
COMMENT ON POLICY "Allow admins to delete members_backup" ON members_backup IS 'Only admins can delete backup member data';

-- 5. Verify RLS is enabled and policies are created
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE tablename = 'members_backup' 
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
WHERE tablename = 'members_backup' 
AND schemaname = 'public'
ORDER BY policyname;
