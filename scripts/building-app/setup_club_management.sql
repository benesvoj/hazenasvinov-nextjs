-- Club Management System Setup
-- This script creates the necessary tables for managing clubs and their relationships

-- 1. Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    logo_url TEXT,
    city VARCHAR(255),
    founded_year INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create club_teams table (teams belonging to clubs)
CREATE TABLE IF NOT EXISTS club_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_suffix VARCHAR(10), -- NULL for single team, 'A', 'B', 'C' for multiple teams
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(club_id, team_id)
);

-- 3. Create club_categories table (which clubs participate in which categories)
CREATE TABLE IF NOT EXISTS club_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    max_teams INTEGER DEFAULT 1, -- How many teams this club can have in this category
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(club_id, category_id, season_id)
);

-- 4. Add club_id to teams table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'club_id') THEN
        ALTER TABLE teams ADD COLUMN club_id UUID REFERENCES clubs(id);
    END IF;
END $$;

-- 5. Add club_id to standings table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standings' AND column_name = 'club_id') THEN
        ALTER TABLE standings ADD COLUMN club_id UUID REFERENCES clubs(id);
    END IF;
END $$;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs(name);
CREATE INDEX IF NOT EXISTS idx_clubs_active ON clubs(is_active);
CREATE INDEX IF NOT EXISTS idx_club_teams_club_id ON club_teams(club_id);
CREATE INDEX IF NOT EXISTS idx_club_teams_team_id ON club_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_club_categories_club_id ON club_categories(club_id);
CREATE INDEX IF NOT EXISTS idx_club_categories_category_id ON club_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_club_categories_season_id ON club_categories(season_id);
CREATE INDEX IF NOT EXISTS idx_club_categories_active ON club_categories(is_active);

-- 7. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON clubs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert sample data (optional - uncomment if you want sample clubs)
/*
INSERT INTO clubs (name, short_name, city, founded_year) VALUES
('Hazena Švínov', 'Švínov', 'Švínov', 1920),
('TJ Sokol Svinov', 'Svinov', 'Svinov', 1919),
('SK Svinov', 'Svinov', 'Svinov', 1921)
ON CONFLICT DO NOTHING;
*/

-- 10. Create view for club information with team counts
CREATE OR REPLACE VIEW club_overview AS
SELECT 
    c.id,
    c.name,
    c.short_name,
    c.city,
    c.founded_year,
    c.logo_url,
    c.is_active,
    COUNT(ct.team_id) as team_count,
    COUNT(cc.id) as category_count
FROM clubs c
LEFT JOIN club_teams ct ON c.id = ct.club_id
LEFT JOIN club_categories cc ON c.id = cc.club_id AND cc.is_active = true
GROUP BY c.id, c.name, c.short_name, c.city, c.founded_year, c.logo_url, c.is_active;

-- 11. Create view for club-category relationships
-- First ensure max_teams column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'club_categories' AND column_name = 'max_teams') THEN
        ALTER TABLE club_categories ADD COLUMN max_teams INTEGER DEFAULT 1;
        RAISE NOTICE 'Added max_teams column to club_categories table';
    END IF;
END $$;

-- Now create the view
CREATE OR REPLACE VIEW club_category_details AS
SELECT 
    cc.id,
    c.name as club_name,
    c.short_name as club_short_name,
    cat.name as category_name,
    s.name as season_name,
    COALESCE(cc.max_teams, 1) as max_teams,
    cc.is_active,
    COUNT(ct.team_id) as current_teams
FROM club_categories cc
JOIN clubs c ON cc.club_id = c.id
JOIN categories cat ON cc.category_id = cat.id
JOIN seasons s ON cc.season_id = s.id
LEFT JOIN club_teams ct ON c.id = ct.club_id
GROUP BY cc.id, c.name, c.short_name, cat.name, s.name, cc.max_teams, cc.is_active;

-- 12. Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_user;

COMMENT ON TABLE clubs IS 'Main clubs table storing club information';
COMMENT ON TABLE club_teams IS 'Relationship table between clubs and their teams';
COMMENT ON TABLE club_categories IS 'Relationship table between clubs and categories for specific seasons';
COMMENT ON COLUMN club_teams.team_suffix IS 'Suffix for teams when club has multiple teams in same category (A, B, C, etc.)';
COMMENT ON COLUMN club_categories.max_teams IS 'Maximum number of teams this club can have in this category';
