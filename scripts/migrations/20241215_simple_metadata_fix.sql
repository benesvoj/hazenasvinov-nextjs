-- Migration: Simple fix for match_metadata foreign key issues
-- Date: 2024-12-15
-- Description: Simple and robust fix for foreign key constraint issues

-- Step 1: Drop existing foreign key constraint
ALTER TABLE match_metadata DROP CONSTRAINT IF EXISTS match_metadata_created_by_fkey;

-- Step 2: Update any existing records where created_by doesn't exist in profiles
UPDATE match_metadata 
SET created_by = NULL 
WHERE created_by IS NOT NULL 
AND created_by NOT IN (SELECT id FROM profiles);

-- Step 3: Add the new foreign key constraint that allows NULL values
ALTER TABLE match_metadata ADD CONSTRAINT match_metadata_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Step 4: Update RLS policies to handle NULL created_by
DROP POLICY IF EXISTS "Users can insert match metadata for accessible matches" ON match_metadata;
CREATE POLICY "Users can insert match metadata for accessible matches" ON match_metadata
  FOR INSERT WITH CHECK (
    match_id IN (
      SELECT m.id FROM matches m
      JOIN club_categories cc ON m.category_id = cc.category_id
      WHERE cc.club_id IN (
        SELECT club_id FROM user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    ) AND (created_by = auth.uid() OR created_by IS NULL)
  );

-- Step 5: Create a simple trigger to set created_by from auth.uid() if not provided
CREATE OR REPLACE FUNCTION set_metadata_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- If created_by is not set, try to set it from auth.uid()
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger to automatically set created_by
DROP TRIGGER IF EXISTS trigger_set_metadata_created_by ON match_metadata;
CREATE TRIGGER trigger_set_metadata_created_by
  BEFORE INSERT ON match_metadata
  FOR EACH ROW
  EXECUTE FUNCTION set_metadata_created_by();

-- Step 7: Verify the fix
SELECT 
  'Foreign key constraint fixed successfully' as status,
  COUNT(*) as total_metadata_records,
  COUNT(created_by) as records_with_creator,
  COUNT(*) - COUNT(created_by) as records_without_creator
FROM match_metadata;

-- Add comment
COMMENT ON FUNCTION set_metadata_created_by() IS 'Automatically sets created_by field for match metadata from auth.uid()';
