# Phase 1: Database Layer - Quick Reference

**Status:** Ready to Execute
**Estimated Time:** 15 minutes
**Risk:** Low (fully reversible)

---

## TL;DR - Quick Execution

```bash
# 1. Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations (in order)
psql $DATABASE_URL -f scripts/migrations/20251125_create_attendance_statistics_mv.sql
psql $DATABASE_URL -f scripts/migrations/20251125_create_attendance_functions.sql
psql $DATABASE_URL -f scripts/migrations/20251125_create_attendance_triggers.sql

# 3. Test
psql $DATABASE_URL -f scripts/test_attendance_migrations.sql

# 4. Test API
curl "http://localhost:3000/api/attendance/statistics?categoryId=YOUR_ID&seasonId=YOUR_ID"
```

---

## What Gets Created

### Materialized View
- **Name:** `attendance_statistics_summary`
- **Purpose:** Pre-computed session counts and completion rates
- **Updates:** Auto-refreshes on data changes
- **Size:** ~1KB per category/season

### PostgreSQL Functions
1. **`get_member_attendance_stats(category_id, season_id)`**
   - Returns: Member attendance stats (present, absent, late, excused counts)
   - Replaces: 21 queries → 1 query

2. **`get_attendance_trends(category_id, season_id, days)`**
   - Returns: Session-by-session attendance trends
   - Replaces: 31 queries → 1 query

3. **`get_training_session_stats(category_id, season_id)`**
   - Returns: High-level session statistics
   - Replaces: Multiple aggregation queries → 1 query

### Triggers
Auto-refresh on:
- Attendance records: INSERT, UPDATE, DELETE
- Training sessions: Status changes, INSERT, DELETE

---

## Files Created

```
scripts/migrations/
├── 20251125_create_attendance_statistics_mv.sql     (Materialized view)
├── 20251125_create_attendance_functions.sql         (Functions)
├── 20251125_create_attendance_triggers.sql          (Triggers)
└── rollback_attendance_stats.sql                    (Rollback)

scripts/
└── test_attendance_migrations.sql                   (Test suite)

docs/refactoring/
└── attendance-statistics-database-migration-guide.md (Full docs)
```

---

## Success Criteria

After migration, all of these should be ✓:

```sql
-- View exists and has data
SELECT COUNT(*) FROM attendance_statistics_summary;
-- Expected: > 0 rows

-- Functions work
SELECT * FROM get_member_attendance_stats('cat-id', 'season-id');
-- Expected: Returns member stats

-- Triggers exist
SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%att_stats%';
-- Expected: 6

-- Performance is good
EXPLAIN ANALYZE SELECT * FROM attendance_statistics_summary LIMIT 1;
-- Expected: < 10ms, Index Scan
```

---

## If Something Goes Wrong

```bash
# Quick rollback
psql $DATABASE_URL -f scripts/migrations/rollback_attendance_stats.sql

# Full restore from backup
psql $DATABASE_URL < backup_TIMESTAMP.sql
```

---

## Testing Checklist

- [ ] Backup created
- [ ] Migration 1 executed (materialized view)
- [ ] Migration 2 executed (functions)
- [ ] Migration 3 executed (triggers)
- [ ] Test suite passes
- [ ] API endpoint returns data
- [ ] Performance improved (< 200ms responses)

---

## Next Steps After This Phase

1. **UI Components** (Phase 3) - Implement:
   - SummaryCards
   - MemberPerformanceTable
   - AttendanceTrendsChart
   - InsightsPanel
   - RecommendationsPanel

2. **Integration Testing** - Verify:
   - Statistics tab loads correctly
   - Data displays properly
   - Performance meets targets

3. **Production Deployment** - Deploy:
   - Run migrations on production
   - Monitor performance
   - Validate data accuracy

---

## Key SQL Commands

```sql
-- Manual refresh
SELECT force_refresh_attendance_stats();

-- Check last refresh
SELECT MAX(last_refreshed) FROM attendance_statistics_summary;

-- Test performance
EXPLAIN ANALYZE
SELECT * FROM get_member_attendance_stats('cat-id', 'season-id');

-- View trigger status
SELECT * FROM attendance_stats_trigger_info;

-- Monitor function calls
SELECT funcname, calls, mean_time
FROM pg_stat_user_functions
WHERE funcname LIKE '%attendance%';
```

---

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Query count | ≤ 3 | ___ |
| Response time | < 200ms | ___ |
| View refresh | < 2s | ___ |
| API endpoint | < 500ms | ___ |

---

## Common Issues

**Issue:** Function returns empty
**Fix:** Check if you have 'done' status sessions
```sql
SELECT status, COUNT(*) FROM training_sessions GROUP BY status;
```

**Issue:** Permission denied
**Fix:** Re-grant permissions
```sql
GRANT SELECT ON attendance_statistics_summary TO authenticated;
```

**Issue:** Triggers not firing
**Fix:** Verify triggers exist
```sql
SELECT * FROM attendance_stats_trigger_info;
```

---

## Support

- **Full Documentation:** `docs/refactoring/attendance-statistics-database-migration-guide.md`
- **Optimization Plan:** `docs/refactoring/attendance-statistics-optimization.md`
- **Test Suite:** `scripts/test_attendance_migrations.sql`

---

**Ready to proceed?** Run the commands in the TL;DR section above.
