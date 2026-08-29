-- =====================================================
-- Migration: Keep deactivated members out of attendance statistics
-- Date: 2026-08-29
-- Description: Both attendance statistics functions read `members` without
--              looking at `is_active`, so members deactivated (vyřazení) from
--              the club still shape the numbers.
--              `get_member_attendance_stats` returns a row for every member of
--              the category, so a player who left shows up at 0 % and lands in
--              the "Low Attendance Alert" insight and the "Contact Members"
--              recommendation. `get_attendance_trends` counts them into
--              `total_members`, which is the denominator of every session's
--              attendance percentage — each deactivated member silently drags
--              the whole trend chart down.
--              The rule this restores: a deactivated member stays visible
--              wherever a record for them already exists, and disappears from
--              everything computed fresh.
-- Dependencies: members, member_attendance, training_sessions,
--               get_member_attendance_stats, get_attendance_trends
-- =====================================================
--
-- CREATE OR REPLACE, not DROP + CREATE. A drop would reset the grants set by
-- 20260810_revoke_definer_functions_from_anon (anon must not reach attendance
-- data). Replacing keeps ownership and ACL — but it does reset attributes that
-- are not restated, so STABLE / SECURITY DEFINER / SET search_path are spelled
-- out again below, matching 20260810_pin_function_search_path.
--
-- Signatures and return shapes are unchanged; only the row sets differ.

-- =====================================================
-- Function: get_member_attendance_stats
-- =====================================================
-- Returns: one row per member, unchanged in shape.
-- Changed: a member is included when they are still active OR when they have
-- at least one attendance record among the done sessions of this
-- category/season. The second half of that condition is what keeps history
-- intact — a player who trained all autumn and then left keeps their counts.
-- A deactivated member who never had a record is simply gone.

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
SET search_path = public, extensions, pg_temp
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
    AND (
      m.is_active
      -- A deactivated member is kept only for the sessions they were recorded
      -- at; without a record there is nothing to report and they drop out.
      OR EXISTS (
        SELECT 1
        FROM member_attendance ma2
        WHERE ma2.member_id = m.id
          AND ma2.training_session_id IN (SELECT id FROM done_sessions)
      )
    )
  GROUP BY m.id, m.name, m.surname, dsc.total
  ORDER BY m.surname, m.name;
END;
$$;

COMMENT ON FUNCTION get_member_attendance_stats(UUID, UUID) IS
'Returns attendance statistics for all members in a category/season.
Counts are scoped to done sessions only to keep total_sessions and
present_count consistent (attendance_percentage never exceeds 100%).
Deactivated members are returned only when they have at least one attendance
record among those sessions, so history stays readable while members who left
without a record disappear from the statistics.';

