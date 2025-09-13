-- Add coach_notes field to matches table for coach match result flow
-- Run this in your Supabase SQL Editor

-- Add coach_notes column to matches table
ALTER TABLE matches 
ADD COLUMN coach_notes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN matches.coach_notes IS 'Coach notes and observations about the match';

-- Add index for better performance when filtering by coach notes
CREATE INDEX IF NOT EXISTS idx_matches_coach_notes ON matches(coach_notes) WHERE coach_notes IS NOT NULL;
