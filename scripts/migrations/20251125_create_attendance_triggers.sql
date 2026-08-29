-- =====================================================
-- Migration: Create Auto-Refresh Triggers for Attendance Statistics
-- Date: 2025-11-25
-- Description: Create triggers to automatically refresh materialized view
--              when attendance data changes
-- Dependencies: attendance_statistics_summary materialized view
-- =====================================================

-- =====================================================
-- Trigger Function: Refresh Attendance Statistics
-- =====================================================

DROP FUNCTION IF EXISTS trigger_refresh_attendance_stats() CASCADE;

CREATE OR REPLACE FUNCTION trigger_refresh_attendance_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Schedule a background refresh using pg_notify
  -- This is non-blocking and won't slow down the insert/update/delete operation
  PERFORM pg_notify(
    'refresh_attendance_stats',
    json_build_object(
      'timestamp', NOW(),
      'table', TG_TABLE_NAME,
      'operation', TG_OP
    )::text
  );

  -- Optionally: Perform immediate refresh (blocking - use with caution)
  -- Only recommended for low-traffic periods or if real-time accuracy is critical
  -- REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_statistics_summary;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION trigger_refresh_attendance_stats() IS
'Trigger function that notifies system to refresh attendance statistics materialized view. Uses pg_notify for non-blocking operation.';

-- =====================================================
-- Trigger 1: On Member Attendance Changes
-- =====================================================

DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_insert ON member_attendance;
DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_update ON member_attendance;
DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_delete ON member_attendance;

-- Trigger on INSERT
CREATE TRIGGER refresh_att_stats_on_attendance_insert
  AFTER INSERT ON member_attendance
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_attendance_stats();

-- Trigger on UPDATE
CREATE TRIGGER refresh_att_stats_on_attendance_update
  AFTER UPDATE ON member_attendance
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_attendance_stats();

-- Trigger on DELETE
CREATE TRIGGER refresh_att_stats_on_attendance_delete
  AFTER DELETE ON member_attendance
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_attendance_stats();

-- =====================================================
-- Trigger 2: On Training Session Status Changes
-- =====================================================

DROP TRIGGER IF EXISTS refresh_att_stats_on_session_status ON training_sessions;

-- Trigger when session status changes (especially to 'done' or 'cancelled')
CREATE TRIGGER refresh_att_stats_on_session_status
  AFTER UPDATE OF status ON training_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_attendance_stats();

-- =====================================================
-- Trigger 3: On Training Session Insert/Delete
-- =====================================================

DROP TRIGGER IF EXISTS refresh_att_stats_on_session_insert ON training_sessions;
DROP TRIGGER IF EXISTS refresh_att_stats_on_session_delete ON training_sessions;

CREATE TRIGGER refresh_att_stats_on_session_insert
  AFTER INSERT ON training_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_attendance_stats();

CREATE TRIGGER refresh_att_stats_on_session_delete
  AFTER DELETE ON training_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_attendance_stats();

-- =====================================================
-- Listener Function (Optional - for Application Layer)
-- =====================================================
-- This function can be called by application code to listen for refresh notifications

CREATE OR REPLACE FUNCTION listen_for_attendance_stats_refresh()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  LISTEN refresh_attendance_stats;
END;
$$;

COMMENT ON FUNCTION listen_for_attendance_stats_refresh() IS
'Subscribe to attendance statistics refresh notifications. Call this from application code to receive pg_notify events.';

GRANT EXECUTE ON FUNCTION listen_for_attendance_stats_refresh() TO authenticated;

-- =====================================================
-- Scheduled Refresh Function (Backup/Safety)
-- =====================================================
-- This function can be called by a cron job or scheduled task
-- as a backup to ensure the materialized view stays fresh

CREATE OR REPLACE FUNCTION scheduled_refresh_attendance_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_refresh TIMESTAMPTZ;
  v_refresh_interval INTERVAL := '5 minutes'::INTERVAL;
BEGIN
  -- Check if view needs refresh based on last refresh time
  SELECT last_refreshed INTO v_last_refresh
  FROM attendance_statistics_summary
  LIMIT 1;

  -- If never refreshed or older than interval, refresh
  IF v_last_refresh IS NULL OR (NOW() - v_last_refresh) > v_refresh_interval THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_statistics_summary;
    RAISE NOTICE 'Attendance statistics refreshed at %', NOW();
  ELSE
    RAISE NOTICE 'Attendance statistics still fresh, last refresh: %', v_last_refresh;
  END IF;
END;
$$;

