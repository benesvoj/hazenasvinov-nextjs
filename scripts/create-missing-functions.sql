-- Create missing RPC functions for attendance system
-- This script creates the get_training_sessions function that's missing

-- 1. Create get_training_sessions function
CREATE OR REPLACE FUNCTION get_training_sessions(
    p_category VARCHAR(50),
    p_season_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    description TEXT,
    session_date DATE,
    session_time TIME,
    location VARCHAR(200),
    coach_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id,
        ts.title,
        ts.description,
        ts.session_date,
        ts.session_time,
        ts.location,
        ts.coach_id,
        ts.created_at
    FROM training_sessions ts
    WHERE ts.category = p_category 
    AND ts.season_id = p_season_id
    AND (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = p_user_id
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c
                    WHERE c.id = ANY(up.assigned_categories)
                    AND c.code = ts.category
                ))
            )
        )
    )
    ORDER BY ts.session_date DESC, ts.session_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION get_training_sessions TO authenticated;

-- 3. Add comment
COMMENT ON FUNCTION get_training_sessions IS 'Get training sessions for a category and season with proper access control';

-- 4. Test the function (optional)
-- This will show if the function works
-- SELECT * FROM get_training_sessions('men', 'af8aa719-d265-4e34-bb9c-07ebdcda8a74', 'c5dfe1d7-4286-49dc-93b1-e43eb65d182f');
