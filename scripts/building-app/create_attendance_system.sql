-- Create member attendance system
-- This script creates tables and functions for tracking member attendance at training sessions

-- 1. Create training_sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    session_date DATE NOT NULL,
    session_time TIME,
    category VARCHAR(50) NOT NULL,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    location VARCHAR(200),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_valid_category CHECK (category IN ('men', 'women', 'juniorBoys', 'juniorGirls', 'prepKids', 'youngestKids', 'youngerBoys', 'youngerGirls', 'olderBoys', 'olderGirls'))
);

-- 2. Create member_attendance table
CREATE TABLE IF NOT EXISTS member_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    training_session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (attendance_status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, training_session_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_category ON training_sessions(category);
CREATE INDEX IF NOT EXISTS idx_training_sessions_season ON training_sessions(season_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach ON training_sessions(coach_id);

CREATE INDEX IF NOT EXISTS idx_member_attendance_member ON member_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_member_attendance_session ON member_attendance(training_session_id);
CREATE INDEX IF NOT EXISTS idx_member_attendance_status ON member_attendance(attendance_status);
CREATE INDEX IF NOT EXISTS idx_member_attendance_recorded_by ON member_attendance(recorded_by);

-- 4. Enable RLS
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_attendance ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for training_sessions
-- Coaches can view sessions for their assigned categories
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

-- Coaches can insert sessions for their assigned categories
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

-- Coaches can update their own sessions
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
    );

-- Coaches can delete their own sessions
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

-- 6. Create RLS policies for member_attendance
-- Coaches can view attendance for their categories
CREATE POLICY "Coaches can view attendance for their categories" ON member_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE ts.id = member_attendance.training_session_id
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.code = ts.category
                ))
            )
        )
    );

-- Coaches can insert attendance for their categories
CREATE POLICY "Coaches can create attendance for their categories" ON member_attendance
    FOR INSERT WITH CHECK (
        recorded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE ts.id = training_session_id
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.code = ts.category
                ))
            )
        )
    );

-- Coaches can update attendance for their categories
CREATE POLICY "Coaches can update attendance for their categories" ON member_attendance
    FOR UPDATE USING (
        recorded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE ts.id = training_session_id
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.code = ts.category
                ))
            )
        )
    );

-- Coaches can delete attendance for their categories
CREATE POLICY "Coaches can delete attendance for their categories" ON member_attendance
    FOR DELETE USING (
        recorded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE ts.id = training_session_id
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.code = ts.category
                ))
            )
        )
    );

-- 7. Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_training_sessions_updated_at 
    BEFORE UPDATE ON training_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_attendance_updated_at 
    BEFORE UPDATE ON member_attendance 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Create helper functions
-- Function to get attendance summary for a category and season
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

-- Function to get training sessions for a category and season
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
                (up.role = 'coach' AND up.assigned_categories @> ARRAY[ts.category])
            )
        )
    )
    ORDER BY ts.session_date DESC, ts.session_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Add comments
COMMENT ON TABLE training_sessions IS 'Training sessions for different categories and seasons';
COMMENT ON TABLE member_attendance IS 'Member attendance records for training sessions';
COMMENT ON FUNCTION get_attendance_summary IS 'Get attendance summary for a category and season';
COMMENT ON FUNCTION get_training_sessions IS 'Get training sessions for a category and season with proper access control';
