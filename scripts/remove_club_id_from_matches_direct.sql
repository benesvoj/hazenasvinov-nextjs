-- DIRECT REMOVAL: Remove club_id column from matches table
-- WARNING: This script will immediately remove the column
-- Make sure you have a backup and have run the safety check script first

-- Remove the club_id column
ALTER TABLE matches DROP COLUMN IF EXISTS club_id;

-- Verify the column was removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY ordinal_position;

-- Show remaining columns in matches table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY ordinal_position;
