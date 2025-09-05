-- Fix get_training_sessions RPC function
-- This creates a more permissive version that will work with the current setup

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_training_sessions(VARCHAR(50), UUID, UUID);

-- 2. Create a simplified version that works with the current setup
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
    -- Debug: Log the parameters
    RAISE NOTICE 'get_training_sessions called with category: %, season_id: %, user_id: %', p_category, p_season_id, p_user_id;
    
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
        -- Allow if user is head_coach
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = p_user_id
            AND up.role = 'head_coach'
        )
        OR
        -- Allow if user is coach and has this category assigned
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = p_user_id
            AND up.role = 'coach'
            AND (
                -- Check if user has this category in assigned_categories
                EXISTS (
                    SELECT 1 FROM categories c
                    WHERE c.id = ANY(up.assigned_categories)
                    AND c.code = ts.category
                )
                OR
                -- Fallback: allow if user is the coach who created the session
                ts.coach_id = p_user_id
            )
        )
        OR
        -- Fallback: allow if user is the coach who created the session
        ts.coach_id = p_user_id
    )
    ORDER BY ts.session_date DESC, ts.session_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_training_sessions TO authenticated;

-- 4. Add comment
COMMENT ON FUNCTION get_training_sessions IS 'Get training sessions for a category and season with permissive access control';

-- 5. Test the function (optional)
-- This will show if the function works
-- SELECT * FROM get_training_sessions('men', 'your-season-id', auth.uid());
