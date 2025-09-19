-- Migration: Fix admin access to match metadata
-- Date: 2024-12-15
-- Description: Ensures admin users can create and manage match metadata

-- Step 1: Ensure the current user has a profile
INSERT INTO profiles (id, email, full_name, created_at, updated_at)
SELECT 
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
        (SELECT email FROM auth.users WHERE id = auth.uid())
    ),
    NOW(),
    NOW()
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Ensure the current user has admin role in user_roles table
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
    auth.uid(),
    'admin',
    NOW()
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Update RLS policies to be more permissive for admins
DROP POLICY IF EXISTS "Users can insert match metadata for accessible matches" ON match_metadata;
CREATE POLICY "Users can insert match metadata for accessible matches" ON match_metadata
  FOR INSERT WITH CHECK (
    -- Admin users can insert metadata for any match
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Coach users can insert metadata for matches in their assigned categories
    match_id IN (
      SELECT m.id FROM matches m
      JOIN club_categories cc ON m.category_id = cc.category_id
      WHERE cc.club_id IN (
        SELECT club_id FROM user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    )
  );

-- Step 4: Update other RLS policies to be more permissive for admins
DROP POLICY IF EXISTS "Users can view match metadata for accessible matches" ON match_metadata;
CREATE POLICY "Users can view match metadata for accessible matches" ON match_metadata
  FOR SELECT USING (
    -- Admin users can view all metadata
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Coach users can view metadata for matches in their assigned categories
    match_id IN (
      SELECT m.id FROM matches m
      JOIN club_categories cc ON m.category_id = cc.category_id
      WHERE cc.club_id IN (
        SELECT club_id FROM user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own match metadata" ON match_metadata;
CREATE POLICY "Users can update their own match metadata" ON match_metadata
  FOR UPDATE USING (
    -- Admin users can update any metadata
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Users can update metadata they created
    (created_by = auth.uid() AND
    match_id IN (
      SELECT m.id FROM matches m
      JOIN club_categories cc ON m.category_id = cc.category_id
      WHERE cc.club_id IN (
        SELECT club_id FROM user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    ))
  );

DROP POLICY IF EXISTS "Users can delete their own match metadata" ON match_metadata;
CREATE POLICY "Users can delete their own match metadata" ON match_metadata
  FOR DELETE USING (
    -- Admin users can delete any metadata
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Users can delete metadata they created
    (created_by = auth.uid() AND
    match_id IN (
      SELECT m.id FROM matches m
      JOIN club_categories cc ON m.category_id = cc.category_id
      WHERE cc.club_id IN (
        SELECT club_id FROM user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    ))
  );

-- Step 5: Verify the fix
SELECT 
  'Admin access fixed successfully' as status,
  auth.uid() as current_user_id,
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid()) as has_profile,
  EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') as has_admin_role;
