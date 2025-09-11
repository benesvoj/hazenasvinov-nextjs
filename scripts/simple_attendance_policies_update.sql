-- Simple update of attendance policies to use category_id
-- This version uses a simpler approach without complex joins
-- Run this in Supabase SQL Editor

-- Step 1: Check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'member_attendance'
ORDER BY policyname;

-- Step 2: Drop existing attendance policies
DROP POLICY IF EXISTS "View attendance policy" ON member_attendance;
DROP POLICY IF EXISTS "Insert attendance policy" ON member_attendance;
DROP POLICY IF EXISTS "Update attendance policy" ON member_attendance;
DROP POLICY IF EXISTS "Delete attendance policy" ON member_attendance;

-- Step 3: Create simplified policies using category_id
-- View policy - users can view attendance for training sessions they coach
CREATE POLICY "View attendance policy" ON member_attendance
    FOR SELECT
    USING (
        -- User is admin (check if user has admin role)
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'admin'
        )
        OR
        -- User is the coach of the training session
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = member_attendance.training_session_id
            AND ts.coach_id = auth.uid()
        )
    );

-- Insert policy - coaches can insert attendance for their training sessions
CREATE POLICY "Insert attendance policy" ON member_attendance
    FOR INSERT
    WITH CHECK (
        -- User is admin
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'admin'
        )
        OR
        -- User is the coach of the training session
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = member_attendance.training_session_id
            AND ts.coach_id = auth.uid()
        )
    );

-- Update policy - coaches can update attendance for their training sessions
CREATE POLICY "Update attendance policy" ON member_attendance
    FOR UPDATE
    USING (
        -- User is admin
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'admin'
        )
        OR
        -- User is the coach of the training session
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = member_attendance.training_session_id
            AND ts.coach_id = auth.uid()
        )
    )
    WITH CHECK (
        -- User is admin
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'admin'
        )
        OR
        -- User is the coach of the training session
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = member_attendance.training_session_id
            AND ts.coach_id = auth.uid()
        )
    );

-- Delete policy - coaches can delete attendance for their training sessions
CREATE POLICY "Delete attendance policy" ON member_attendance
    FOR DELETE
    USING (
        -- User is admin
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'admin'
        )
        OR
        -- User is the coach of the training session
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = member_attendance.training_session_id
            AND ts.coach_id = auth.uid()
        )
    );

-- Step 4: Now we can safely drop the category column
ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS check_valid_category;
ALTER TABLE training_sessions DROP COLUMN IF EXISTS category;

-- Step 5: Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'training_sessions'
    AND column_name IN ('category', 'category_id')
ORDER BY column_name;

-- Step 6: Verify new policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'member_attendance'
ORDER BY policyname;