-- =====================================================
-- Function: get_attendance_trends
-- =====================================================
-- Returns: one row per training session, unchanged in shape.
-- Changed: `total_members` — the denominator of attendance_percentage — used to
-- be one category-wide count of every member row, deactivated ones included, so
-- each member who left the club silently dragged every session's percentage
-- down. It is now resolved per session:
--
--   * the session has attendance records -> the number of members recorded at
--     it. Attendance sheets are generated for the whole squad at once, so that
--     count IS the squad as it stood when the session happened. It is the
--     historically honest denominator, it cannot be moved by a deactivation
--     that happened afterwards, and because the numerator counts a subset of
--     the same records the percentage can never exceed 100 %.
--   * the session has no records yet (planned, sheet not generated) -> the
--     active squad. This is the only branch where a deactivated member could
--     still be counted, and it is exactly the "computed fresh" case the rule
--     says they must stay out of.
--
-- Verified against a full copy of production: every session of Mladsi zacky
-- 2025/2026 carries 20 records, and the sessions' percentages now match those
-- 20 rather than the 19 category members or the 23 the first draft produced by
-- unioning in members who had since moved to another category.

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
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Calculate date range
  v_end_date := CURRENT_DATE;
  v_start_date := v_end_date - p_days;

  RETURN QUERY
  WITH active_squad AS (
    SELECT COUNT(*)::BIGINT AS total
    FROM members
    WHERE category_id = p_category_id
      AND is_active
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

    -- The squad this session is measured against: the members it actually
    -- recorded, falling back to the active squad while it has none.
    COALESCE(NULLIF(COUNT(DISTINCT ma.member_id), 0), asq.total) as total_members,

    ROUND(
      COALESCE(
        COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
        / NULLIF(COALESCE(NULLIF(COUNT(DISTINCT ma.member_id), 0), asq.total), 0) * 100,
        0
      ),
      2
    ) as attendance_percentage

  FROM training_sessions ts
  CROSS JOIN active_squad asq
  LEFT JOIN member_attendance ma ON ma.training_session_id = ts.id
  WHERE ts.category_id = p_category_id
    AND ts.season_id = p_season_id
    AND ts.session_date >= v_start_date
    AND ts.session_date <= v_end_date
  GROUP BY ts.id, ts.session_date, ts.title, asq.total
  ORDER BY ts.session_date ASC;
END;
$$;

COMMENT ON FUNCTION get_attendance_trends(UUID, UUID, INTEGER) IS
'Returns per-session attendance trends for a category/season over the last
p_days days. total_members is the squad the session is measured against: the
members it recorded, or the active squad while it has recorded none. Members
deactivated from the club therefore never move the percentage of a session that
already happened, and never inflate one that has not.';

-- =====================================================
-- Re-assert the grants — and close a hole in them
-- =====================================================
-- CREATE OR REPLACE preserves the ACL, so on a database that already ran
-- 20251125_create_attendance_functions and
-- 20260810_revoke_definer_functions_from_anon the GRANT and the anon REVOKE
-- below are no-ops. They are restated so this file also does the right thing on
-- a database restored from an older dump.
--
-- The REVOKE FROM PUBLIC is not a restatement — it is a fix.
-- 20260810_revoke_definer_functions_from_anon revokes EXECUTE from `anon`
-- only, but CREATE FUNCTION grants EXECUTE to PUBLIC by default and `anon`
-- inherits it, so that revoke never took effect: anon can still call both of
-- these SECURITY DEFINER functions and read attendance data for children.
-- 20260807_urgent_revoke_exec_sql got this right ("FROM PUBLIC, anon,
-- authenticated"); 20260810 did not.
--
-- Verified before writing: `authenticated` holds an explicit grant of its own
-- (20251125_create_attendance_functions lines 81 and 168) and the statistics
-- endpoint calls these with the caller's client behind withAuth, so dropping
-- the PUBLIC grant does not take access away from a signed-in coach. The GRANT
-- is restated first so the order is safe on a fresh database too.
--
-- SCOPE: only these two functions. The other eleven in 20260810 have the same
-- ineffective revoke and need their own migration.

GRANT EXECUTE ON FUNCTION public.get_member_attendance_stats(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_trends(uuid, uuid, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_member_attendance_stats(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_attendance_trends(uuid, uuid, integer) FROM PUBLIC, anon;

-- =====================================================
-- Verification
-- =====================================================
-- Both queries must come back empty. Replace the ids with a real
-- category/season that has at least one deactivated member.
--
-- 1. No deactivated member without a recorded session may be listed:
--
-- SELECT s.member_id
-- FROM get_member_attendance_stats('<category-uuid>', '<season-uuid>') s
-- JOIN members m ON m.id = s.member_id
-- WHERE NOT m.is_active
--   AND s.present_count + s.absent_count + s.late_count + s.excused_count = 0;
--
-- 2. total_members must match the active squad size:
--
-- SELECT DISTINCT t.total_members
-- FROM get_attendance_trends('<category-uuid>', '<season-uuid>', 3650) t
-- WHERE t.total_members <> (
--   SELECT COUNT(*) FROM members
--   WHERE category_id = '<category-uuid>' AND is_active
-- );
