-- Add match_number column to matches table
-- Run this in your Supabase SQL Editor

-- Add the match_number column as an optional text field
ALTER TABLE matches 
ADD COLUMN match_number TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN matches.match_number IS 'Specific match identifier/number within a matchweek (e.g., "1", "2", "Finále", "Semifinále")';

-- Optional: Add an index for better performance when filtering by match_number
CREATE INDEX IF NOT EXISTS idx_matches_match_number ON matches(match_number);

-- Optional: Add a composite index for matchweek + match_number queries
CREATE INDEX IF NOT EXISTS idx_matches_week_number ON matches(matchweek, match_number);

-- Example of how the columns work together:
-- matchweek: 1 (Week 1 of the season)
-- match_number: "1" (Match 1 within Week 1)
-- 
-- matchweek: 1 (Week 1 of the season)  
-- match_number: "2" (Match 2 within Week 1)
--
-- matchweek: 5 (Week 5 of the season)
-- match_number: "Finále" (Final match of Week 5)
