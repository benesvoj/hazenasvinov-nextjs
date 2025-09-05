-- Create automatic user profile creation trigger
-- This script creates a trigger that automatically creates user profiles when users sign up

-- 1. Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new user profile with default 'member' role
  INSERT INTO user_profiles (user_id, role, created_at, updated_at)
  VALUES (
    NEW.id,
    'member', -- Default role for new users
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger on auth.users table
-- This trigger fires after a new user is inserted
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Add comment to document the trigger
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates user profile when new user signs up';
-- Note: Cannot comment on auth.users trigger due to ownership restrictions

-- 4. Create a function to check if user profile exists
CREATE OR REPLACE FUNCTION user_has_profile(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a function to get user profile with fallback
CREATE OR REPLACE FUNCTION get_user_profile_safe(user_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  club_id UUID,
  assigned_categories UUID[],
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if profile exists
  IF NOT user_has_profile(user_uuid) THEN
    -- Create profile if it doesn't exist (fallback for existing users)
    INSERT INTO user_profiles (user_id, role, created_at, updated_at)
    VALUES (user_uuid, 'member', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- Return the profile
  RETURN QUERY
  SELECT 
    up.user_id,
    up.role,
    up.club_id,
    up.assigned_categories,
    up.created_at
  FROM user_profiles up
  WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_safe(UUID) TO authenticated;

-- 7. Test the trigger (optional - can be removed after testing)
-- This will create a test user profile if the trigger works
-- DO NOT run this in production without proper testing
/*
-- Test query to verify trigger works (uncomment to test)
-- This should create a profile for vojtechbe@gmail.com if they exist
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Find vojtechbe@gmail.com user ID
  SELECT id INTO test_user_id 
  FROM auth.users 
  WHERE email = 'vojtechbe@gmail.com' 
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Check if profile exists, if not create one
    IF NOT user_has_profile(test_user_id) THEN
      INSERT INTO user_profiles (user_id, role, created_at, updated_at)
      VALUES (test_user_id, 'member', NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING;
      
      RAISE NOTICE 'Created profile for vojtechbe@gmail.com';
    ELSE
      RAISE NOTICE 'Profile already exists for vojtechbe@gmail.com';
    END IF;
  ELSE
    RAISE NOTICE 'vojtechbe@gmail.com not found in auth.users';
  END IF;
END $$;
*/
