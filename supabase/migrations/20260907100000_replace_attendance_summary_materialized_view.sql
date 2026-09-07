-- =====================================================
-- Migration: Replace attendance_statistics_summary with a plain view
-- Date: 2026-09-07
-- Description: The materialized view has been frozen since it was created.
--              Its "auto-refresh" triggers only call pg_notify and nothing
--              listens, so the object never got a second REFRESH. Measured
--              against production today: last_refreshed = 2025-11-25T14:05:26,
--              three rows, all of them season 2025/2026 — the whole active
--              2026/2027 season is missing, so /api/attendance/statistics
--              returns summary: null for every current category.
--              The query behind it is one GROUP BY over ~300 rows of
--              training_sessions; materialising it never paid for itself. A
--              plain view cannot go stale, and it fixes next_session_date,
--              which compares against CURRENT_DATE and was therefore frozen at
--              refresh time too.
-- Dependencies: training_sessions, attendance_statistics_summary,
--               trigger_refresh_attendance_stats, force_refresh_attendance_stats,
--               scheduled_refresh_attendance_stats,
--               refresh_attendance_statistics_summary,
--               listen_for_attendance_stats_refresh, attendance_stats_trigger_info
-- =====================================================
--
-- MEASURED BEFORE WRITING, against production:
--   attendance_statistics_summary  3 rows, last_refreshed 2025-11-25
--   training_sessions              291 rows across 8 category/season pairs
--   the 2026/2027 season           absent from the view entirely
--
-- CODE PATHS CHECKED:
--   /api/attendance/statistics     .from('attendance_statistics_summary')
--                                  .select('*').maybeSingle() — a view answers
--                                  this identically, no route change needed.
--   /api/admin/refresh-materialized-view
--                                  carried the name in REFRESHABLE_VIEWS but no
--                                  caller ever passed it. Removed in the same
--                                  commit; REFRESH on a plain view errors.
--   nothing else in src/ reads the view or calls the refresh helpers.

-- =====================================================
-- 1. Remove the refresh machinery
-- =====================================================
-- Six statement-level triggers fire on every attendance insert, update and
-- delete to send a notification no process is listening for. They are dropped
-- before the view so nothing can reference an object mid-migration.

DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_insert ON member_attendance;
DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_update ON member_attendance;
DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_delete ON member_attendance;
DROP TRIGGER IF EXISTS refresh_att_stats_on_session_status ON training_sessions;
DROP TRIGGER IF EXISTS refresh_att_stats_on_session_insert ON training_sessions;
DROP TRIGGER IF EXISTS refresh_att_stats_on_session_delete ON training_sessions;

-- Every one of these either runs REFRESH MATERIALIZED VIEW on an object that is
-- about to stop being one, or exists purely to serve the notification scheme
-- above. Left in place they would fail at call time instead of being absent.

DROP FUNCTION IF EXISTS trigger_refresh_attendance_stats() CASCADE;
DROP FUNCTION IF EXISTS listen_for_attendance_stats_refresh() CASCADE;
DROP FUNCTION IF EXISTS scheduled_refresh_attendance_stats() CASCADE;
DROP FUNCTION IF EXISTS force_refresh_attendance_stats() CASCADE;
DROP FUNCTION IF EXISTS refresh_attendance_statistics_summary() CASCADE;

-- Monitoring view over information_schema.triggers filtered to '%att_stats%'.
-- With the triggers gone it can only ever return zero rows.

DROP VIEW IF EXISTS attendance_stats_trigger_info CASCADE;

-- =====================================================
-- 2. Swap the materialized view for a plain one
-- =====================================================
-- Same name, same columns, same types — the API route selects '*' and the
-- generated types stay valid. CASCADE takes the four indexes with it; a view
-- needs none, the underlying idx_training_sessions_category_season already
-- serves the GROUP BY.

DROP MATERIALIZED VIEW IF EXISTS attendance_statistics_summary CASCADE;

-- security_invoker matches the thirteen views already in the schema: the view
-- evaluates as the caller, so RLS on training_sessions applies. That table
-- grants SELECT to `authenticated` only, which means this view cannot hand
-- anything to an anonymous session even if a default privilege grants it.
CREATE VIEW attendance_statistics_summary WITH (security_invoker = 'on') AS
SELECT
  category_id,
  season_id,

  -- Session counts by status
  COUNT(DISTINCT id) FILTER (WHERE status = 'done') AS completed_sessions,
  COUNT(DISTINCT id) FILTER (WHERE status = 'planned') AS planned_sessions,
  COUNT(DISTINCT id) FILTER (WHERE status = 'cancelled') AS cancelled_sessions,

  -- Completion rate calculation
  ROUND(
    COUNT(DISTINCT id) FILTER (WHERE status = 'done')::numeric
    / NULLIF(COUNT(DISTINCT id), 0) * 100,
    2
  ) AS completion_rate,

  -- Date tracking. In the materialized version CURRENT_DATE froze at refresh
  -- time, so next_session_date drifted further from the truth every day.
  MAX(session_date) FILTER (WHERE status = 'done') AS last_session_date,
  MIN(session_date) FILTER (WHERE status = 'planned' AND session_date > CURRENT_DATE)
    AS next_session_date,

  -- Kept so `select('*')` and the generated types are unchanged. On a plain
  -- view the answer is always "now", which is the point of this migration.
  NOW() AS last_refreshed

FROM training_sessions
WHERE category_id IS NOT NULL
  AND season_id IS NOT NULL
GROUP BY category_id, season_id;

COMMENT ON VIEW attendance_statistics_summary IS
'Per category/season training session counts and completion rate. Was a
materialized view until 2026-09-07; nothing refreshed it, so it served numbers
from 2025-11-25 for nine months. The aggregate is one GROUP BY over a few
hundred rows and is computed on read.';

-- =====================================================
-- 3. Grants
-- =====================================================
-- Supabase carries ALTER DEFAULT PRIVILEGES ... IN SCHEMA public GRANT ... TO
-- anon, so a freshly created object is readable by the browser key unless the
-- grants are stated. 20260810_restrict_materialized_views learned this the hard
-- way when a recreated leaderboard started handing out real names again.

REVOKE ALL ON public.attendance_statistics_summary FROM PUBLIC, anon;
GRANT SELECT ON public.attendance_statistics_summary TO authenticated, service_role;

-- =====================================================
-- Verify
-- =====================================================
-- 1. It is no longer materialized, and no refresh machinery is left:
--
-- SELECT relkind FROM pg_class WHERE relname = 'attendance_statistics_summary';
--   -- must be 'v', not 'm'
--
-- SELECT tgname FROM pg_trigger WHERE tgname LIKE 'refresh_att_stats%';
--   -- must be empty
--
-- 2. Every category/season with sessions now has a row — before this migration
--    there were three, all from season 2025/2026:
--
-- SELECT COUNT(*) FROM attendance_statistics_summary;
--   -- must match: SELECT COUNT(*) FROM (
--   --   SELECT 1 FROM training_sessions
--   --   WHERE category_id IS NOT NULL AND season_id IS NOT NULL
--   --   GROUP BY category_id, season_id) x;
--
-- 3. With the anon key it must answer 401/empty, and the coach portal →
--    Docházka must still load its statistics while signed in:
--
--   curl -s -o /dev/null -w "%{http_code}\n" \
--     "$URL/rest/v1/attendance_statistics_summary?select=*&limit=1" \
--     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"

NOTIFY pgrst, 'reload schema';
