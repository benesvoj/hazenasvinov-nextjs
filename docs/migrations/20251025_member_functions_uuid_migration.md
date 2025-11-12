# Member Functions ID Migration: TEXT to UUID

**Date:** 2025-10-25
**Migration File:** `scripts/migrations/20251025_migrate_member_functions_to_uuid.sql`
**Status:** Ready to run

## Overview

This migration converts the `member_functions` table's `id` column from:
- **From:** `TEXT` with custom format `'func_'::text || substr(md5(random()::text), 1, 8)`
- **To:** `UUID` with standard PostgreSQL `gen_random_uuid()`

### Example ID Changes:
- **Old:** `func_a1b2c3d4` (8 character hex after prefix)
- **New:** `550e8400-e29b-41d4-a716-446655440000` (standard UUID v4)

## Why Migrate?

1. **Standardization:** UUID is industry-standard and better supported
2. **Type Safety:** Proper UUID column type instead of TEXT
3. **Collision Resistance:** Full UUID offers better uniqueness guarantees
4. **Consistency:** Aligns with other tables using UUID
5. **Better tooling:** UUIDs work better with ORMs and type systems

## Pre-Migration Checklist

- [x] ✅ **No Foreign Keys:** Verified no other tables reference `member_functions.id`
- [x] ✅ **Backup Created:** Migration includes automatic ID mapping backup
- [ ] ⚠️ **Data Review:** Check if there are existing records in production
- [ ] ⚠️ **App Code Review:** Ensure no hardcoded `func_` ID references in code

## Migration Process

### 1. Review Existing Data (Optional)

```sql
-- Check how many records exist
SELECT COUNT(*), MIN(created_at), MAX(created_at)
FROM member_functions;

-- View current IDs
SELECT id, name, display_name
FROM member_functions
ORDER BY created_at;
```

### 2. Run the Migration

**In Supabase SQL Editor:**

```sql
-- Copy and paste the entire content of:
-- scripts/migrations/20251025_migrate_member_functions_to_uuid.sql
```

The migration will:
1. ✅ Check for foreign key constraints (will error if found)
2. ✅ Create backup table with old_id → new_id mapping
3. ✅ Add temporary UUID column
4. ✅ Generate UUIDs for existing records
5. ✅ Backup all ID mappings
6. ✅ Replace old id column with new UUID column
7. ✅ Set proper primary key and default
8. ✅ Verify migration success

### 3. Verify Migration Success

After running the migration, you should see:

```
NOTICE:  No foreign key references found. Safe to proceed.
NOTICE:  Backed up N ID mappings
NOTICE:  === MIGRATION VERIFICATION ===
NOTICE:  Column type: uuid
NOTICE:  Default value: gen_random_uuid()
NOTICE:  Record count: N
NOTICE:  Backup mappings: N
NOTICE:  === MIGRATION SUCCESSFUL ===
```

### 4. Test the Application

```bash
# Regenerate TypeScript types from database
npm run generate:types  # or your type generation command

# Test creating a new member function
# The new ID should be a standard UUID format
```

### 5. Create Test Record

```sql
-- Insert a test record
INSERT INTO member_functions (name, display_name, sort_order, is_active)
VALUES ('test', 'Test Function', 999, true)
RETURNING *;

-- The id should be a standard UUID like:
-- 550e8400-e29b-41d4-a716-446655440000
```

## Rollback Instructions

If something goes wrong, you can rollback using the backup:

```sql
BEGIN;

-- Drop the UUID id column
ALTER TABLE member_functions DROP CONSTRAINT member_functions_pkey;
ALTER TABLE member_functions DROP COLUMN id;

-- Recreate TEXT id column
ALTER TABLE member_functions ADD COLUMN id TEXT;

-- Restore old IDs from backup
UPDATE member_functions mf
SET id = (SELECT old_id FROM member_functions_id_backup b WHERE b.new_id = mf.id);

-- Restore old default
ALTER TABLE member_functions
ALTER COLUMN id SET DEFAULT 'func_'::text || substr(md5(random()::text), 1, 8);

-- Restore primary key
ALTER TABLE member_functions ADD PRIMARY KEY (id);

COMMIT;
```

## Post-Migration Cleanup

After verifying everything works (wait at least 1 week in production):

```sql
-- Drop the backup table
DROP TABLE member_functions_id_backup;
```

## Impact Analysis

### TypeScript/Frontend
- ✅ **No changes needed:** `id` field is already typed as `string` in TypeScript
- ✅ **API unchanged:** REST endpoints still work the same way
- ✅ **UUID format:** IDs will now be standard UUID format instead of `func_` prefix

### Backend/API
- ✅ **No code changes needed:** Supabase handles UUID serialization automatically
- ✅ **Existing queries work:** UUID columns work with all existing queries

### Database
- ✅ **Better type safety:** Column is now proper UUID type
- ✅ **Standard default:** Uses PostgreSQL's built-in `gen_random_uuid()`
- ✅ **Performance:** UUID type has same or better performance than TEXT

## Testing Checklist

After migration, test these scenarios:

- [ ] Create new member function (via admin UI)
- [ ] Update existing member function
- [ ] Delete member function
- [ ] List all member functions
- [ ] Check that new IDs are proper UUIDs
- [ ] Verify no errors in application logs
- [ ] Check database constraints are intact

## Troubleshooting

### Error: "Found X foreign key references"
**Solution:** Update the migration to handle foreign keys first, or manually drop them before migration.

### Error: "Migration failed: id column is not UUID type"
**Solution:** Check the migration logs. One of the ALTER statements may have failed. Review and re-run.

### Old IDs Still Appear
**Solution:** Regenerate TypeScript types from database:
```bash
npm run generate:types
```

## Related Files

- Migration SQL: `scripts/migrations/20251025_migrate_member_functions_to_uuid.sql`
- API Routes: `src/app/api/member-functions/route.ts`
- TypeScript Types: `src/types/database/supabase.ts`
- Hook: `src/hooks/entities/member-function/state/useMemberFunctions.ts`

## Questions or Issues?

If you encounter any problems:
1. Check the backup table: `SELECT * FROM member_functions_id_backup;`
2. Review migration logs in Supabase
3. Use rollback instructions if needed
4. Contact the development team

---

**Migration prepared by:** Claude Code
**Migration reviewed by:** [Pending]
**Migration executed on:** [Pending]
**Executed by:** [Pending]