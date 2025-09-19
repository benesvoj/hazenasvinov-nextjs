-- Create category metadata table
-- Run this in Supabase SQL Editor

-- Create categories table for metadata
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "U15", "U17", "SENIOR"
  description TEXT,
  age_min INTEGER,
  age_max INTEGER,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'mixed')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_code ON categories(code);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Insert some sample categories
INSERT INTO categories (id, name, code, description, age_min, age_max, gender) VALUES
  ('ccd0bb38-b7f4-4cc0-ac4e-187714915e01', 'Starší žačky', 'U17F', 'Kategorie starších žaček', 15, 17, 'female'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mladší žačky', 'U15F', 'Kategorie mladších žaček', 13, 15, 'female'),
  ('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Starší žáci', 'U17M', 'Kategorie starších žáků', 15, 17, 'male'),
  ('c3d4e5f6-g7h8-9012-cdef-345678901234', 'Mladší žáci', 'U15M', 'Kategorie mladších žáků', 13, 15, 'male'),
  ('d4e5f6g7-h8i9-0123-def0-456789012345', 'Dospělí', 'SENIOR', 'Kategorie dospělých', 18, 99, 'mixed')
ON CONFLICT (id) DO NOTHING;

-- Update members table to reference categories properly
-- First, let's check if we need to add a foreign key constraint
ALTER TABLE members 
ADD CONSTRAINT fk_members_category 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Create a view for easy member-category joins
CREATE OR REPLACE VIEW members_with_categories AS
SELECT 
  m.*,
  c.name as category_name,
  c.code as category_code,
  c.description as category_description,
  c.age_min,
  c.age_max,
  c.gender as category_gender
FROM members m
LEFT JOIN categories c ON m.category_id = c.id;

-- Create RLS policies for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read categories
CREATE POLICY "Allow authenticated users to read categories" 
ON categories
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert/update categories (for admins)
CREATE POLICY "Allow authenticated users to insert categories" 
ON categories
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update categories" 
ON categories
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Verify the setup
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('categories', 'members')
ORDER BY tablename;

-- Test the view
SELECT * FROM members_with_categories LIMIT 5;
