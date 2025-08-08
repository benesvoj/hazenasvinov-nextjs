-- Update category-seasons relationship from 1:1 to 1:N
-- Run this in your Supabase SQL Editor

-- First, create a new junction table for category_seasons
CREATE TABLE category_seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    matchweek_count INTEGER DEFAULT 0,
    competition_type VARCHAR(50) DEFAULT 'league',
    team_count INTEGER DEFAULT 0,
    allow_team_duplicates BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, season_id)
);

-- Add comments to document the table
COMMENT ON TABLE category_seasons IS 'Junction table for many-to-many relationship between categories and seasons';
COMMENT ON COLUMN category_seasons.matchweek_count IS 'Number of matchweeks for this category in this season';
COMMENT ON COLUMN category_seasons.competition_type IS 'Type of competition for this category in this season';
COMMENT ON COLUMN category_seasons.team_count IS 'Expected number of teams for this category in this season';
COMMENT ON COLUMN category_seasons.allow_team_duplicates IS 'Whether to allow A/B teams for this category in this season';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_category_seasons_category ON category_seasons(category_id);
CREATE INDEX IF NOT EXISTS idx_category_seasons_season ON category_seasons(season_id);
CREATE INDEX IF NOT EXISTS idx_category_seasons_active ON category_seasons(is_active);

-- Migrate existing data from categories table to category_seasons
INSERT INTO category_seasons (category_id, season_id, matchweek_count, competition_type, team_count, allow_team_duplicates, is_active)
SELECT 
    id as category_id,
    season_id,
    COALESCE(matchweek_count, 0) as matchweek_count,
    COALESCE(competition_type, 'league') as competition_type,
    COALESCE(team_count, 0) as team_count,
    COALESCE(allow_team_duplicates, false) as allow_team_duplicates,
    is_active
FROM categories 
WHERE season_id IS NOT NULL;

-- Remove the old columns from categories table
ALTER TABLE categories 
DROP COLUMN IF EXISTS season_id,
DROP COLUMN IF EXISTS matchweek_count,
DROP COLUMN IF EXISTS competition_type,
DROP COLUMN IF EXISTS team_count,
DROP COLUMN IF EXISTS allow_team_duplicates;

-- Add trigger for updated_at
CREATE TRIGGER update_category_seasons_updated_at 
    BEFORE UPDATE ON category_seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
