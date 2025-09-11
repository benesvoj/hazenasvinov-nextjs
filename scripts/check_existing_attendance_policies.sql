-- Check existing attendance policies to see the correct column names
-- Run this in Supabase SQL Editor

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
WHERE tablename = 'member_attendance'
ORDER BY policyname;

-- Also check the user_roles table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
ORDER BY ordinal_position;
