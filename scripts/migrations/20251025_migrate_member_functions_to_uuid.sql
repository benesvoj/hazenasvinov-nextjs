-- =====================================================
-- MIGRATION: Convert member_functions.id from TEXT to UUID
-- Date: 2025-10-25
-- =====================================================
-- This migration converts the member_functions table's id column
-- from TEXT (with custom 'func_' prefix format) to standard UUID
-- =====================================================

-- STEP 1: Check if there are any foreign key references
-- =====================================================
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%member_function%';

  IF fk_count > 0 THEN
    RAISE EXCEPTION 'Found % foreign key references to member_functions. Please handle them first.', fk_count;
  END IF;

  RAISE NOTICE 'No foreign key references found. Safe to proceed.';
END $$;

-- STEP 2: Create backup table for rollback purposes
-- =====================================================
CREATE TABLE IF NOT EXISTS member_functions_id_backup (
  old_id TEXT PRIMARY KEY,
  new_id UUID NOT NULL,
  migrated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Add temporary UUID column
-- =====================================================
ALTER TABLE member_functions
ADD COLUMN IF NOT EXISTS new_id UUID DEFAULT gen_random_uuid();

-- STEP 4: Generate UUIDs for existing records and backup the mapping
-- =====================================================
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, new_id FROM member_functions
  LOOP
    INSERT INTO member_functions_id_backup (old_id, new_id)
    VALUES (rec.id, rec.new_id)
    ON CONFLICT (old_id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Backed up % ID mappings', (SELECT COUNT(*) FROM member_functions_id_backup);
END $$;

-- STEP 5: Drop the old id column and rename new_id to id
-- =====================================================
-- Drop the old primary key constraint
ALTER TABLE member_functions DROP CONSTRAINT IF EXISTS member_functions_pkey;

-- Drop the old id column
ALTER TABLE member_functions DROP COLUMN id;

-- Rename new_id to id
ALTER TABLE member_functions RENAME COLUMN new_id TO id;

-- STEP 6: Set the new id column as primary key with proper default
-- =====================================================
ALTER TABLE member_functions
ALTER COLUMN id SET DEFAULT gen_random_uuid(),
ALTER COLUMN id SET NOT NULL;

ALTER TABLE member_functions
ADD PRIMARY KEY (id);

-- STEP 7: Verify the migration
-- =====================================================
DO $$
DECLARE
  id_type TEXT;
  default_value TEXT;
  record_count INTEGER;
BEGIN
  -- Check column type
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_name = 'member_functions'
    AND column_name = 'id';

  -- Check default value
  SELECT column_default INTO default_value
  FROM information_schema.columns
  WHERE table_name = 'member_functions'
    AND column_name = 'id';

  -- Count records
  SELECT COUNT(*) INTO record_count FROM member_functions;

  RAISE NOTICE '=== MIGRATION VERIFICATION ===';
  RAISE NOTICE 'Column type: %', id_type;
  RAISE NOTICE 'Default value: %', default_value;
  RAISE NOTICE 'Record count: %', record_count;
  RAISE NOTICE 'Backup mappings: %', (SELECT COUNT(*) FROM member_functions_id_backup);

  IF id_type != 'uuid' THEN
    RAISE EXCEPTION 'Migration failed: id column is not UUID type';
  END IF;

  IF default_value NOT LIKE '%gen_random_uuid%' THEN
    RAISE EXCEPTION 'Migration failed: default is not gen_random_uuid()';
  END IF;

  RAISE NOTICE '=== MIGRATION SUCCESSFUL ===';
END $$;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================
-- If you need to rollback this migration, run:
--
-- BEGIN;
-- ALTER TABLE member_functions DROP CONSTRAINT member_functions_pkey;
-- ALTER TABLE member_functions DROP COLUMN id;
-- ALTER TABLE member_functions ADD COLUMN id TEXT;
-- UPDATE member_functions mf
-- SET id = (SELECT old_id FROM member_functions_id_backup b WHERE b.new_id = mf.id);
-- ALTER TABLE member_functions ALTER COLUMN id SET DEFAULT 'func_'::text || substr(md5(random()::text), 1, 8);
-- ALTER TABLE member_functions ADD PRIMARY KEY (id);
-- COMMIT;
--
-- After successful verification, you can drop the backup table:
-- DROP TABLE member_functions_id_backup;
-- =====================================================