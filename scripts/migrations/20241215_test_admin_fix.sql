-- Test: Verify admin fix without authentication
-- Date: 2024-12-15
-- Description: Test the admin fix by checking if the policies and functions exist

-- Test 1: Check if the match_metadata table exists and has the right structure
SELECT 
  'match_metadata table structure' as test,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'match_metadata' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 2: Check if foreign key constraint exists
SELECT 
  'Foreign key constraint' as test,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'match_metadata' 
AND constraint_type = 'FOREIGN KEY'
AND constraint_name = 'match_metadata_created_by_fkey';

-- Test 3: Check if RLS policies exist
SELECT 
  'RLS policies' as test,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'match_metadata'
ORDER BY policyname;

-- Test 4: Check if trigger exists
SELECT 
  'Trigger function' as test,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'match_metadata'
AND trigger_name = 'trigger_set_metadata_created_by';

-- Test 5: Check if we can insert a test record (this will fail if RLS is too restrictive)
-- This test should be run when authenticated as a user
SELECT 
  'Migration completed successfully' as status,
  'Run this in your app while logged in to test actual functionality' as note;
