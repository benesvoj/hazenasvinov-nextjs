-- Fix member_attendance RLS policies
-- The INSERT and DELETE policies are missing proper FOR clauses

-- Drop existing incomplete policies
DROP POLICY IF EXISTS "Coaches can create attendance for their categories" ON member_attendance;
DROP POLICY IF EXISTS "Coaches can delete attendance for their categories" ON member_attendance;

-- Create proper INSERT policy
CREATE POLICY "Coaches can create attendance for their categories" ON member_attendance
    FOR INSERT WITH CHECK (
        recorded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE ts.id = training_session_id
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.code = ts.category
                ))
            )
        )
    );

-- Create proper DELETE policy
CREATE POLICY "Coaches can delete attendance for their categories" ON member_attendance
    FOR DELETE USING (
        recorded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE ts.id = training_session_id
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.code = ts.category
                ))
            )
        )
    );

-- Also ensure user has a profile with assigned categories
-- This is a common issue - user might not have a profile or assigned categories
INSERT INTO user_profiles (user_id, role, assigned_categories, created_at, updated_at)
SELECT 
    auth.uid(),
    'coach',
    ARRAY[]::UUID[],
    NOW(),
    NOW()
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid()
)
ON CONFLICT (user_id) DO NOTHING;

-- For testing purposes, assign some categories to the current user
-- This should be replaced with proper category assignment in production
UPDATE user_profiles 
SET assigned_categories = (
    SELECT ARRAY_AGG(id) 
    FROM categories 
    WHERE code IN ('men', 'women', 'juniorBoys', 'juniorGirls')
    LIMIT 2
)
WHERE user_id = auth.uid()
AND assigned_categories IS NULL OR array_length(assigned_categories, 1) IS NULL;
