-- =====================================================
-- SQL Script: Setup Member Functions (Simple Version)
-- Purpose: Create member functions table with minimal dependencies
-- Created: $(date)
-- =====================================================

-- Start transaction
BEGIN;

-- Step 1: Create member_functions table with simple UUID handling
CREATE TABLE IF NOT EXISTS member_functions (
    id TEXT PRIMARY KEY DEFAULT 'func_' || substr(md5(random()::text), 1, 8),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert default functions with simple IDs
INSERT INTO member_functions (id, name, display_name, description, sort_order) VALUES
('func_player', 'player', 'Hráč', 'Člen týmu aktivně hrající v soutěžích', 1),
('func_coach', 'coach', 'Trenér', 'Osoba zodpovědná za trénink a vedení týmu', 2),
('func_referee', 'referee', 'Rozhodčí', 'Osoba s rozhodčím oprávněním', 3),
('func_club_mgmt', 'club_management', 'Vedení klubu', 'Člen vedení klubu nebo správní rady', 4)
ON CONFLICT (name) DO NOTHING;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_functions_name ON member_functions(name);
CREATE INDEX IF NOT EXISTS idx_member_functions_active ON member_functions(is_active);
CREATE INDEX IF NOT EXISTS idx_member_functions_sort ON member_functions(sort_order);

-- Step 4: Enable Row Level Security
ALTER TABLE member_functions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Member functions are viewable by everyone" ON member_functions
    FOR SELECT USING (true);

CREATE POLICY "Member functions are insertable by authenticated users" ON member_functions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Member functions are updatable by authenticated users" ON member_functions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Member functions are deletable by authenticated users" ON member_functions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Step 6: Create trigger for updated_at
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

-- Step 7: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON member_functions TO authenticated;

-- Step 8: Verify the setup
SELECT 
    'Member functions table created successfully' as status,
    COUNT(*) as total_functions,
    'Simple ID system used' as id_system
FROM member_functions;

-- Step 9: Show created data
SELECT 
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
-- IMPORTANT NOTES:
-- =====================================================
-- 1. This creates a new table for managing member functions
-- 2. Uses simple TEXT IDs instead of UUIDs to avoid extension issues
-- 3. Default functions are inserted with readable IDs
-- 4. The existing members.functions TEXT[] column can remain for backward compatibility
-- 5. You can now manage functions through the admin interface
-- 6. Functions can be added, edited, and deactivated as needed
-- =====================================================
