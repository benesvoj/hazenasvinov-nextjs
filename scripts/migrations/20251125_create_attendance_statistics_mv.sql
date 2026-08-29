-- =====================================================
-- Migration: Create Attendance Statistics Materialized View
-- Date: 2025-11-25
-- Description: Create materialized view for pre-computed attendance summary statistics
--              This reduces query load from 52+ queries to 3 queries
-- Dependencies: training_sessions, member_attendance tables
-- =====================================================

-- Drop existing view if exists (for idempotency)
DROP MATERIALIZED VIEW IF EXISTS attendance_statistics_summary CASCADE;

-- Create materialized view for attendance summary
-- This view pre-computes session counts and completion rates per category/season
CREATE MATERIALIZED VIEW attendance_statistics_summary AS
SELECT
  category_id,
  season_id,
  -- Session counts by status
  COUNT(DISTINCT id) FILTER (WHERE status = 'done') as completed_sessions,
  COUNT(DISTINCT id) FILTER (WHERE status = 'planned') as planned_sessions,
  COUNT(DISTINCT id) FILTER (WHERE status = 'cancelled') as cancelled_sessions,

  -- Completion rate calculation
  ROUND(
    COUNT(DISTINCT id) FILTER (WHERE status = 'done')::numeric
    / NULLIF(COUNT(DISTINCT id), 0) * 100,
    2
  ) as completion_rate,

  -- Date tracking
  MAX(session_date) FILTER (WHERE status = 'done') as last_session_date,
  MIN(session_date) FILTER (WHERE status = 'planned' AND session_date > CURRENT_DATE) as next_session_date,

  -- Metadata
  NOW() as last_refreshed
FROM training_sessions
WHERE category_id IS NOT NULL
  AND season_id IS NOT NULL
GROUP BY category_id, season_id;

-- =====================================================
-- Create indexes for optimal query performance
-- =====================================================

-- Primary lookup index (category + season combination)
CREATE UNIQUE INDEX idx_att_stats_summary_pk
  ON attendance_statistics_summary(category_id, season_id);

-- Individual field indexes for filtering
CREATE INDEX idx_att_stats_summary_category
  ON attendance_statistics_summary(category_id);

CREATE INDEX idx_att_stats_summary_season
  ON attendance_statistics_summary(season_id);

-- Index for checking refresh status
CREATE INDEX idx_att_stats_summary_last_refreshed
  ON attendance_statistics_summary(last_refreshed);

-- =====================================================
-- Grant permissions
-- =====================================================

-- Allow authenticated users to read the view
GRANT SELECT ON attendance_statistics_summary TO authenticated;

-- Allow service role full access (for refresh operations)
GRANT ALL ON attendance_statistics_summary TO service_role;

-- =====================================================
-- Create refresh function (for manual refresh if needed)
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_attendance_statistics_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use CONCURRENTLY to avoid locking the view during refresh
  -- Note: CONCURRENTLY requires a unique index (created above)
  REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_statistics_summary;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_attendance_statistics_summary() TO authenticated;

-- =====================================================
-- Initial data population
-- =====================================================

-- Populate the materialized view with initial data
REFRESH MATERIALIZED VIEW attendance_statistics_summary;

-- =====================================================
-- Verification queries (run after migration)
-- =====================================================

-- Verify view exists and has data
SELECT * FROM attendance_statistics_summary LIMIT 5;

-- Check view size
SELECT pg_size_pretty(pg_total_relation_size('attendance_statistics_summary'));

-- Verify indexes
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'attendance_statistics_summary';

-- Test query performance
EXPLAIN ANALYZE
SELECT * FROM attendance_statistics_summary
WHERE category_id = '5b0e437a-b815-4a37-a41d-088566637c7d' AND season_id = 'af8aa719-d265-4e34-bb9c-07ebdcda8a74';

-- =====================================================
-- Rollback instructions
-- =====================================================

-- To rollback this migration:
-- DROP MATERIALIZED VIEW IF EXISTS attendance_statistics_summary CASCADE;
-- DROP FUNCTION IF EXISTS refresh_attendance_statistics_summary() CASCADE;