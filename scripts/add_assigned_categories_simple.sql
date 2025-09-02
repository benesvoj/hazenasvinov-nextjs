-- Simple version: Add assigned_categories field to user_profiles table for coaches
-- This version avoids complex constraints that might cause issues

-- Add the assigned_categories column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS assigned_categories UUID[] DEFAULT '{}';

-- Add a comment to explain the column
COMMENT ON COLUMN user_profiles.assigned_categories IS 'Array of category IDs that this coach has access to. Only used for coaches and head_coaches.';

-- Create an index for better performance when filtering by assigned categories
CREATE INDEX IF NOT EXISTS idx_user_profiles_assigned_categories 
ON user_profiles USING GIN (assigned_categories);

-- Example: Assign some categories to a coach
-- UPDATE user_profiles 
-- SET assigned_categories = ARRAY[
--   (SELECT id FROM categories WHERE code = 'men'),
--   (SELECT id FROM categories WHERE code = 'women')
-- ]
-- WHERE role = 'coach' AND user_id = 'your-user-id-here';
