-- Fix attendance RLS policies to properly handle admin access
-- Admin users should have full access without category restrictions

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Coaches can view attendance for their categories" ON member_attendance;
DROP POLICY IF EXISTS "Coaches can create attendance for their categories" ON member_attendance;
DROP POLICY IF EXISTS "Coaches can update attendance for their categories" ON member_attendance;
DROP POLICY IF EXISTS "Coaches can delete attendance for their categories" ON member_attendance;

-- 2. Create new policies that properly handle admin access

-- View policy - Admin can see all, coaches see their categories
CREATE POLICY "View attendance policy" ON member_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'admin' OR
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM training_sessions ts
                    JOIN categories c ON c.code = ts.category
                    WHERE ts.id = member_attendance.training_session_id
                    AND c.id = ANY(up.assigned_categories)
                ))
            )
        )
    );

-- Insert policy - Admin can insert all, coaches insert for their categories
CREATE POLICY "Insert attendance policy" ON member_attendance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'admin' OR
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM training_sessions ts
                    JOIN categories c ON c.code = ts.category
                    WHERE ts.id = training_session_id
                    AND c.id = ANY(up.assigned_categories)
                ))
            )
        )
    );

-- Update policy - Admin can update all, coaches update their categories
CREATE POLICY "Update attendance policy" ON member_attendance
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'admin' OR
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM training_sessions ts
                    JOIN categories c ON c.code = ts.category
                    WHERE ts.id = training_session_id
                    AND c.id = ANY(up.assigned_categories)
                ))
            )
        )
    );

-- Delete policy - Admin can delete all, coaches delete their categories
CREATE POLICY "Delete attendance policy" ON member_attendance
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'admin' OR
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM training_sessions ts
                    JOIN categories c ON c.code = ts.category
                    WHERE ts.id = training_session_id
                    AND c.id = ANY(up.assigned_categories)
                ))
            )
        )
    );

-- 3. Ensure user_profiles table has proper constraints
-- Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_user_id_key' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
        RAISE NOTICE 'Added unique constraint on user_id';
    ELSE
        RAISE NOTICE 'Unique constraint on user_id already exists';
    END IF;
END $$;

-- 4. Ensure user has a profile (but don't force category assignment for admin)
INSERT INTO user_profiles (user_id, role, assigned_categories, created_at, updated_at)
SELECT 
    auth.uid(),
    'admin',  -- Set as admin by default
    ARRAY[]::UUID[],  -- Empty categories for admin
    NOW(),
    NOW()
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid()
)
ON CONFLICT (user_id) DO NOTHING;

-- 5. For existing users, ensure they have admin role if they don't have a role
UPDATE user_profiles 
SET role = 'admin'
WHERE user_id = auth.uid()
AND (role IS NULL OR role = '');

-- 6. Add debug information
DO $$
DECLARE
    user_id_val UUID;
    profile_exists BOOLEAN;
    user_role TEXT;
    assigned_cats UUID[];
BEGIN
    user_id_val := auth.uid();
    
    IF user_id_val IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM user_profiles WHERE user_id = user_id_val) INTO profile_exists;
        SELECT role, assigned_categories FROM user_profiles WHERE user_id = user_id_val INTO user_role, assigned_cats;
        
        RAISE NOTICE 'User ID: %', user_id_val;
        RAISE NOTICE 'Profile exists: %', profile_exists;
        RAISE NOTICE 'User role: %', user_role;
        RAISE NOTICE 'Assigned categories: %', assigned_cats;
        
        IF user_role = 'admin' THEN
            RAISE NOTICE 'Admin user - should have full access to all attendance records';
        END IF;
    ELSE
        RAISE NOTICE 'No authenticated user found';
    END IF;
END $$;
