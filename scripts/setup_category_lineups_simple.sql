-- Simple setup for Category Lineups System
-- Run this in Supabase SQL Editor

-- 1. Create category_lineups table
CREATE TABLE IF NOT EXISTS category_lineups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(category_id, season_id, name)
);

-- 2. Create category_lineup_members table
CREATE TABLE IF NOT EXISTS category_lineup_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lineup_id UUID NOT NULL REFERENCES category_lineups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    position VARCHAR(20) NOT NULL CHECK (position IN ('goalkeeper', 'field_player')),
    jersey_number INTEGER CHECK (jersey_number >= 1 AND jersey_number <= 99),
    is_captain BOOLEAN DEFAULT false,
    is_vice_captain BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(lineup_id, member_id),
    UNIQUE(lineup_id, jersey_number)
);

-- 3. Enable RLS
ALTER TABLE category_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_lineup_members ENABLE ROW LEVEL SECURITY;

-- 4. Create basic RLS policies (more permissive for now)
CREATE POLICY "Allow authenticated users to read lineups" ON category_lineups
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to create lineups" ON category_lineups
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow users to update their own lineups" ON category_lineups
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow users to delete their own lineups" ON category_lineups
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Allow authenticated users to read lineup members" ON category_lineup_members
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to manage lineup members" ON category_lineup_members
    FOR ALL
    TO authenticated
    USING (added_by = auth.uid())
    WITH CHECK (added_by = auth.uid());

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_category_lineups_category ON category_lineups(category_id);
CREATE INDEX IF NOT EXISTS idx_category_lineups_season ON category_lineups(season_id);
CREATE INDEX IF NOT EXISTS idx_category_lineups_created_by ON category_lineups(created_by);

CREATE INDEX IF NOT EXISTS idx_category_lineup_members_lineup ON category_lineup_members(lineup_id);
CREATE INDEX IF NOT EXISTS idx_category_lineup_members_member ON category_lineup_members(member_id);

-- 6. Test the tables exist
SELECT 'Tables created successfully' as status;