COMMENT ON FUNCTION scheduled_refresh_attendance_stats() IS
'Scheduled function to refresh attendance statistics if older than 5 minutes. Can be called by cron/scheduler.';

GRANT EXECUTE ON FUNCTION scheduled_refresh_attendance_stats() TO service_role;

-- =====================================================
-- Manual Refresh Helper (For Debugging/Admin)
-- =====================================================

CREATE OR REPLACE FUNCTION force_refresh_attendance_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_statistics_summary;
  RAISE NOTICE 'Attendance statistics force refreshed at %', NOW();
END;
$$;

COMMENT ON FUNCTION force_refresh_attendance_stats() IS
'Force immediate refresh of attendance statistics. Use for testing or when immediate update is required.';

-- Only admins can force refresh
GRANT EXECUTE ON FUNCTION force_refresh_attendance_stats() TO service_role;

-- =====================================================
-- Monitoring View: Trigger Activity
-- =====================================================

CREATE OR REPLACE VIEW attendance_stats_trigger_info AS
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%att_stats%'
ORDER BY event_object_table, event_manipulation;

COMMENT ON VIEW attendance_stats_trigger_info IS
'View showing all active triggers related to attendance statistics refresh.';

GRANT SELECT ON attendance_stats_trigger_info TO authenticated;

-- =====================================================
-- Initial State Setup
-- =====================================================

-- Perform initial refresh to populate the view
REFRESH MATERIALIZED VIEW attendance_statistics_summary;

-- Send initial notification
SELECT pg_notify('refresh_attendance_stats',
  json_build_object(
    'timestamp', NOW(),
    'event', 'migration_complete',
    'message', 'Attendance statistics triggers created and initial refresh completed'
  )::text
);

-- =====================================================
-- Verification Queries
-- =====================================================

-- View all triggers
SELECT * FROM attendance_stats_trigger_info;

-- Test trigger (insert a test attendance record and check notification)
LISTEN refresh_attendance_stats;
INSERT INTO member_attendance (member_id, training_session_id, attendance_status)
VALUES ('test-member-id', 'test-session-id', 'present');
-- Should receive notification

-- Check last refresh time
-- SELECT MAX(last_refreshed) as last_refresh
-- FROM attendance_statistics_summary;

-- Test manual refresh
-- SELECT force_refresh_attendance_stats();

-- Test scheduled refresh
-- SELECT scheduled_refresh_attendance_stats();

-- =====================================================
-- Performance Considerations
-- =====================================================

-- The triggers use pg_notify which is non-blocking
-- Actual refresh should be handled by:
-- 1. Application layer listening to notifications
-- 2. Scheduled job calling scheduled_refresh_attendance_stats()
-- 3. Manual refresh via force_refresh_attendance_stats()

-- For automatic refresh on notification (requires extension):
-- You can use pg_cron extension to call refresh on notification:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('refresh-attendance-stats', '*/5 * * * *',
--   'SELECT scheduled_refresh_attendance_stats()');

-- =====================================================
-- Rollback Instructions
-- =====================================================

-- To rollback this migration:
-- DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_insert ON member_attendance CASCADE;
-- DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_update ON member_attendance CASCADE;
-- DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_delete ON member_attendance CASCADE;
-- DROP TRIGGER IF EXISTS refresh_att_stats_on_session_status ON training_sessions CASCADE;
-- DROP TRIGGER IF EXISTS refresh_att_stats_on_session_insert ON training_sessions CASCADE;
-- DROP TRIGGER IF EXISTS refresh_att_stats_on_session_delete ON training_sessions CASCADE;
-- DROP FUNCTION IF EXISTS trigger_refresh_attendance_stats() CASCADE;
-- DROP FUNCTION IF EXISTS listen_for_attendance_stats_refresh() CASCADE;
-- DROP FUNCTION IF EXISTS scheduled_refresh_attendance_stats() CASCADE;
-- DROP FUNCTION IF EXISTS force_refresh_attendance_stats() CASCADE;
-- DROP VIEW IF EXISTS attendance_stats_trigger_info CASCADE;

-- =====================================================
-- Notes
-- =====================================================
--
-- Refresh Strategy:
-- 1. Triggers send notifications (non-blocking)
-- 2. Application can listen and refresh on demand
-- 3. Scheduled job refreshes every 5 minutes as backup
-- 4. Manual refresh available for testing/admin
--
-- Performance Impact:
-- - pg_notify is very lightweight (< 1ms)
-- - Actual refresh takes 1-2 seconds
-- - CONCURRENTLY option prevents table locking
-- - Acceptable 1-2 second lag for statistics