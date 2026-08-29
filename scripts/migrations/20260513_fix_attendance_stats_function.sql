-- =====================================================
-- Migration: Fix get_member_attendance_stats function
-- Date: 2026-05-13
-- Description: Fix attendance percentage calculation — previously present_count
--              counted records for ALL sessions (including 'planned'), while
--              total_sessions only counted 'done' sessions, producing values > 100%.
--              Fix: both counts and total_sessions are now scoped to 'done' sessions only.
-- =====================================================

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
  WITH done_sessions AS (
    SELECT id
    FROM training_sessions
    WHERE category_id = p_category_id
      AND season_id = p_season_id
      AND status = 'done'
  ),
  done_session_count AS (
    SELECT COUNT(*) AS total FROM done_sessions
  )
  SELECT
    m.id AS member_id,
    m.name AS member_name,
    m.surname AS member_surname,

    -- Count only attendance records for done sessions
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present') AS present_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'absent')  AS absent_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'late')    AS late_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'excused') AS excused_count,

    -- Total done sessions (same for all members in the category)
    dsc.total AS total_sessions,

    -- Attendance percentage based only on done sessions
    ROUND(
      COALESCE(
        COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
        / NULLIF(dsc.total, 0) * 100,
        0
      ),
      2
    ) AS attendance_percentage,

    MAX(ma.recorded_at) AS last_attendance_date

  FROM members m
  CROSS JOIN done_session_count dsc
  LEFT JOIN member_attendance ma
    ON  ma.member_id           = m.id
    AND ma.training_session_id IN (SELECT id FROM done_sessions)
  WHERE m.category_id = p_category_id
  GROUP BY m.id, m.name, m.surname, dsc.total
  ORDER BY m.surname, m.name;
END;
$$;

COMMENT ON FUNCTION get_member_attendance_stats(UUID, UUID) IS
'Returns attendance statistics for all members in a category/season.
Counts are scoped to done sessions only to keep total_sessions and
status counts consistent.';

GRANT EXECUTE ON FUNCTION get_member_attendance_stats(UUID, UUID) TO authenticated;
