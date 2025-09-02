-- Add assigned_categories field to user_profiles table for coaches
-- This field will store an array of category IDs that a coach has access to

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

-- Add a check constraint to ensure assigned_categories is only used for coaches
-- Allow coaches to have empty arrays (no categories assigned yet)
ALTER TABLE user_profiles 
ADD CONSTRAINT check_assigned_categories_coach_only 
CHECK (
  role IN ('coach', 'head_coach') OR assigned_categories IS NULL
);
