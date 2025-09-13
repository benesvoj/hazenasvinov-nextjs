-- Add missing columns to matches table for coach match result flow
-- Run this in your Supabase SQL Editor

-- Add coach_notes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'coach_notes') THEN
        ALTER TABLE matches ADD COLUMN coach_notes TEXT;
        COMMENT ON COLUMN matches.coach_notes IS 'Coach notes and observations about the match';
    END IF;
END $$;

-- Add match_photo_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'match_photo_url') THEN
        ALTER TABLE matches ADD COLUMN match_photo_url TEXT;
        COMMENT ON COLUMN matches.match_photo_url IS 'URL of the match photo uploaded by the coach';
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_coach_notes ON matches(coach_notes) WHERE coach_notes IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_photo_url ON matches(match_photo_url) WHERE match_photo_url IS NOT NULL;

-- Verify all columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'matches' 
  AND column_name IN ('coach_notes', 'match_photo_url', 'home_score_halftime', 'away_score_halftime')
ORDER BY column_name;
