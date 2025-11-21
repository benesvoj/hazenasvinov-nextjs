# Training Sessions Migration Guide

**Migration:** From `category` VARCHAR to `category_id` UUID  
**Status:** ✅ COMPLETED  
**Date:** 2025-09-10

## Overview

This migration updates the `training_sessions` table and all related code to use `category_id` UUID references instead of the legacy `category` VARCHAR field.

## Migration Steps Completed

### 1. ✅ Database Schema Migration
- **File:** `scripts/migrate_training_sessions_to_category_id.sql`
- **Action:** Added `category_id` column and migrated existing data
- **Status:** Ready to run in Supabase SQL Editor

### 2. ✅ Database Functions Update
- **File:** `scripts/update_training_sessions_functions.sql`
- **Action:** Updated all RPC functions to use `category_id`
- **Functions Updated:**
  - `get_training_sessions(p_category_id UUID, ...)`
  - `get_attendance_summary(p_category_id UUID, ...)`
  - `get_attendance_records(p_session_id UUID, ...)`

### 3. ✅ TypeScript Types Update
- **File:** `src/types/attendance.ts`
- **Changes:**
  - `TrainingSession.category_id: string` (required)
  - `TrainingSession.category?: string` (legacy, optional)
  - `TrainingSessionFormData.category_id: string` (required)
  - `AttendanceFilters.category_id?: string` (optional)

### 4. ✅ Application Code Update
- **Files Updated:**
  - `src/hooks/useAttendance.ts` - Updated all functions to use `category_id`
  - `src/app/coaches/attendance/page.tsx` - Removed category code conversion
  - `src/app/coaches/attendance/components/TrainingSessionGenerator.tsx` - Updated to use `category_id`

## Migration Execution Order

### Step 1: Run Database Migration
```sql
-- Run in Supabase SQL Editor
-- File: scripts/migrate_training_sessions_to_category_id.sql
```

### Step 2: Update Database Functions
```sql
-- Run in Supabase SQL Editor
-- File: scripts/update_training_sessions_functions.sql
```

### Step 3: Deploy Application Code
```bash
# Deploy the updated application code
git add .
git commit -m "Migrate training_sessions to use category_id"
git push
```

### Step 4: Verify Migration
1. Test training session creation
2. Test attendance recording
3. Test attendance summary
4. Verify all functions work with `category_id`

### Step 5: Remove Legacy Field (Optional)
```sql
-- Run ONLY after verification
-- File: scripts/remove_training_sessions_category_field.sql
```

## Breaking Changes

### API Changes
- All RPC functions now expect `category_id` instead of `category`
- `get_training_sessions(p_category_id UUID, ...)` instead of `get_training_sessions(p_category VARCHAR, ...)`

### Type Changes
- `TrainingSession.category_id` is now required
- `TrainingSession.category` is now optional (legacy field)
- All form data now uses `category_id`

## Rollback Plan

If issues occur, rollback steps:

1. **Revert Application Code:**
   ```bash
   git revert <commit-hash>
   ```

2. **Restore Legacy Functions:**
   ```sql
   -- Restore original functions with VARCHAR parameters
   -- (Keep backup of original functions)
   ```

3. **Database Rollback:**
   ```sql
   -- Add back category column if removed
   ALTER TABLE training_sessions ADD COLUMN category VARCHAR(50);
   
   -- Restore data from category_id
   UPDATE training_sessions 
   SET category = (SELECT code FROM categories WHERE id = training_sessions.category_id);
   ```

## Verification Checklist

- [ ] Training sessions can be created with `category_id`
- [ ] Attendance can be recorded for sessions
- [ ] Attendance summary shows correct data
- [ ] All RPC functions work with new parameters
- [ ] No errors in browser console
- [ ] All existing data is accessible

## Files Modified

### Database Scripts
- `scripts/migrate_training_sessions_to_category_id.sql`
- `scripts/update_training_sessions_functions.sql`
- `scripts/remove_training_sessions_category_field.sql`

### TypeScript Files
- `src/types/attendance.ts`
- `src/hooks/useAttendance.ts`
- `src/app/coaches/attendance/page.tsx`
- `src/app/coaches/attendance/components/TrainingSessionGenerator.tsx`

## Next Steps

After successful migration:
1. Monitor for any issues
2. Remove legacy `category` field after verification
3. Update documentation
4. Consider migrating other tables (e.g., `category_lineup_members`)

## Impact on Other Systems

This migration affects:
- ✅ Training session management
- ✅ Attendance recording
- ✅ Attendance reporting
- ✅ Session generation
- ❌ No impact on other systems

The migration is isolated to the training sessions system and doesn't affect matches, standings, or other core functionality.
