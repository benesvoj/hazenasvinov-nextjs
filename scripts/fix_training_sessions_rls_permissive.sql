-- Temporary fix for training_sessions RLS policy
-- This creates a more permissive policy to allow debugging

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Coaches can create training sessions for their categories" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can view training sessions for their categories" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can update their own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can delete their own training sessions" ON training_sessions;

-- 2. Create temporary permissive policies for debugging
-- Allow all authenticated users to read training sessions
CREATE POLICY "Allow authenticated users to read training sessions" ON training_sessions
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow all authenticated users to insert training sessions (temporary)
CREATE POLICY "Allow authenticated users to create training sessions" ON training_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow users to update their own training sessions
CREATE POLICY "Allow users to update their own training sessions" ON training_sessions
    FOR UPDATE
    TO authenticated
    USING (coach_id = auth.uid())
    WITH CHECK (coach_id = auth.uid());

-- Allow users to delete their own training sessions
CREATE POLICY "Allow users to delete their own training sessions" ON training_sessions
    FOR DELETE
    TO authenticated
    USING (coach_id = auth.uid());

-- 3. Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'training_sessions'
ORDER BY policyname;

-- 4. Test insert (this should work now)
-- You can test by trying to create a training session in the UI
