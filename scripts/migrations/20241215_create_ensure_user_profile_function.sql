-- Migration: Create function to ensure user profile exists
-- Date: 2024-12-15
-- Description: Creates a function to safely get or create user profile for metadata operations

-- Create function to ensure user profile exists
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_user_profile(UUID) TO authenticated;

-- Create a trigger function to automatically set created_by
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

-- Create trigger to automatically set created_by
DROP TRIGGER IF EXISTS trigger_set_metadata_created_by ON match_metadata;
CREATE TRIGGER trigger_set_metadata_created_by
  BEFORE INSERT ON match_metadata
  FOR EACH ROW
  EXECUTE FUNCTION set_metadata_created_by();

-- Add comment
COMMENT ON FUNCTION ensure_user_profile(UUID) IS 'Ensures user profile exists, creates one if missing';
COMMENT ON FUNCTION set_metadata_created_by() IS 'Automatically sets created_by field for match metadata';
