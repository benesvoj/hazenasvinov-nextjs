-- Quick fix for user creation RLS conflict
-- This is a minimal fix to get user creation working again

-- 1. Drop the problematic RLS policy
DROP POLICY IF EXISTS "Admins can insert user profiles" ON user_profiles;

-- 2. Fix the handle_new_user function to handle the constraint
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new user profile with default 'member' role
  -- Set assigned_categories to NULL for non-coach roles to satisfy the constraint
  INSERT INTO user_profiles (user_id, role, assigned_categories, created_at, updated_at)
  VALUES (
    NEW.id,
    'member', -- Default role for new users
    NULL,     -- Set to NULL for non-coach roles to satisfy constraint
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a permissive policy for user profile creation
CREATE POLICY "Allow user profile creation" ON user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
