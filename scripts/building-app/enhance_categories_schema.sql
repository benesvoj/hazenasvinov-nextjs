-- Enhance categories table with new fields for competition management
-- Run this in your Supabase SQL Editor

-- Add new columns to categories table
ALTER TABLE categories 
ADD COLUMN season_id UUID REFERENCES seasons(id),
ADD COLUMN matchweek_count INTEGER DEFAULT 0,
ADD COLUMN competition_type VARCHAR(50) DEFAULT 'league', -- 'league', 'league_playoff', 'tournament'
ADD COLUMN team_count INTEGER DEFAULT 0,
ADD COLUMN allow_team_duplicates BOOLEAN DEFAULT false; -- For A/B teams in same league

-- Add comments to document the new columns
COMMENT ON COLUMN categories.season_id IS 'Season assignment for this category';
COMMENT ON COLUMN categories.matchweek_count IS 'Number of matchweeks/rounds in this competition';
COMMENT ON COLUMN categories.competition_type IS 'Type of competition: league, league_playoff, tournament';
COMMENT ON COLUMN categories.team_count IS 'Expected number of teams in this competition';
COMMENT ON COLUMN categories.allow_team_duplicates IS 'Whether to allow A/B teams from same club in this category';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_season ON categories(season_id);
CREATE INDEX IF NOT EXISTS idx_categories_competition_type ON categories(competition_type);

-- Update existing categories to have default values
UPDATE categories SET 
  matchweek_count = 0,
  competition_type = 'league',
  team_count = 0,
  allow_team_duplicates = false
WHERE matchweek_count IS NULL;
