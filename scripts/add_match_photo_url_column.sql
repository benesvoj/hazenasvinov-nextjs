-- Add match_photo_url column to matches table
-- Run this in your Supabase SQL Editor

-- Add the match_photo_url column as an optional text field
ALTER TABLE matches 
ADD COLUMN match_photo_url TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN matches.match_photo_url IS 'URL of the match photo uploaded by the coach';

-- Optional: Add an index for better performance when filtering by match_photo_url
CREATE INDEX IF NOT EXISTS idx_matches_photo_url ON matches(match_photo_url) WHERE match_photo_url IS NOT NULL;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'matches' 
  AND column_name = 'match_photo_url';
