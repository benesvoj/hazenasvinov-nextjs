-- =====================================================
-- Migration: Create Attendance Statistics Functions
-- Date: 2025-11-25
-- Description: Create PostgreSQL functions for efficient attendance statistics
--              Replaces N+1 query patterns with single aggregated queries
-- Dependencies: members, member_attendance, training_sessions tables
-- =====================================================

-- =====================================================
-- Function 1: Get Member Attendance Statistics
-- =====================================================
-- Replaces: 1 + N queries (where N = number of members)
-- Returns: Single aggregated query with all member stats

DROP FUNCTION IF EXISTS get_member_attendance_stats(UUID, UUID);

CREATE OR REPLACE FUNCTION get_member_attendance_stats(
  p_category_id UUID,
  p_season_id UUID
)
RETURNS TABLE (
  member_id UUID,
  member_name VARCHAR(100),
  member_surname VARCHAR(100),
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  excused_count BIGINT,
  total_sessions BIGINT,
  attendance_percentage NUMERIC,
  last_attendance_date TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as member_id,
    m.name as member_name,
    m.surname as member_surname,

    -- Count attendance by status
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present') as present_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'absent') as absent_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'late') as late_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'excused') as excused_count,

    -- Total completed sessions for this category/season
    COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'done') as total_sessions,

    -- Calculate attendance percentage
    ROUND(
      COALESCE(
        COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
        / NULLIF(COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'done'), 0) * 100,
        0
      ),
      2
    ) as attendance_percentage,

    -- Last attendance date
    MAX(ma.recorded_at) as last_attendance_date

  FROM members m
  LEFT JOIN member_attendance ma ON m.id = ma.member_id
  LEFT JOIN training_sessions ts ON ma.training_session_id = ts.id
  WHERE m.category_id = p_category_id
    AND ts.season_id = p_season_id
  GROUP BY m.id, m.name, m.surname
  ORDER BY m.surname, m.name;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_member_attendance_stats(UUID, UUID) IS
'Returns attendance statistics for all members in a category/season. Replaces N+1 query pattern.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_member_attendance_stats(UUID, UUID) TO authenticated;

-- =====================================================
-- Function 2: Get Attendance Trends Over Time
-- =====================================================
-- Replaces: 1 + M queries (where M = number of sessions)
-- Returns: Single aggregated query with session-by-session trends

