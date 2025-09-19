-- Migration: Remove old match_photo_url and coach_note fields
-- Date: 2024-12-15
-- Description: Remove deprecated fields after successful migration to match_metadata

-- Remove the old columns from matches table
ALTER TABLE matches DROP COLUMN IF EXISTS match_photo_url;
ALTER TABLE matches DROP COLUMN IF EXISTS coach_note;

-- Add comment to document the change
COMMENT ON TABLE matches IS 'Matches table - photo_url and coach_note fields migrated to match_metadata table';

-- Verify the columns are removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND column_name IN ('match_photo_url', 'coach_note');
