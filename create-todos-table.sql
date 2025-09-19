-- Create todos table if it doesn't exist
-- Run this in Supabase SQL Editor

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('todo', 'in-progress', 'done')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('feature', 'bug', 'improvement', 'technical')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  user_email VARCHAR(255) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_user_email ON todos(user_email);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read all todos
CREATE POLICY "Allow authenticated users to read todos" 
ON todos
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert todos
CREATE POLICY "Allow authenticated users to insert todos" 
ON todos
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update todos
CREATE POLICY "Allow authenticated users to update todos" 
ON todos
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete todos
CREATE POLICY "Allow authenticated users to delete todos" 
ON todos
FOR DELETE 
TO authenticated 
USING (true);

-- Verify the setup
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'todos';

-- Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'todos';

-- Insert a test todo
INSERT INTO todos (title, description, priority, status, category, user_email) 
VALUES (
  'Test Todo', 
  'This is a test todo to verify the table works', 
  'medium', 
  'todo', 
  'feature', 
  'test@example.com'
) ON CONFLICT DO NOTHING;

-- Check if the test todo was inserted
SELECT * FROM todos WHERE title = 'Test Todo';
