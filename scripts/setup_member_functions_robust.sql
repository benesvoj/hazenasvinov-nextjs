-- =====================================================
-- SQL Script: Setup Member Functions Management System (Robust Version)
-- Purpose: Create a proper functions management system with better error handling
-- Created: $(date)
-- =====================================================

-- Start transaction
BEGIN;

-- Step 1: Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create member_functions table with explicit UUID generation
CREATE TABLE IF NOT EXISTS member_functions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Insert default functions with explicit IDs
INSERT INTO member_functions (id, name, display_name, description, sort_order) VALUES
(uuid_generate_v4(), 'player', 'Hráč', 'Člen týmu aktivně hrající v soutěžích', 1),
(uuid_generate_v4(), 'coach', 'Trenér', 'Osoba zodpovědná za trénink a vedení týmu', 2),
(uuid_generate_v4(), 'referee', 'Rozhodčí', 'Osoba s rozhodčím oprávněním', 3),
(uuid_generate_v4(), 'club_management', 'Vedení klubu', 'Člen vedení klubu nebo správní rady', 4)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_functions_name ON member_functions(name);
CREATE INDEX IF NOT EXISTS idx_member_functions_active ON member_functions(is_active);
CREATE INDEX IF NOT EXISTS idx_member_functions_sort ON member_functions(sort_order);

-- Step 5: Enable Row Level Security
ALTER TABLE member_functions ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
CREATE POLICY "Member functions are viewable by everyone" ON member_functions
    FOR SELECT USING (true);

CREATE POLICY "Member functions are insertable by authenticated users" ON member_functions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Member functions are updatable by authenticated users" ON member_functions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Member functions are deletable by authenticated users" ON member_functions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Step 7: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_member_functions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_functions_updated_at 
    BEFORE UPDATE ON member_functions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_member_functions_updated_at();

-- Step 8: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON member_functions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 9: Verify the setup
SELECT 
    'Member functions table created successfully' as status,
    COUNT(*) as total_functions,
    'UUID extension available' as uuid_status
FROM member_functions;

-- Step 10: Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'member_functions'
ORDER BY ordinal_position;

-- Commit the transaction
COMMIT;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. This creates a new table for managing member functions
-- 2. Uses uuid-ossp extension for reliable UUID generation
-- 3. Default functions are inserted with explicit UUIDs
-- 4. The existing members.functions TEXT[] column can remain for backward compatibility
-- 5. You can now manage functions through the admin interface
-- 6. Functions can be added, edited, and deactivated as needed
-- =====================================================
