-- Update attendance policies to use category_id and then remove category column
-- This handles the dependency issue properly
-- Run this in Supabase SQL Editor

-- Step 1: Check current policies that depend on category column
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'member_attendance'
    AND (qual LIKE '%category%' OR with_check LIKE '%category%');

-- Step 2: Drop existing attendance policies
DROP POLICY IF EXISTS "View attendance policy" ON member_attendance;
DROP POLICY IF EXISTS "Insert attendance policy" ON member_attendance;
DROP POLICY IF EXISTS "Update attendance policy" ON member_attendance;
DROP POLICY IF EXISTS "Delete attendance policy" ON member_attendance;

-- Step 3: Create new policies using category_id
-- View policy - users can view attendance for their category
CREATE POLICY "View attendance policy" ON member_attendance
    FOR SELECT
    USING (
        -- User is admin
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'admin'
        )
        OR
        -- User is coach for the training session's category
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            JOIN categories c ON c.id = ts.category_id
            WHERE ts.id = member_attendance.training_session_id
            AND up.assigned_categories @> ARRAY[c.id]
            AND up.role = 'coach'
        )
        OR
        -- User is the coach of the training session
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = member_attendance.training_session_id
            AND ts.coach_id = auth.uid()
        )
    );

-- Insert policy - coaches can insert attendance for their category
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
        -- User is coach for the training session's category
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            JOIN categories c ON c.id = ts.category_id
            WHERE ts.id = member_attendance.training_session_id
            AND up.assigned_categories @> ARRAY[c.id]
            AND up.role = 'coach'
        )
        OR
        -- User is the coach of the training session
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = member_attendance.training_session_id
            AND ts.coach_id = auth.uid()
        )
    );

-- Update policy - coaches can update attendance for their category
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
        -- User is coach for the training session's category
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            JOIN categories c ON c.id = ts.category_id
            WHERE ts.id = member_attendance.training_session_id
            AND up.assigned_categories @> ARRAY[c.id]
            AND up.role = 'coach'
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
        -- User is coach for the training session's category
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            JOIN categories c ON c.id = ts.category_id
            WHERE ts.id = member_attendance.training_session_id
            AND up.assigned_categories @> ARRAY[c.id]
            AND up.role = 'coach'
        )
        OR
        -- User is the coach of the training session
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = member_attendance.training_session_id
            AND ts.coach_id = auth.uid()
        )
    );

-- Delete policy - coaches can delete attendance for their category
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
        -- User is coach for the training session's category
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            JOIN categories c ON c.id = ts.category_id
            WHERE ts.id = member_attendance.training_session_id
            AND up.assigned_categories @> ARRAY[c.id]
            AND up.role = 'coach'
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
    is_nullable,
    column_default
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

-- Step 7: Add comment to category_id column
COMMENT ON COLUMN training_sessions.category_id IS 'Foreign key reference to categories table - migrated from legacy category VARCHAR field';
