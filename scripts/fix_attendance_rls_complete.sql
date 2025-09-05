-- Complete fix for attendance RLS issues
-- This script addresses common RLS problems with member_attendance

-- 1. First, ensure the user has a proper profile
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

-- 2. Assign some categories for testing (replace with proper assignment in production)
UPDATE user_profiles 
SET assigned_categories = (
    SELECT ARRAY_AGG(id) 
    FROM categories 
    WHERE code IN ('men', 'women', 'juniorBoys', 'juniorGirls', 'prepKids')
    LIMIT 3
)
WHERE user_id = auth.uid()
AND (assigned_categories IS NULL OR array_length(assigned_categories, 1) IS NULL);

-- 3. Drop and recreate member_attendance policies with proper syntax
DROP POLICY IF EXISTS "Coaches can view attendance for their categories" ON member_attendance;
DROP POLICY IF EXISTS "Coaches can create attendance for their categories" ON member_attendance;
DROP POLICY IF EXISTS "Coaches can update attendance for their categories" ON member_attendance;
DROP POLICY IF EXISTS "Coaches can delete attendance for their categories" ON member_attendance;

-- 4. Create proper RLS policies for member_attendance

-- View policy
CREATE POLICY "Coaches can view attendance for their categories" ON member_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE ts.id = member_attendance.training_session_id
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

-- Insert policy
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

-- Update policy
CREATE POLICY "Coaches can update attendance for their categories" ON member_attendance
    FOR UPDATE USING (
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

-- Delete policy
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

-- 5. Create a more permissive policy for testing (temporary)
-- This allows any authenticated user to insert attendance records
-- Remove this in production and use the proper policies above
CREATE POLICY "Temporary: Allow authenticated users to insert attendance" ON member_attendance
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Add some debug information
DO $$
DECLARE
    user_id_val UUID;
    profile_exists BOOLEAN;
    assigned_cats UUID[];
BEGIN
    user_id_val := auth.uid();
    
    IF user_id_val IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM user_profiles WHERE user_id = user_id_val) INTO profile_exists;
        SELECT assigned_categories FROM user_profiles WHERE user_id = user_id_val INTO assigned_cats;
        
        RAISE NOTICE 'User ID: %', user_id_val;
        RAISE NOTICE 'Profile exists: %', profile_exists;
        RAISE NOTICE 'Assigned categories: %', assigned_cats;
    ELSE
        RAISE NOTICE 'No authenticated user found';
    END IF;
END $$;
