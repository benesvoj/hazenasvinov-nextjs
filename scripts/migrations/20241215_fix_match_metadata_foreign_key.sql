-- Migration: Fix match_metadata foreign key constraint
-- Date: 2024-12-15
-- Description: Update foreign key constraint to allow NULL values and handle missing profiles

-- First, drop the existing foreign key constraint
ALTER TABLE match_metadata DROP CONSTRAINT IF EXISTS match_metadata_created_by_fkey;

-- Add the new foreign key constraint that allows NULL values
ALTER TABLE match_metadata ADD CONSTRAINT match_metadata_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Update any existing records where created_by doesn't exist in profiles
UPDATE match_metadata 
SET created_by = NULL 
WHERE created_by IS NOT NULL 
AND created_by NOT IN (SELECT id FROM profiles);

-- Verify the constraint is working
SELECT 
  'Foreign key constraint updated successfully' as status,
  COUNT(*) as total_metadata_records,
  COUNT(created_by) as records_with_creator,
  COUNT(*) - COUNT(created_by) as records_without_creator
FROM match_metadata;
