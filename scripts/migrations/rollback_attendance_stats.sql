-- =====================================================
-- Rollback: Attendance Statistics Optimization
-- Date: 2025-11-25
-- Description: Complete rollback of attendance statistics migrations
-- =====================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║  Rolling Back Attendance Statistics Migrations            ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''

BEGIN;

\echo 'Step 1: Dropping triggers...'

-- Drop all attendance statistics triggers
DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_insert ON member_attendance CASCADE;
DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_update ON member_attendance CASCADE;
DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_delete ON member_attendance CASCADE;
DROP TRIGGER IF EXISTS refresh_att_stats_on_session_status ON training_sessions CASCADE;
DROP TRIGGER IF EXISTS refresh_att_stats_on_session_insert ON training_sessions CASCADE;
DROP TRIGGER IF EXISTS refresh_att_stats_on_session_delete ON training_sessions CASCADE;

\echo '   ✓ Triggers dropped'

\echo ''
\echo 'Step 2: Dropping trigger-related functions...'

-- Drop trigger functions
DROP FUNCTION IF EXISTS trigger_refresh_attendance_stats() CASCADE;
DROP FUNCTION IF EXISTS listen_for_attendance_stats_refresh() CASCADE;
DROP FUNCTION IF EXISTS scheduled_refresh_attendance_stats() CASCADE;
DROP FUNCTION IF EXISTS force_refresh_attendance_stats() CASCADE;

\echo '   ✓ Trigger functions dropped'

\echo ''
\echo 'Step 3: Dropping statistics functions...'

-- Drop main statistics functions
DROP FUNCTION IF EXISTS get_member_attendance_stats(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_attendance_trends(UUID, UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_training_session_stats(UUID, UUID) CASCADE;

\echo '   ✓ Statistics functions dropped'

\echo ''
\echo 'Step 4: Dropping refresh function...'

-- Drop refresh function
DROP FUNCTION IF EXISTS refresh_attendance_statistics_summary() CASCADE;

\echo '   ✓ Refresh function dropped'

\echo ''
\echo 'Step 5: Dropping monitoring views...'

-- Drop monitoring view
DROP VIEW IF EXISTS attendance_stats_trigger_info CASCADE;

\echo '   ✓ Monitoring views dropped'

\echo ''
\echo 'Step 6: Dropping materialized view...'

-- Drop the materialized view (this also drops its indexes)
DROP MATERIALIZED VIEW IF EXISTS attendance_statistics_summary CASCADE;

\echo '   ✓ Materialized view dropped'

\echo ''
\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║  Rollback Complete                                         ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''

-- Verify cleanup
\echo 'Verification:'

SELECT CASE
  WHEN COUNT(*) = 0 THEN '   ✓ Materialized view removed'
  ELSE '   ✗ Materialized view still exists'
END as check
FROM pg_matviews
WHERE matviewname = 'attendance_statistics_summary';

SELECT CASE
  WHEN COUNT(*) = 0 THEN '   ✓ All functions removed'
  ELSE '   ⚠ ' || COUNT(*) || ' functions still exist'
END as check
FROM pg_proc
WHERE proname LIKE '%attendance%stats%';

SELECT CASE
  WHEN COUNT(*) = 0 THEN '   ✓ All triggers removed'
  ELSE '   ⚠ ' || COUNT(*) || ' triggers still exist'
END as check
FROM pg_trigger
WHERE tgname LIKE '%att_stats%';

\echo ''
\echo 'Database state restored to pre-migration.'
\echo 'Application will fall back to original query patterns.'
\echo ''

COMMIT;

\echo ''
\echo '⚠ Note: API endpoint will return errors until either:'
\echo '   1. Migrations are re-applied, or'
\echo '   2. API code is updated to use old patterns'
\echo ''