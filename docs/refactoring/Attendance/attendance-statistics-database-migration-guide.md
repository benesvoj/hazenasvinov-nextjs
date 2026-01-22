# Attendance Statistics Database Migration Guide

**Version:** 1.0
**Date:** 2025-11-25
**Status:** Ready for Implementation
**Related Docs:** [attendance-statistics-optimization.md](attendance-statistics-optimization.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Migration Files](#migration-files)
3. [Pre-Migration Checklist](#pre-migration-checklist)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Verification & Testing](#verification--testing)
6. [Rollback Procedures](#rollback-procedures)
7. [Performance Benchmarks](#performance-benchmarks)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

This migration implements Phase 1 of the attendance statistics optimization:
- Creates materialized view for pre-computed statistics
- Creates PostgreSQL functions to replace N+1 query patterns
- Implements auto-refresh triggers for data consistency

### Expected Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Database Queries | 52+ queries | 3 queries | **94% reduction** |
| API Response Time | 2-5 seconds | 50-100ms | **95% faster** |
| Query Pattern | N+1 (sequential) | Single aggregation (parallel) | **Eliminates N+1** |
| Scalability | Poor (O(N)) | Excellent (O(1)) | **Scales to 1000+ members** |

### Dependencies

- **Database:** PostgreSQL (via Supabase)
- **Required Tables:**
  - `training_sessions`
  - `member_attendance`
  - `members`
  - `categories`
  - `seasons`
- **Required Permissions:** `service_role` or database admin

---

## Migration Files

Three migration files located in `scripts/migrations/`:

### 1. `20251125_create_attendance_statistics_mv.sql`

**Creates:**
- Materialized view: `attendance_statistics_summary`
- Indexes for optimal query performance
- Manual refresh function: `refresh_attendance_statistics_summary()`

**Size Impact:** ~1KB per category/season combination

**Execution Time:** 2-5 seconds (depends on data volume)

### 2. `20251125_create_attendance_functions.sql`

**Creates:**
- Function: `get_member_attendance_stats(category_id, season_id)`
- Function: `get_attendance_trends(category_id, season_id, days)`
- Function: `get_training_session_stats(category_id, season_id)`
- Performance optimization indexes

**Size Impact:** Minimal (functions only, no data storage)

**Execution Time:** < 1 second

### 3. `20251125_create_attendance_triggers.sql`

**Creates:**
- Trigger function: `trigger_refresh_attendance_stats()`
- Triggers on `member_attendance` table (INSERT, UPDATE, DELETE)
- Triggers on `training_sessions` table (status changes)
- Helper functions for scheduled/manual refresh
- Monitoring view: `attendance_stats_trigger_info`

**Size Impact:** Minimal

**Execution Time:** < 1 second

---

## Pre-Migration Checklist

### Required Actions

- [ ] **Backup Database**
  ```bash
  # Using Supabase CLI
  supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

  # Or using pg_dump directly
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Test in Development Environment**
  - Run migrations on dev database
  - Verify all functions work correctly
  - Check data consistency

- [ ] **Review Current Database State**
  ```sql
  -- Check if objects already exist
  SELECT * FROM pg_matviews WHERE matviewname = 'attendance_statistics_summary';

  -- Check existing functions
  SELECT proname FROM pg_proc WHERE proname LIKE '%attendance_stats%';

  -- Check existing triggers
  SELECT tgname FROM pg_trigger WHERE tgname LIKE '%att_stats%';
  ```

- [ ] **Verify Table Structure**
  ```sql
  -- Ensure required columns exist
  \d training_sessions
  \d member_attendance
  \d members
  ```

- [ ] **Check Database Permissions**
  ```sql
  -- Verify you have CREATE and GRANT permissions
  SELECT has_schema_privilege('public', 'CREATE');
  ```

- [ ] **Schedule Maintenance Window** (optional)
  - Recommended: Low-traffic period
  - Duration: 10-15 minutes
  - Actual downtime: < 1 minute

- [ ] **Notify Team/Users** (if applicable)
  - Brief performance enhancement
  - No user-facing changes expected
  - Rollback plan available

---

## Step-by-Step Migration

### Prerequisites

```bash
# Set your database connection string
export DATABASE_URL="postgresql://user:password@host:port/database"

# Or use Supabase CLI
supabase link --project-ref your-project-ref
```

### Step 1: Backup Database

```bash
# Create backup
pg_dump $DATABASE_URL > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backups/
```

### Step 2: Run Migration 1 - Materialized View

```bash
# Execute migration
psql $DATABASE_URL -f scripts/migrations/20251125_create_attendance_statistics_mv.sql

# Expected output:
# DROP MATERIALIZED VIEW
# CREATE MATERIALIZED VIEW
# CREATE INDEX (multiple)
# GRANT
# CREATE FUNCTION
# GRANT
# REFRESH MATERIALIZED VIEW
```

**Verification:**

```sql
-- Check view exists
SELECT * FROM attendance_statistics_summary LIMIT 5;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'attendance_statistics_summary';

-- Check data was populated
SELECT category_id, season_id, completed_sessions, completion_rate
FROM attendance_statistics_summary
ORDER BY last_refreshed DESC
LIMIT 10;
```

**Expected Result:** Should see rows for each category/season combination with statistics.

### Step 3: Run Migration 2 - Functions

```bash
# Execute migration
psql $DATABASE_URL -f scripts/migrations/20251125_create_attendance_functions.sql

# Expected output:
# DROP FUNCTION (multiple)
# CREATE FUNCTION (3 functions)
# COMMENT ON FUNCTION
# GRANT (multiple)
# CREATE INDEX IF NOT EXISTS (multiple)
```

**Verification:**

```sql
-- List created functions
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN (
  'get_member_attendance_stats',
  'get_attendance_trends',
  'get_training_session_stats'
);

-- Test function (use real IDs from your database)
SELECT * FROM get_member_attendance_stats(
  'your-category-id'::UUID,
  'your-season-id'::UUID
);

-- Test trends function
SELECT * FROM get_attendance_trends(
  'your-category-id'::UUID,
  'your-season-id'::UUID,
  30
);
```

**Expected Result:** Should return attendance statistics for members/sessions.

### Step 4: Run Migration 3 - Triggers

```bash
# Execute migration
psql $DATABASE_URL -f scripts/migrations/20251125_create_attendance_triggers.sql

# Expected output:
# DROP FUNCTION CASCADE
# CREATE FUNCTION
# CREATE TRIGGER (multiple)
# CREATE VIEW
# GRANT
# REFRESH MATERIALIZED VIEW
# SELECT pg_notify
```

**Verification:**

```sql
-- Check triggers were created
SELECT * FROM attendance_stats_trigger_info;

-- Check trigger function exists
SELECT proname FROM pg_proc WHERE proname = 'trigger_refresh_attendance_stats';

-- Test notification system (in separate terminal)
LISTEN refresh_attendance_stats;

-- Then insert test data
INSERT INTO member_attendance (
  member_id,
  training_session_id,
  attendance_status,
  recorded_at
) VALUES (
  'test-member-id'::UUID,
  'test-session-id'::UUID,
  'present',
  NOW()
);
-- Should see notification in listening session
```

**Expected Result:** Triggers listed, notification received on data change.

### Step 5: Verify Complete System

Run comprehensive verification:

```sql
-- 1. Check all objects exist
SELECT 'Materialized View' as object_type,
       COUNT(*) as count
FROM pg_matviews
WHERE matviewname = 'attendance_statistics_summary'
UNION ALL
SELECT 'Functions', COUNT(*)
FROM pg_proc
WHERE proname LIKE '%attendance%stats%'
UNION ALL
SELECT 'Triggers', COUNT(*)
FROM pg_trigger
WHERE tgname LIKE '%att_stats%';

-- Expected: 1 view, 7 functions, 6 triggers

-- 2. Test complete workflow
BEGIN;

-- Get category/season for testing
SELECT id, name FROM categories LIMIT 1;
SELECT id, name FROM seasons WHERE is_active = true LIMIT 1;

-- Test all functions with real data
SELECT * FROM attendance_statistics_summary
WHERE category_id = 'your-category-id'
  AND season_id = 'your-season-id';

SELECT * FROM get_member_attendance_stats(
  'your-category-id'::UUID,
  'your-season-id'::UUID
);

SELECT * FROM get_attendance_trends(
  'your-category-id'::UUID,
  'your-season-id'::UUID,
  30
);

ROLLBACK; -- Don't commit, just testing
```

### Step 6: Performance Benchmarking

```sql
-- Enable timing
\timing on

-- Test query performance
EXPLAIN ANALYZE
SELECT * FROM attendance_statistics_summary
WHERE category_id = 'your-category-id'
  AND season_id = 'your-season-id';
-- Expected: < 10ms, Index Scan

EXPLAIN ANALYZE
SELECT * FROM get_member_attendance_stats(
  'your-category-id'::UUID,
  'your-season-id'::UUID
);
-- Expected: < 100ms

EXPLAIN ANALYZE
SELECT * FROM get_attendance_trends(
  'your-category-id'::UUID,
  'your-season-id'::UUID,
  30
);
-- Expected: < 100ms
```

**Success Criteria:**
- All queries complete in < 200ms
- No sequential scans on large tables
- Indexes are being used

---

## Verification & Testing

### Test Suite

Create a test file: `scripts/test_attendance_migrations.sql`

```sql
-- =====================================================
-- Attendance Statistics Migration Test Suite
-- =====================================================

\echo '===== Starting Attendance Statistics Migration Tests ====='
\echo ''

-- Test 1: Materialized View Exists
\echo 'Test 1: Checking materialized view exists...'
SELECT CASE
  WHEN COUNT(*) = 1 THEN '✓ PASS: Materialized view exists'
  ELSE '✗ FAIL: Materialized view not found'
END as result
FROM pg_matviews
WHERE matviewname = 'attendance_statistics_summary';

-- Test 2: Functions Exist
\echo ''
\echo 'Test 2: Checking functions exist...'
SELECT CASE
  WHEN COUNT(*) >= 7 THEN '✓ PASS: All functions created'
  ELSE '✗ FAIL: Missing functions (' || COUNT(*) || '/7)'
END as result
FROM pg_proc
WHERE proname IN (
  'get_member_attendance_stats',
  'get_attendance_trends',
  'get_training_session_stats',
  'trigger_refresh_attendance_stats',
  'refresh_attendance_statistics_summary',
  'scheduled_refresh_attendance_stats',
  'force_refresh_attendance_stats'
);

-- Test 3: Triggers Exist
\echo ''
\echo 'Test 3: Checking triggers exist...'
SELECT CASE
  WHEN COUNT(*) >= 6 THEN '✓ PASS: All triggers created'
  ELSE '✗ FAIL: Missing triggers (' || COUNT(*) || '/6)'
END as result
FROM pg_trigger
WHERE tgname LIKE '%att_stats%';

-- Test 4: Materialized View Has Data
\echo ''
\echo 'Test 4: Checking materialized view has data...'
SELECT CASE
  WHEN COUNT(*) > 0 THEN '✓ PASS: View has ' || COUNT(*) || ' rows'
  ELSE '⚠ WARNING: View is empty (no category/season data)'
END as result
FROM attendance_statistics_summary;

-- Test 5: Indexes Exist
\echo ''
\echo 'Test 5: Checking indexes exist...'
SELECT CASE
  WHEN COUNT(*) >= 3 THEN '✓ PASS: Indexes created (' || COUNT(*) || ')'
  ELSE '✗ FAIL: Missing indexes'
END as result
FROM pg_indexes
WHERE tablename = 'attendance_statistics_summary';

-- Test 6: Function Performance
\echo ''
\echo 'Test 6: Testing function performance...'
DO $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  duration INTERVAL;
  cat_id UUID;
  seas_id UUID;
BEGIN
  -- Get a valid category and season
  SELECT id INTO cat_id FROM categories LIMIT 1;
  SELECT id INTO seas_id FROM seasons WHERE is_active = true LIMIT 1;

  IF cat_id IS NULL OR seas_id IS NULL THEN
    RAISE NOTICE '⚠ SKIP: No test data available';
    RETURN;
  END IF;

  start_time := clock_timestamp();
  PERFORM * FROM get_member_attendance_stats(cat_id, seas_id);
  end_time := clock_timestamp();
  duration := end_time - start_time;

  IF duration < interval '200 milliseconds' THEN
    RAISE NOTICE '✓ PASS: Function executed in %', duration;
  ELSE
    RAISE NOTICE '⚠ WARNING: Function took % (expected < 200ms)', duration;
  END IF;
END $$;

-- Test 7: Trigger Functionality
\echo ''
\echo 'Test 7: Testing trigger functionality...'
DO $$
DECLARE
  test_member_id UUID;
  test_session_id UUID;
  initial_count INTEGER;
  new_count INTEGER;
BEGIN
  -- Get test IDs
  SELECT id INTO test_member_id FROM members LIMIT 1;
  SELECT id INTO test_session_id FROM training_sessions LIMIT 1;

  IF test_member_id IS NULL OR test_session_id IS NULL THEN
    RAISE NOTICE '⚠ SKIP: No test data available';
    RETURN;
  END IF;

  -- Test that trigger doesn't cause errors
  BEGIN
    INSERT INTO member_attendance (member_id, training_session_id, attendance_status)
    VALUES (test_member_id, test_session_id, 'present')
    ON CONFLICT DO NOTHING;

    -- Clean up test data
    DELETE FROM member_attendance
    WHERE member_id = test_member_id
      AND training_session_id = test_session_id
      AND recorded_at > NOW() - interval '1 minute';

    RAISE NOTICE '✓ PASS: Triggers execute without errors';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✗ FAIL: Trigger error: %', SQLERRM;
  END;
END $$;

\echo ''
\echo '===== Migration Tests Complete ====='
```

Run the test suite:

```bash
psql $DATABASE_URL -f scripts/test_attendance_migrations.sql
```

### Manual Testing Checklist

- [ ] **Materialized view query performance**
  ```sql
  EXPLAIN ANALYZE SELECT * FROM attendance_statistics_summary
  WHERE category_id = 'test' AND season_id = 'test';
  ```
  Expected: Index Scan, < 10ms

- [ ] **Member stats function accuracy**
  ```sql
  -- Compare function output with manual count
  SELECT COUNT(*) FROM member_attendance
  WHERE member_id = 'test-member-id'
    AND attendance_status = 'present';

  SELECT present_count FROM get_member_attendance_stats('cat-id', 'season-id')
  WHERE member_id = 'test-member-id';
  -- Should match
  ```

- [ ] **Trends function data integrity**
  ```sql
  SELECT * FROM get_attendance_trends('cat-id', 'season-id', 30)
  ORDER BY session_date DESC;
  -- Verify counts make sense
  ```

- [ ] **Trigger execution**
  - Insert test attendance record
  - Verify notification sent
  - Check materialized view updates (may have 1-2s lag)

- [ ] **Permissions**
  ```sql
  -- Test as authenticated user
  SET ROLE authenticated;
  SELECT * FROM attendance_statistics_summary LIMIT 1;
  SELECT * FROM get_member_attendance_stats('cat-id', 'season-id');
  -- Should work without errors
  RESET ROLE;
  ```

---

## Rollback Procedures

### Quick Rollback (< 1 minute)

If issues are detected immediately after migration:

```bash
# Run rollback script
psql $DATABASE_URL -f scripts/migrations/rollback_attendance_stats.sql
```

Create rollback script: `scripts/migrations/rollback_attendance_stats.sql`

```sql
-- =====================================================
-- Rollback: Attendance Statistics Optimization
-- =====================================================

BEGIN;

\echo 'Rolling back attendance statistics migrations...'

-- Drop triggers
DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_insert ON member_attendance CASCADE;
DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_update ON member_attendance CASCADE;
DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_delete ON member_attendance CASCADE;
DROP TRIGGER IF EXISTS refresh_att_stats_on_session_status ON training_sessions CASCADE;
DROP TRIGGER IF EXISTS refresh_att_stats_on_session_insert ON training_sessions CASCADE;
DROP TRIGGER IF EXISTS refresh_att_stats_on_session_delete ON training_sessions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS trigger_refresh_attendance_stats() CASCADE;
DROP FUNCTION IF EXISTS listen_for_attendance_stats_refresh() CASCADE;
DROP FUNCTION IF EXISTS scheduled_refresh_attendance_stats() CASCADE;
DROP FUNCTION IF EXISTS force_refresh_attendance_stats() CASCADE;
DROP FUNCTION IF EXISTS get_member_attendance_stats(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_attendance_trends(UUID, UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_training_session_stats(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS refresh_attendance_statistics_summary() CASCADE;

-- Drop views
DROP VIEW IF EXISTS attendance_stats_trigger_info CASCADE;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS attendance_statistics_summary CASCADE;

\echo 'Rollback complete. All attendance statistics objects removed.'

COMMIT;
```

### Full Database Restore

If data corruption occurs:

```bash
# Stop application (prevent new data changes)

# Restore from backup
psql $DATABASE_URL < backups/backup_TIMESTAMP.sql

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM training_sessions;"

# Restart application
```

### Partial Rollback

If only one component is problematic:

```sql
-- Example: Remove only triggers, keep functions
DROP TRIGGER IF EXISTS refresh_att_stats_on_attendance_insert ON member_attendance;
-- ... (drop other triggers)
DROP FUNCTION IF EXISTS trigger_refresh_attendance_stats() CASCADE;

-- Keep materialized view and functions working
```

---

## Performance Benchmarks

### Baseline Measurements

Before running migrations, capture baseline:

```sql
-- Save baseline query counts
\o baseline_performance.txt

\echo 'Baseline: Old Query Pattern'
\timing on

-- Simulate old N+1 pattern
WITH member_list AS (
  SELECT id FROM members WHERE category_id = 'test-cat-id' LIMIT 20
)
SELECT
  m.id,
  (SELECT COUNT(*) FROM member_attendance ma
   WHERE ma.member_id = m.id
     AND ma.attendance_status = 'present') as present_count
FROM member_list m;

\o
```

### Post-Migration Benchmarks

```sql
\o post_migration_performance.txt

\echo 'New Pattern: Single Aggregated Query'
\timing on

SELECT * FROM get_member_attendance_stats('test-cat-id', 'test-season-id');

\o
```

### Expected Results

| Metric | Baseline | Post-Migration | Target |
|--------|----------|----------------|--------|
| Query Count | 21 (1 + 20 members) | 1 | < 3 |
| Execution Time | 1000-2000ms | 50-100ms | < 200ms |
| Database Load | High (sequential) | Low (single query) | Minimal |
| Memory Usage | Variable | Consistent | Low |

---

## Troubleshooting

### Issue 1: Materialized View Creation Fails

**Symptom:**
```
ERROR: could not create unique index "idx_att_stats_summary_pk"
DETAIL: Key (category_id, season_id) is duplicated.
```

**Cause:** Duplicate category/season combinations in source data

**Solution:**
```sql
-- Check for duplicates
SELECT category_id, season_id, COUNT(*)
FROM training_sessions
WHERE category_id IS NOT NULL AND season_id IS NOT NULL
GROUP BY category_id, season_id
HAVING COUNT(*) > 1;

-- If found, ensure view handles them:
-- (Already handled in migration with GROUP BY)
```

### Issue 2: Function Returns No Data

**Symptom:** Functions execute but return 0 rows

**Cause:** No completed training sessions or attendance records

**Solution:**
```sql
-- Verify source data exists
SELECT status, COUNT(*)
FROM training_sessions
GROUP BY status;

SELECT COUNT(*) FROM member_attendance;

-- If no 'done' sessions:
UPDATE training_sessions
SET status = 'done'
WHERE id = 'some-past-session-id';
```

### Issue 3: Triggers Not Firing

**Symptom:** Materialized view doesn't refresh after data changes

**Cause:** Triggers not properly attached or notification system not configured

**Solution:**
```sql
-- Check triggers exist
SELECT * FROM attendance_stats_trigger_info;

-- Manually test trigger
INSERT INTO member_attendance (member_id, training_session_id, attendance_status)
VALUES ('test-id', 'test-id', 'present')
ON CONFLICT DO NOTHING;

-- Check if notification sent (in separate session)
LISTEN refresh_attendance_stats;

-- Force manual refresh
SELECT force_refresh_attendance_stats();
```

### Issue 4: Performance Not Improved

**Symptom:** Queries still slow after migration

**Cause:** Indexes not being used

**Solution:**
```sql
-- Check if indexes exist
SELECT * FROM pg_indexes
WHERE tablename IN (
  'attendance_statistics_summary',
  'member_attendance',
  'training_sessions',
  'members'
);

-- Force index usage
ANALYZE attendance_statistics_summary;
ANALYZE member_attendance;
ANALYZE training_sessions;

-- Check query plan
EXPLAIN ANALYZE
SELECT * FROM get_member_attendance_stats('cat-id', 'season-id');
-- Should show "Index Scan" not "Seq Scan"
```

### Issue 5: Permission Denied Errors

**Symptom:**
```
ERROR: permission denied for function get_member_attendance_stats
```

**Cause:** Insufficient permissions for authenticated users

**Solution:**
```sql
-- Re-grant permissions
GRANT EXECUTE ON FUNCTION get_member_attendance_stats(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_attendance_trends(UUID, UUID, INTEGER) TO authenticated;
GRANT SELECT ON attendance_statistics_summary TO authenticated;

-- Verify permissions
SELECT has_function_privilege('authenticated',
  'get_member_attendance_stats(uuid, uuid)', 'EXECUTE');
```

---

## Next Steps

After successful database migration:

1. **Deploy API Changes**
   - API endpoint already exists (`/api/attendance/statistics`)
   - Should work immediately after database migration

2. **Test API Endpoint**
   ```bash
   curl "http://localhost:3000/api/attendance/statistics?categoryId=test&seasonId=test"
   ```

3. **Implement UI Components**
   - SummaryCards
   - MemberPerformanceTable
   - AttendanceTrendsChart
   - InsightsPanel
   - RecommendationsPanel

4. **End-to-End Testing**
   - Load statistics tab
   - Verify data displays correctly
   - Test performance in production

5. **Monitoring**
   - Track API response times
   - Monitor materialized view refresh frequency
   - Watch for any errors

---

## Support & References

### Documentation
- Main optimization doc: [attendance-statistics-optimization.md](attendance-statistics-optimization.md)
- API endpoint: `/api/attendance/statistics/route.ts`
- React Query hook: `useFetchAttendanceStatistics.ts`

### Useful Queries

```sql
-- View refresh status
SELECT
  matviewname,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)),
  last_refresh
FROM pg_matviews
WHERE matviewname = 'attendance_statistics_summary';

-- Function execution stats
SELECT
  funcname,
  calls,
  total_time,
  mean_time
FROM pg_stat_user_functions
WHERE funcname LIKE '%attendance%';

-- Trigger activity
SELECT * FROM attendance_stats_trigger_info;
```

---

**Migration Status:** Ready for execution
**Estimated Time:** 10-15 minutes
**Risk Level:** Low (fully reversible)
**Next Review:** Post-deployment performance analysis