-- Fix RLS policies for training_sessions table
-- This script fixes the missing WITH CHECK clause in the UPDATE policy

-- 1. Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Coaches can update their own training sessions" ON training_sessions;

-- 2. Create the corrected UPDATE policy with WITH CHECK clause
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

-- 3. Verify the policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'training_sessions'
ORDER BY policyname;
