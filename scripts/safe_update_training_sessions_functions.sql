-- Safe update of training_sessions related functions to use category_id instead of category VARCHAR
-- This script handles function conflicts more gracefully
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all existing functions with the same names to avoid conflicts
DO $$ 
BEGIN
    -- Drop get_training_sessions functions
    DROP FUNCTION IF EXISTS get_training_sessions(VARCHAR(50), UUID, UUID);
    DROP FUNCTION IF EXISTS get_training_sessions(UUID, UUID, UUID);
    
    -- Drop get_attendance_summary functions
    DROP FUNCTION IF EXISTS get_attendance_summary(VARCHAR(50), UUID, UUID);
    DROP FUNCTION IF EXISTS get_attendance_summary(UUID, UUID, UUID);
    
    -- Drop get_attendance_records functions
    DROP FUNCTION IF EXISTS get_attendance_records(UUID, UUID);
    DROP FUNCTION IF EXISTS get_attendance_records(UUID, UUID, UUID);
    
    RAISE NOTICE 'Dropped existing functions';
END $$;

-- Step 2: Create new get_training_sessions function that uses category_id
CREATE OR REPLACE FUNCTION get_training_sessions(
    p_category_id UUID,
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
    WHERE ts.category_id = p_category_id 
    AND ts.season_id = p_season_id
    AND (
        -- Check if user is a coach for this category
        ts.coach_id = p_user_id
        OR
        -- Check if user has coach role for this category
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN categories c ON c.id = p_category_id
            WHERE ur.user_id = p_user_id 
            AND ur.assigned_category_codes @> ARRAY[c.code]
            AND ur.role = 'coach'
        )
        OR
        -- Check if user is admin
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = p_user_id 
            AND ur.role = 'admin'
        )
    )
    ORDER BY ts.session_date DESC, ts.session_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create new get_attendance_summary function that uses category_id
CREATE OR REPLACE FUNCTION get_attendance_summary(
    p_category_id UUID,
    p_season_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    session_id UUID,
    session_title VARCHAR(200),
    session_date DATE,
    total_members INTEGER,
    present_count INTEGER,
    absent_count INTEGER,
    late_count INTEGER,
    excused_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id as session_id,
        ts.title as session_title,
        ts.session_date,
        COUNT(ma.id)::INTEGER as total_members,
        COUNT(CASE WHEN ma.attendance_status = 'present' THEN 1 END)::INTEGER as present_count,
        COUNT(CASE WHEN ma.attendance_status = 'absent' THEN 1 END)::INTEGER as absent_count,
        COUNT(CASE WHEN ma.attendance_status = 'late' THEN 1 END)::INTEGER as late_count,
        COUNT(CASE WHEN ma.attendance_status = 'excused' THEN 1 END)::INTEGER as excused_count
    FROM training_sessions ts
    LEFT JOIN member_attendance ma ON ts.id = ma.training_session_id
    WHERE ts.category_id = p_category_id 
    AND ts.season_id = p_season_id
    AND (
        -- Check if user is a coach for this category
        ts.coach_id = p_user_id
        OR
        -- Check if user has coach role for this category
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN categories c ON c.id = p_category_id
            WHERE ur.user_id = p_user_id 
            AND ur.assigned_category_codes @> ARRAY[c.code]
            AND ur.role = 'coach'
        )
        OR
        -- Check if user is admin
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = p_user_id 
            AND ur.role = 'admin'
        )
    )
    GROUP BY ts.id, ts.title, ts.session_date
    ORDER BY ts.session_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create new get_attendance_records function that uses category_id
CREATE OR REPLACE FUNCTION get_attendance_records(
    p_session_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    member_id UUID,
    member_name VARCHAR(255),
    member_surname VARCHAR(255),
    attendance_status VARCHAR(20),
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ma.id,
        ma.member_id,
        m.name as member_name,
        m.surname as member_surname,
        ma.attendance_status,
        ma.notes,
        ma.recorded_at
    FROM member_attendance ma
    JOIN members m ON ma.member_id = m.id
    JOIN training_sessions ts ON ma.training_session_id = ts.id
    WHERE ma.training_session_id = p_session_id
    AND (
        -- Check if user is a coach for this session's category
        ts.coach_id = p_user_id
        OR
        -- Check if user has coach role for this session's category
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN categories c ON c.id = ts.category_id
            WHERE ur.user_id = p_user_id 
            AND ur.assigned_category_codes @> ARRAY[c.code]
            AND ur.role = 'coach'
        )
        OR
        -- Check if user is admin
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = p_user_id 
            AND ur.role = 'admin'
        )
    )
    ORDER BY m.surname, m.name;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION get_training_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_attendance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_attendance_records TO authenticated;

-- Step 6: Add comments
COMMENT ON FUNCTION get_training_sessions IS 'Get training sessions for a category and season using category_id (updated from VARCHAR)';
COMMENT ON FUNCTION get_attendance_summary IS 'Get attendance summary for a category and season using category_id (updated from VARCHAR)';
COMMENT ON FUNCTION get_attendance_records IS 'Get attendance records for a specific session using category_id (updated from VARCHAR)';

-- Step 7: Verify functions were created successfully
SELECT 
    'Function Creation Verification' as status,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name IN ('get_training_sessions', 'get_attendance_summary', 'get_attendance_records')
ORDER BY routine_name;
