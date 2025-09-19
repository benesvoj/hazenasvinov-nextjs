-- Fix placeholder URLs in match_metadata table
-- This script updates any existing records that have the problematic placeholder URL

-- Update any photo metadata with the placeholder URL to use a proper fallback
UPDATE match_metadata 
SET file_url = NULL 
WHERE metadata_type = 'photo' 
  AND file_url = 'https://example.com/placeholder.jpg';

-- Add a comment to explain the change
COMMENT ON TABLE match_metadata IS 'Updated placeholder URLs to prevent Next.js Image errors';

-- Show how many records were affected
SELECT 
  COUNT(*) as updated_records,
  'placeholder URLs cleaned' as description
FROM match_metadata 
WHERE metadata_type = 'photo' 
  AND file_url IS NULL;
