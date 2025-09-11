-- Remove result column from matches table
-- This column is redundant as result can be computed from home_score and away_score
-- Run this in your Supabase SQL Editor

-- Remove the result column
ALTER TABLE matches 
DROP COLUMN IF EXISTS result;

-- Add a comment explaining the change
COMMENT ON TABLE matches IS 'Matches table - result is computed from home_score and away_score';

-- Optional: Create a function to compute match result if needed in the future
CREATE OR REPLACE FUNCTION get_match_result(home_score INTEGER, away_score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF home_score IS NULL OR away_score IS NULL THEN
    RETURN NULL;
  ELSIF home_score > away_score THEN
    RETURN 'win';
  ELSIF home_score < away_score THEN
    RETURN 'loss';
  ELSE
    RETURN 'draw';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION get_match_result(INTEGER, INTEGER) IS 'Computes match result from scores: win, loss, or draw';
