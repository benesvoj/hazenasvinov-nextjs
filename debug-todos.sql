-- Debug todos table structure and data
-- Run this in Supabase SQL Editor

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'todos' 
ORDER BY ordinal_position;

-- Check RLS policies
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
WHERE tablename = 'todos';

-- Check if RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'todos';

-- Check existing todos data
SELECT 
  id, 
  title, 
  status, 
  priority, 
  created_at, 
  updated_at,
  user_email
FROM todos 
ORDER BY created_at DESC 
LIMIT 10;

-- Test update operation (this will show if there are permission issues)
-- UPDATE todos SET status = 'done' WHERE id = (SELECT id FROM todos LIMIT 1);
