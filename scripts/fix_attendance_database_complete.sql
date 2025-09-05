-- Complete fix for attendance system database issues
-- Run this script in Supabase SQL Editor

-- 1. Fix the UPDATE policy for training_sessions (missing WITH CHECK clause)
DROP POLICY IF EXISTS "Coaches can update their own training sessions" ON training_sessions;

CREATE POLICY "Coaches can update their own training sessions" ON training_sessions
    FOR UPDATE USING (
        coach_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.code = training_sessions.category
                ))
            )
        )
    ) WITH CHECK (
        coach_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.code = training_sessions.category
                ))
            )
        )
    );

-- 2. Ensure the INSERT policy exists and is correct
DROP POLICY IF EXISTS "Coaches can create training sessions for their categories" ON training_sessions;

CREATE POLICY "Coaches can create training sessions for their categories" ON training_sessions
    FOR INSERT WITH CHECK (
        coach_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.code = training_sessions.category
                ))
            )
        )
    );

-- 3. Ensure the SELECT policy exists
DROP POLICY IF EXISTS "Coaches can view training sessions for their categories" ON training_sessions;

CREATE POLICY "Coaches can view training sessions for their categories" ON training_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.code = training_sessions.category
                ))
            )
        )
    );

-- 4. Ensure the DELETE policy exists
DROP POLICY IF EXISTS "Coaches can delete their own training sessions" ON training_sessions;

CREATE POLICY "Coaches can delete their own training sessions" ON training_sessions
    FOR DELETE USING (
        coach_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.code = training_sessions.category
                ))
            )
        )
    );

-- 5. Ensure RLS is enabled
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_attendance ENABLE ROW LEVEL SECURITY;

-- 6. Verify the policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'training_sessions'
ORDER BY policyname;

-- 7. Test the policies (optional - uncomment to test)
-- This will show if a user can insert a training session
-- SELECT auth.uid() as current_user_id;

-- 8. Check if the training_sessions table exists and has the right structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'training_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
