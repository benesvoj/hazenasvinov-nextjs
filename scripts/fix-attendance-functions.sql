-- Fix attendance system functions
-- This script updates the get_training_sessions function to handle the UUID/string type mismatch

-- 1. Update get_training_sessions function to fix UUID/string type mismatch
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

-- 2. Update get_attendance_summary function (if it has similar issues)
CREATE OR REPLACE FUNCTION get_attendance_summary(
    p_category VARCHAR(50),
    p_season_id UUID
)
RETURNS TABLE (
    member_id UUID,
    member_name VARCHAR(100),
    member_surname VARCHAR(100),
    total_sessions INTEGER,
    present_count INTEGER,
    absent_count INTEGER,
    late_count INTEGER,
    excused_count INTEGER,
    attendance_percentage NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as member_id,
        m.name as member_name,
        m.surname as member_surname,
        COUNT(ts.id)::INTEGER as total_sessions,
        COUNT(CASE WHEN ma.attendance_status = 'present' THEN 1 END)::INTEGER as present_count,
        COUNT(CASE WHEN ma.attendance_status = 'absent' THEN 1 END)::INTEGER as absent_count,
        COUNT(CASE WHEN ma.attendance_status = 'late' THEN 1 END)::INTEGER as late_count,
        COUNT(CASE WHEN ma.attendance_status = 'excused' THEN 1 END)::INTEGER as excused_count,
        CASE 
            WHEN COUNT(ts.id) > 0 THEN 
                ROUND(
                    (COUNT(CASE WHEN ma.attendance_status = 'present' THEN 1 END)::NUMERIC / COUNT(ts.id)::NUMERIC) * 100, 
                    2
                )
            ELSE 0 
        END as attendance_percentage
    FROM members m
    LEFT JOIN member_attendance ma ON m.id = ma.member_id
    LEFT JOIN training_sessions ts ON ma.training_session_id = ts.id 
        AND ts.category = p_category 
        AND ts.season_id = p_season_id
    WHERE m.category = p_category
    GROUP BY m.id, m.name, m.surname
    ORDER BY m.surname, m.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add comments
COMMENT ON FUNCTION get_training_sessions IS 'Get training sessions for a category and season with proper access control (fixed UUID/string type mismatch)';
COMMENT ON FUNCTION get_attendance_summary IS 'Get attendance summary for a category and season';

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_training_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_attendance_summary TO authenticated;
