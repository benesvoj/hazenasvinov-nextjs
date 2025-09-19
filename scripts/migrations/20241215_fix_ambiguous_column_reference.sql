-- Migration: Fix ambiguous column reference in ensure_user_profile function
-- Date: 2024-12-15
-- Description: Fixes the ambiguous column reference error by using proper parameter naming

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS ensure_user_profile(UUID);

-- Recreate the function with proper parameter naming
CREATE OR REPLACE FUNCTION ensure_user_profile(input_user_id UUID)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Check if user exists in profiles using user_id field
  SELECT id INTO profile_id FROM profiles WHERE user_id = input_user_id;
  
  -- If user doesn't exist, create a basic profile
  IF profile_id IS NULL THEN
    INSERT INTO profiles (user_id, email, display_name, role, created_at, updated_at)
    VALUES (
      input_user_id,
      (SELECT email FROM auth.users WHERE id = input_user_id),
      COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = input_user_id), 'Unknown User'),
      'admin',
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

-- Update the trigger function to use the corrected function
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

-- Verify the fix
SELECT 'Function recreated successfully' as status;
