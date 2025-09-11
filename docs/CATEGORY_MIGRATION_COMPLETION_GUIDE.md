# Category Migration Completion Guide

## Current Status: ⚠️ PARTIAL MIGRATION

The migration from legacy `category` VARCHAR fields to modern `category_id` UUID fields is **partially complete**. This guide outlines the remaining steps to safely complete the migration and drop the old category columns.

## Migration Status Overview

### ✅ **COMPLETED MIGRATIONS:**
- **`members`** - ✅ Fully migrated to `category_id`
- **`matches`** - ✅ Fully migrated to `category_id`
- **`blog_posts`** - ✅ Fully migrated to `category_id`
- **`standings`** - ✅ Fully migrated to `category_id`
- **`category_lineups`** - ✅ Fully migrated to `category_id`
- **`club_categories`** - ✅ Fully migrated to `category_id`
- **`club_teams`** - ✅ Fully migrated to `category_id`
- **Application Code** - ✅ All TypeScript code uses `category_id`

### ❌ **REMAINING MIGRATIONS:**
- **`training_sessions`** - ❌ Still has `category` VARCHAR field
- **`category_lineup_members`** - ❌ Still has `category` VARCHAR field
- **Database Functions** - ❌ RPC functions still expect VARCHAR category codes

## Step-by-Step Migration Plan

### Phase 1: Complete Database Table Migration

#### 1.1 Migrate `training_sessions` Table
**File:** `scripts/migrate_training_sessions_to_category_id.sql`

```sql
-- Step 1: Add category_id column
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Step 2: Migrate data from category to category_id
UPDATE training_sessions 
SET category_id = c.id 
FROM categories c 
WHERE training_sessions.category = c.code 
AND training_sessions.category_id IS NULL;

-- Step 3: Make category_id NOT NULL
ALTER TABLE training_sessions ALTER COLUMN category_id SET NOT NULL;

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_category_id ON training_sessions(category_id);
```

#### 1.2 Migrate `category_lineup_members` Table
**File:** `scripts/migrate_category_lineup_members_to_category_id.sql`

```sql
-- Step 1: Add category_id column
ALTER TABLE category_lineup_members 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Step 2: Migrate data from category to category_id
UPDATE category_lineup_members 
SET category_id = c.id 
FROM categories c 
WHERE category_lineup_members.category = c.code 
AND category_lineup_members.category_id IS NULL;

-- Step 3: Make category_id NOT NULL
ALTER TABLE category_lineup_members ALTER COLUMN category_id SET NOT NULL;

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_category_lineup_members_category_id ON category_lineup_members(category_id);
```

### Phase 2: Update Database Functions

#### 2.1 Update RPC Functions
**File:** `scripts/update_database_functions_to_category_id.sql`

```sql
-- Update get_training_sessions function
CREATE OR REPLACE FUNCTION get_training_sessions(
    p_category_id UUID,
    p_season_id UUID,
    p_user_id UUID
) RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    session_date DATE,
    session_time TIME,
    category_id UUID,
    season_id UUID,
    coach_id UUID,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id,
        ts.title,
        ts.description,
        ts.session_date,
        ts.session_time,
        ts.category_id,
        ts.season_id,
        ts.coach_id,
        ts.location,
        ts.created_at,
        ts.updated_at
    FROM training_sessions ts
    WHERE ts.category_id = p_category_id
    AND ts.season_id = p_season_id
    ORDER BY ts.session_date DESC, ts.session_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Update other RPC functions similarly...
```

### Phase 3: Verification and Testing

#### 3.1 Verify Data Migration
**File:** `scripts/verify_category_migration.sql`

```sql
-- Verify training_sessions migration
SELECT 
    'training_sessions' as table_name,
    COUNT(*) as total_records,
    COUNT(category_id) as records_with_category_id,
    COUNT(*) - COUNT(category_id) as records_missing_category_id
FROM training_sessions;

-- Verify category_lineup_members migration
SELECT 
    'category_lineup_members' as table_name,
    COUNT(*) as total_records,
    COUNT(category_id) as records_with_category_id,
    COUNT(*) - COUNT(category_id) as records_missing_category_id
FROM category_lineup_members;

-- Check for any orphaned records
SELECT 'Orphaned training_sessions' as issue, COUNT(*) as count
FROM training_sessions ts
LEFT JOIN categories c ON ts.category_id = c.id
WHERE c.id IS NULL;

SELECT 'Orphaned category_lineup_members' as issue, COUNT(*) as count
FROM category_lineup_members clm
LEFT JOIN categories c ON clm.category_id = c.id
WHERE c.id IS NULL;
```

