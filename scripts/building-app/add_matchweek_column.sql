-- Add matchweek column to matches table
-- Run this in your Supabase SQL Editor

-- Add the matchweek column as an optional integer
ALTER TABLE matches 
ADD COLUMN matchweek INTEGER;

-- Add a comment to document the column
COMMENT ON COLUMN matches.matchweek IS 'Match week/round number for organizing matches in competitions';

-- Optional: Add an index for better performance when filtering by matchweek
CREATE INDEX IF NOT EXISTS idx_matches_matchweek ON matches(matchweek);

-- Optional: Add a constraint to ensure matchweek is positive (if desired)
-- ALTER TABLE matches ADD CONSTRAINT check_matchweek_positive CHECK (matchweek > 0);
