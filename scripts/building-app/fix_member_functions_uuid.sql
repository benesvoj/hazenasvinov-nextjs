-- =====================================================
-- SQL Script: Fix Member Functions UUID Issue
-- Purpose: Convert existing UUID column to TEXT and fix data
-- Created: $(date)
-- =====================================================

-- Start transaction
BEGIN;

-- Step 1: Check current table structure
SELECT 
    'Current table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'member_functions'
ORDER BY ordinal_position;

-- Step 2: Drop existing table if it exists
DROP TABLE IF EXISTS member_functions CASCADE;

-- Step 3: Create new table with TEXT id column
CREATE TABLE member_functions (
    id TEXT PRIMARY KEY DEFAULT 'func_' || substr(md5(random()::text), 1, 8),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Insert default functions with simple TEXT IDs
INSERT INTO member_functions (id, name, display_name, description, sort_order) VALUES
('func_player', 'player', 'Hráč', 'Člen týmu aktivně hrající v soutěžích', 1),
('func_coach', 'coach', 'Trenér', 'Osoba zodpovědná za trénink a vedení týmu', 2),
('func_referee', 'referee', 'Rozhodčí', 'Osoba s rozhodčím oprávněním', 3),
('func_club_mgmt', 'club_management', 'Vedení klubu', 'Člen vedení klubu nebo správní rady', 4);

-- Step 5: Create indexes for performance
CREATE INDEX idx_member_functions_name ON member_functions(name);
CREATE INDEX idx_member_functions_active ON member_functions(is_active);
CREATE INDEX idx_member_functions_sort ON member_functions(sort_order);

-- Step 6: Enable Row Level Security
ALTER TABLE member_functions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
CREATE POLICY "Member functions are viewable by everyone" ON member_functions
    FOR SELECT USING (true);

CREATE POLICY "Member functions are insertable by authenticated users" ON member_functions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Member functions are updatable by authenticated users" ON member_functions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Member functions are deletable by authenticated users" ON member_functions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Step 8: Create trigger for updated_at
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

-- Step 9: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON member_functions TO authenticated;

-- Step 10: Verify the fix
SELECT 
    'Member functions table fixed successfully' as status,
    COUNT(*) as total_functions,
    'TEXT ID system now working' as id_system
FROM member_functions;

-- Step 11: Show the new data structure
SELECT 
    'New table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'member_functions'
ORDER BY ordinal_position;

-- Step 12: Show created data
SELECT 
    'Created functions:' as info,
    id,
    name,
    display_name,
    is_active,
    sort_order
FROM member_functions
ORDER BY sort_order;

-- Commit the transaction
COMMIT;

-- =====================================================
-- SUMMARY:
-- =====================================================
-- ✅ Dropped old UUID-based table
-- ✅ Created new TEXT-based table
-- ✅ Inserted default functions with readable IDs
-- ✅ Set up proper indexes and RLS policies
-- ✅ Added updated_at trigger
-- ✅ Granted proper permissions
-- =====================================================