#### 3.2 Test Application Functionality
**Files to Test:**
- `src/app/coaches/attendance/page.tsx` - Training session creation/editing
- `src/app/coaches/attendance/components/TrainingSessionGenerator.tsx` - Bulk session creation
- `src/hooks/useAttendance.ts` - All attendance functions
- `src/hooks/useCategoryLineups.ts` - Lineup management
- `src/app/coaches/lineups/page.tsx` - Lineup interface

### Phase 4: Remove Legacy Columns

#### 4.1 Remove Legacy Columns (ONLY AFTER VERIFICATION)
**File:** `scripts/remove_legacy_category_columns.sql`

```sql
-- Step 1: Remove training_sessions.category column
ALTER TABLE training_sessions DROP COLUMN IF EXISTS category;
ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS check_valid_category;

-- Step 2: Remove category_lineup_members.category column
ALTER TABLE category_lineup_members DROP COLUMN IF EXISTS category;
ALTER TABLE category_lineup_members DROP CONSTRAINT IF EXISTS check_valid_category;

-- Step 3: Remove categories.code column (if no longer needed)
-- ALTER TABLE categories DROP COLUMN IF EXISTS code;

-- Step 4: Update comments
COMMENT ON COLUMN training_sessions.category_id IS 'Category UUID reference - migration completed';
COMMENT ON COLUMN category_lineup_members.category_id IS 'Category UUID reference - migration completed';
```

## Critical Files to Update

### Database Scripts
1. **`scripts/migrate_training_sessions_to_category_id.sql`** - Migrate training_sessions table
2. **`scripts/migrate_category_lineup_members_to_category_id.sql`** - Migrate category_lineup_members table
3. **`scripts/update_database_functions_to_category_id.sql`** - Update all RPC functions
4. **`scripts/verify_category_migration.sql`** - Verification queries
5. **`scripts/remove_legacy_category_columns.sql`** - Final cleanup

### Application Code (Already Complete)
- ✅ All TypeScript interfaces use `category_id`
- ✅ All database queries use `category_id`
- ✅ All UI components use `category_id`

## Safety Checklist

### Before Starting Migration:
- [ ] **Backup Database** - Create full database backup
- [ ] **Test Environment** - Run migration on test environment first
- [ ] **Verify Current State** - Run verification queries to understand current data

### During Migration:
- [ ] **Run Migration Scripts** - Execute in correct order
- [ ] **Verify Data Integrity** - Check for orphaned records
- [ ] **Test Application** - Ensure all functionality works

### After Migration:
- [ ] **Monitor Application** - Watch for any errors
- [ ] **Performance Check** - Ensure queries are still fast
- [ ] **User Acceptance** - Test with real users

## Rollback Plan

If issues occur, rollback scripts are available:
- `scripts/rollback_category_id_from_members.sql`
- `scripts/restore_category_column_to_members.sql`

## Estimated Timeline

- **Phase 1 (Database Migration):** 2-3 hours
- **Phase 2 (Function Updates):** 1-2 hours  
- **Phase 3 (Testing):** 4-6 hours
- **Phase 4 (Cleanup):** 30 minutes

**Total Estimated Time:** 1-2 days

## Success Criteria

✅ **Migration Complete When:**
- All tables use `category_id` instead of `category`
- All RPC functions use `category_id` parameters
- Application functionality works without errors
- No orphaned records in database
- Performance is maintained or improved

## Next Steps

1. **Review this guide** with the development team
2. **Create database backup** before starting
3. **Execute Phase 1** - Database table migration
4. **Execute Phase 2** - Update database functions
5. **Execute Phase 3** - Comprehensive testing
6. **Execute Phase 4** - Remove legacy columns
7. **Update documentation** to reflect completed migration

---

**⚠️ IMPORTANT:** Do not remove the `categories.code` column until all legacy references are eliminated and the migration is fully tested in production.