DROP FUNCTION IF EXISTS get_attendance_trends(UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_attendance_trends(
  p_category_id UUID,
  p_season_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  session_id UUID,
  session_date DATE,
  session_title VARCHAR(200),
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  excused_count BIGINT,
  total_members BIGINT,
  attendance_percentage NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Calculate date range
  v_end_date := CURRENT_DATE;
  v_start_date := v_end_date - p_days;

  RETURN QUERY
  WITH category_members AS (
    -- Get total members for this category (for percentage calculation)
    SELECT COUNT(*)::BIGINT as total
    FROM members
    WHERE category_id = p_category_id
  )
  SELECT
    ts.id as session_id,
    ts.session_date::DATE as session_date,
    ts.title as session_title,

    -- Count attendance by status
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present') as present_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'absent') as absent_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'late') as late_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'excused') as excused_count,

    -- Total members in category
    cm.total as total_members,

    -- Calculate attendance percentage
    ROUND(
      COALESCE(
        COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
        / NULLIF(cm.total, 0) * 100,
        0
      ),
      2
    ) as attendance_percentage

  FROM training_sessions ts
  CROSS JOIN category_members cm
  LEFT JOIN member_attendance ma ON ts.id = ma.training_session_id
  WHERE ts.category_id = p_category_id
    AND ts.season_id = p_season_id
    AND ts.status = 'done'
    AND ts.session_date >= v_start_date
    AND ts.session_date <= v_end_date
  GROUP BY ts.id, ts.session_date, ts.title, cm.total
  ORDER BY ts.session_date ASC;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_attendance_trends(UUID, UUID, INTEGER) IS
'Returns attendance trends over specified number of days. Replaces N+1 query pattern for session statistics.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_attendance_trends(UUID, UUID, INTEGER) TO authenticated;

-- =====================================================
-- Function 3: Get Training Session Statistics
-- =====================================================
-- Helper function for quick session stats

DROP FUNCTION IF EXISTS get_training_session_stats(UUID, UUID);

CREATE OR REPLACE FUNCTION get_training_session_stats(
  p_category_id UUID,
  p_season_id UUID
)
RETURNS TABLE (
  total_sessions BIGINT,
  completed_sessions BIGINT,
  planned_sessions BIGINT,
  cancelled_sessions BIGINT,
  completion_rate NUMERIC,
  total_attendance_records BIGINT,
  avg_attendance_per_session NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(ts.id) as total_sessions,
    COUNT(ts.id) FILTER (WHERE ts.status = 'done') as completed_sessions,
    COUNT(ts.id) FILTER (WHERE ts.status = 'planned') as planned_sessions,
    COUNT(ts.id) FILTER (WHERE ts.status = 'cancelled') as cancelled_sessions,
    ROUND(
      COUNT(ts.id) FILTER (WHERE ts.status = 'done')::numeric
      / NULLIF(COUNT(ts.id), 0) * 100,
      2
    ) as completion_rate,
    COUNT(ma.id) as total_attendance_records,
    ROUND(
      COUNT(ma.id)::numeric / NULLIF(COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'done'), 0),
      2
    ) as avg_attendance_per_session
  FROM training_sessions ts
  LEFT JOIN member_attendance ma ON ts.id = ma.training_session_id
  WHERE ts.category_id = p_category_id
    AND ts.season_id = p_season_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_training_session_stats(UUID, UUID) IS
'Returns high-level training session statistics for a category/season.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_training_session_stats(UUID, UUID) TO authenticated;

-- =====================================================
-- Performance Optimization: Indexes
-- =====================================================

-- Ensure critical indexes exist for function performance
-- These may already exist, but we verify them here

-- Index on member_attendance for session lookups
CREATE INDEX IF NOT EXISTS idx_member_attendance_session_id
  ON member_attendance(training_session_id);

-- Index on member_attendance for member lookups
CREATE INDEX IF NOT EXISTS idx_member_attendance_member_id
  ON member_attendance(member_id);

-- Composite index for attendance status filtering
CREATE INDEX IF NOT EXISTS idx_member_attendance_status
  ON member_attendance(attendance_status);

-- Index on training_sessions for category/season lookups
CREATE INDEX IF NOT EXISTS idx_training_sessions_category_season
  ON training_sessions(category_id, season_id);

-- Index on training_sessions for status filtering
CREATE INDEX IF NOT EXISTS idx_training_sessions_status
  ON training_sessions(status);

-- Index on training_sessions for date range queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_session_date
  ON training_sessions(session_date);

-- Index on members for category lookups
CREATE INDEX IF NOT EXISTS idx_members_category_id
  ON members(category_id);

-- =====================================================
-- Test/Verification Queries
-- =====================================================

    select * from training_sessions;
-- Test member stats function
SELECT * FROM get_member_attendance_stats(
  '5b0e437a-b815-4a37-a41d-088566637c7d'::UUID,
  'af8aa719-d265-4e34-bb9c-07ebdcda8a74'::UUID
);

-- Test trends function
SELECT * FROM get_attendance_trends(
  '5b0e437a-b815-4a37-a41d-088566637c7d'::UUID,
  'af8aa719-d265-4e34-bb9c-07ebdcda8a74'::UUID,
  30
);

-- Test session stats function
SELECT * FROM get_training_session_stats(
  '5b0e437a-b815-4a37-a41d-088566637c7d'::UUID,
  'af8aa719-d265-4e34-bb9c-07ebdcda8a74'::UUID
);

-- Performance test
EXPLAIN ANALYZE
SELECT * FROM get_member_attendance_stats(
  '5b0e437a-b815-4a37-a41d-088566637c7d'::UUID,
  'af8aa719-d265-4e34-bb9c-07ebdcda8a74'::UUID
);

-- =====================================================
-- Rollback instructions
-- =====================================================

-- To rollback this migration:
-- DROP FUNCTION IF EXISTS get_member_attendance_stats(UUID, UUID) CASCADE;
-- DROP FUNCTION IF EXISTS get_attendance_trends(UUID, UUID, INTEGER) CASCADE;
-- DROP FUNCTION IF EXISTS get_training_session_stats(UUID, UUID) CASCADE;