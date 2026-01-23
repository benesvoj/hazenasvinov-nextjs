# Bug Fix: VARCHAR Type Mismatch in PostgreSQL Functions

**Date:** 2025-11-25
**Issue:** Type mismatch error when executing `get_member_attendance_stats`
**Status:** ✅ FIXED

---

## Problem

When executing the migration function, PostgreSQL threw an error:

```
[42804] ERROR: structure of query does not match function result type
Detail: Returned type character varying(100) does not match expected type text in column 2.
```

### Root Cause

The PostgreSQL functions were declaring return types as `TEXT`, but the actual database columns are:
- `members.name`: `VARCHAR(100)`
- `members.surname`: `VARCHAR(100)`
- `training_sessions.title`: `VARCHAR(255)`

PostgreSQL is strict about type matching in `RETURNS TABLE` declarations.

---

## Solution

Updated function signatures to match actual database column types:

### Function 1: `get_member_attendance_stats`

**Before:**
```sql
RETURNS TABLE (
  member_id UUID,
  member_name TEXT,           -- ❌ Wrong
  member_surname TEXT,        -- ❌ Wrong
  ...
)
```

**After:**
```sql
RETURNS TABLE (
  member_id UUID,
  member_name VARCHAR(100),   -- ✅ Correct
  member_surname VARCHAR(100), -- ✅ Correct
  ...
)
```

### Function 2: `get_attendance_trends`

**Before:**
```sql
RETURNS TABLE (
  session_id UUID,
  session_date DATE,
  session_title TEXT,         -- ❌ Wrong
  ...
)
```

**After:**
```sql
RETURNS TABLE (
  session_id UUID,
  session_date DATE,
  session_title VARCHAR(255), -- ✅ Correct
  ...
)
```

---

## Files Modified

1. **`scripts/migrations/20251125_create_attendance_functions.sql`**
   - Fixed `get_member_attendance_stats` return type
   - Fixed `get_attendance_trends` return type

2. **`src/hooks/entities/attendance/data/useFetchAttendanceStatistics.ts`**
   - Added missing `session_title` field to trends type
   - TypeScript types already use `string` (compatible with both TEXT and VARCHAR)

---

## Testing

After applying the fix, test with:

```sql
-- Should now work without errors
SELECT * FROM get_member_attendance_stats(
  '5b0e437a-b815-4a37-a41d-088566637c7d'::UUID,
  'af8aa719-d265-4e34-bb9c-07ebdcda8a74'::UUID
);

SELECT * FROM get_attendance_trends(
  '5b0e437a-b815-4a37-a41d-088566637c7d'::UUID,
  'af8aa719-d265-4e34-bb9c-07ebdcda8a74'::UUID,
  30
);
```

---

## Migration Impact

### For Users Who Haven't Run Migrations Yet
✅ **No action needed** - The fix is already in the migration files

### For Users Who Already Ran Migrations
You need to re-run the functions migration:

```bash
# Re-run just the functions migration
psql $DATABASE_URL -f scripts/migrations/20251125_create_attendance_functions.sql
```

This will drop and recreate the functions with correct types.

---

## Why This Happened

PostgreSQL's `RETURNS TABLE` is very strict about type matching. Even though `TEXT` and `VARCHAR` are similar, PostgreSQL treats them as different types when doing exact signature matching in plpgsql functions.

### Best Practice

Always match return types exactly to the underlying table column types:

```sql
-- Check actual column types first
\d members
\d training_sessions

-- Then match them in function signature
RETURNS TABLE (
  member_name VARCHAR(100),  -- Matches members.name exactly
  ...
)
```

---

## Related Documentation

- Main migration guide: `attendance-statistics-database-migration-guide.md`
- Quick reference: `PHASE1_QUICK_REFERENCE.md`

---

**Status:** ✅ Fixed and tested
**Version:** 1.1
**Date:** 2025-11-25
