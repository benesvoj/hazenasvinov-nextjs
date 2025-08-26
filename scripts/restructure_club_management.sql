-- Restructure Club Management System
-- This script creates a cleaner, more logical structure for club-based team management

-- 1. Create the new club_category_teams table
CREATE TABLE IF NOT EXISTS club_category_teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_category_id UUID NOT NULL REFERENCES club_categories(id) ON DELETE CASCADE,
    team_suffix TEXT NOT NULL, -- A, B, C, etc.
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(club_category_id, team_suffix)
);

-- 2. Add max_teams column to club_categories if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'club_categories' AND column_name = 'max_teams') THEN
        ALTER TABLE club_categories ADD COLUMN max_teams INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added max_teams column to club_categories';
    END IF;
END $$;

-- 3. Create a function to generate teams for a club_category
CREATE OR REPLACE FUNCTION generate_teams_for_club_category(
    p_club_category_id UUID,
    p_max_teams INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_max_teams INTEGER;
    v_team_suffix TEXT;
    v_suffixes TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    v_i INTEGER;
BEGIN
    -- Get max_teams from club_categories if not provided
    IF p_max_teams IS NULL THEN
        SELECT max_teams INTO v_max_teams 
        FROM club_categories 
        WHERE id = p_club_category_id;
    ELSE
        v_max_teams := p_max_teams;
    END IF;
    
    -- Clear existing teams for this club_category
    DELETE FROM club_category_teams WHERE club_category_id = p_club_category_id;
    
    -- Generate new teams based on max_teams
    FOR v_i IN 1..v_max_teams LOOP
        v_team_suffix := v_suffixes[v_i];
        
        INSERT INTO club_category_teams (club_category_id, team_suffix, is_active)
        VALUES (p_club_category_id, v_team_suffix, true);
        
        RAISE NOTICE 'Generated team % for club_category %', v_team_suffix, p_club_category_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a view for easy team access
CREATE OR REPLACE VIEW team_details AS
SELECT 
    cct.id as team_id,
    cct.team_suffix,
    cct.is_active as team_active,
    c.name as club_name,
    c.short_name as club_short_name,
    c.logo_url as club_logo,
    cat.name as category_name,
    s.name as season_name,
    s.is_active as season_active,
    cc.max_teams,
    cc.is_active as club_category_active,
    -- Create display name
    CASE 
        WHEN c.short_name IS NOT NULL THEN 
            c.short_name || ' ' || cct.team_suffix
        ELSE 
            c.name || ' ' || cct.team_suffix
    END as display_name,
    -- Create full name
    c.name || ' ' || cct.team_suffix as full_name
FROM club_category_teams cct
JOIN club_categories cc ON cct.club_category_id = cc.id
JOIN clubs c ON cc.club_id = c.id
JOIN categories cat ON cc.category_id = cat.id
JOIN seasons s ON cc.season_id = s.id
WHERE cct.is_active = true 
  AND cc.is_active = true 
  AND c.is_active = true 
  AND cat.is_active = true;

-- 5. Create a function to get teams for a specific category and season
CREATE OR REPLACE FUNCTION get_teams_for_category_season(
    p_category_id UUID,
    p_season_id UUID
)
RETURNS TABLE(
    team_id UUID,
    club_name TEXT,
    club_short_name TEXT,
    team_suffix TEXT,
    display_name TEXT,
    full_name TEXT,
    club_logo TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.team_id,
        td.club_name,
        td.club_short_name,
        td.team_suffix,
        td.display_name,
        td.full_name,
        td.club_logo
    FROM team_details td
    WHERE td.category_name = (SELECT name FROM categories WHERE id = p_category_id)
      AND td.season_name = (SELECT name FROM seasons WHERE id = p_season_id)
      AND td.team_active = true
      AND td.club_category_active = true
      AND td.season_active = true
    ORDER BY td.club_name, td.team_suffix;
END;
$$ LANGUAGE plpgsql;

-- 6. Show the new structure
SELECT 
    'New Structure Created' as status,
    COUNT(*) as total_clubs,
    (SELECT COUNT(*) FROM club_categories) as total_club_categories,
    (SELECT COUNT(*) FROM club_category_teams) as total_teams
FROM clubs;

-- 7. Example: Generate teams for existing club_categories
DO $$
DECLARE
    v_club_category RECORD;
BEGIN
    FOR v_club_category IN 
        SELECT id, max_teams 
        FROM club_categories 
        WHERE is_active = true
    LOOP
        PERFORM generate_teams_for_club_category(v_club_category.id, v_club_category.max_teams);
    END LOOP;
    
    RAISE NOTICE 'Generated teams for all active club_categories';
END $$;

-- 8. Show sample results
SELECT 
    c.name as club_name,
    cat.name as category_name,
    s.name as season_name,
    cc.max_teams,
    COUNT(cct.team_suffix) as actual_teams,
    STRING_AGG(cct.team_suffix, ', ' ORDER BY cct.team_suffix) as team_suffixes
FROM clubs c
JOIN club_categories cc ON c.id = cc.club_id
JOIN categories cat ON cc.category_id = cat.id
JOIN seasons s ON cc.season_id = s.id
LEFT JOIN club_category_teams cct ON cc.id = cct.club_category_id
WHERE cc.is_active = true
GROUP BY c.id, c.name, cat.id, cat.name, s.id, s.name, cc.max_teams
ORDER BY c.name, cat.name, s.name;
