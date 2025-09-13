-- Add half-time score columns to matches table
-- Run this in your Supabase SQL Editor

-- Add the half-time score columns as optional integers
ALTER TABLE matches 
ADD COLUMN home_team_halftime_score INTEGER;

ALTER TABLE matches 
ADD COLUMN away_team_halftime_score INTEGER;

-- Add comments to document the columns
COMMENT ON COLUMN matches.home_team_halftime_score IS 'Half-time score for the home team';
COMMENT ON COLUMN matches.away_team_halftime_score IS 'Half-time score for the away team';

-- Optional: Add indexes for better performance when filtering by half-time scores
CREATE INDEX IF NOT EXISTS idx_matches_home_halftime_score ON matches(home_team_halftime_score);
CREATE INDEX IF NOT EXISTS idx_matches_away_halftime_score ON matches(away_team_halftime_score);

-- Optional: Add constraints to ensure scores are non-negative (if desired)
-- ALTER TABLE matches ADD CONSTRAINT check_home_halftime_score_non_negative CHECK (home_team_halftime_score >= 0);
-- ALTER TABLE matches ADD CONSTRAINT check_away_halftime_score_non_negative CHECK (away_team_halftime_score >= 0);

-- Optional: Add a composite index for half-time score queries
CREATE INDEX IF NOT EXISTS idx_matches_halftime_scores ON matches(home_team_halftime_score, away_team_halftime_score);
