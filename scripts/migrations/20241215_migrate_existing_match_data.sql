-- Migration: Migrate existing match_photo_url and coach_note to match_metadata
-- Date: 2024-12-15
-- Description: Moves existing single photo and note data to the new metadata structure

-- Migrate existing match_photo_url to match_metadata
INSERT INTO match_metadata (match_id, metadata_type, file_url, is_primary, created_at)
SELECT 
  id as match_id,
  'photo' as metadata_type,
  match_photo_url as file_url,
  true as is_primary,
  created_at
FROM matches 
WHERE match_photo_url IS NOT NULL AND match_photo_url != '';

-- Migrate existing coach_note to match_metadata
INSERT INTO match_metadata (match_id, metadata_type, content, is_primary, created_at)
SELECT 
  id as match_id,
  'note' as metadata_type,
  coach_note as content,
  true as is_primary,
  created_at
FROM matches 
WHERE coach_note IS NOT NULL AND coach_note != '';

-- Verify migration
SELECT 
  'Photos migrated' as type,
  COUNT(*) as count
FROM match_metadata 
WHERE metadata_type = 'photo'

UNION ALL

SELECT 
  'Notes migrated' as type,
  COUNT(*) as count
FROM match_metadata 
WHERE metadata_type = 'note';

-- Optional: Add columns to track migration status
-- ALTER TABLE matches ADD COLUMN metadata_migrated BOOLEAN DEFAULT FALSE;
-- UPDATE matches SET metadata_migrated = TRUE WHERE id IN (
--   SELECT DISTINCT match_id FROM match_metadata
-- );
