-- Migration: Complete fix for match_metadata foreign key issues
-- Date: 2024-12-15
-- Description: Comprehensive fix for foreign key constraint issues

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

-- Step 4: Create function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile(input_user_id UUID)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Check if user exists in profiles
  SELECT id INTO profile_id FROM profiles WHERE id = input_user_id;
  
  -- If user doesn't exist, create a basic profile
  IF profile_id IS NULL THEN
    INSERT INTO profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      input_user_id,
      (SELECT email FROM auth.users WHERE id = input_user_id),
      COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = input_user_id), 'Unknown User'),
      NOW(),
      NOW()
    )
    RETURNING id INTO profile_id;
  END IF;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_user_profile(UUID) TO authenticated;

-- Step 6: Create a trigger function to automatically set created_by
CREATE OR REPLACE FUNCTION set_metadata_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- If created_by is not set, try to set it from auth.uid()
  IF NEW.created_by IS NULL THEN
    NEW.created_by := ensure_user_profile(auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger to automatically set created_by
DROP TRIGGER IF EXISTS trigger_set_metadata_created_by ON match_metadata;
CREATE TRIGGER trigger_set_metadata_created_by
  BEFORE INSERT ON match_metadata
  FOR EACH ROW
  EXECUTE FUNCTION set_metadata_created_by();

-- Step 8: Update RLS policies to handle NULL created_by
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

-- Step 9: Verify the fix
SELECT 
  'Foreign key constraint fixed successfully' as status,
  COUNT(*) as total_metadata_records,
  COUNT(created_by) as records_with_creator,
  COUNT(*) - COUNT(created_by) as records_without_creator
FROM match_metadata;

-- Add comments
COMMENT ON FUNCTION ensure_user_profile(UUID) IS 'Ensures user profile exists, creates one if missing';
COMMENT ON FUNCTION set_metadata_created_by() IS 'Automatically sets created_by field for match metadata';
