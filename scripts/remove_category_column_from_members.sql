-- Remove the legacy 'category' column from members table
-- This script safely removes the old category column after migration to category_id

-- Step 1: Verify that all members have category_id populated
DO $$ 
DECLARE
    total_members INTEGER;
    members_with_category_id INTEGER;
    members_without_category_id INTEGER;
BEGIN
    -- Count total members
    SELECT COUNT(*) INTO total_members FROM members;
    
    -- Count members with category_id
    SELECT COUNT(*) INTO members_with_category_id 
    FROM members 
    WHERE category_id IS NOT NULL;
    
    -- Count members without category_id
    SELECT COUNT(*) INTO members_without_category_id 
    FROM members 
    WHERE category_id IS NULL;
    
    -- Report the status
    RAISE NOTICE 'Migration Status:';
    RAISE NOTICE 'Total members: %', total_members;
    RAISE NOTICE 'Members with category_id: %', members_with_category_id;
    RAISE NOTICE 'Members without category_id: %', members_without_category_id;
    
    -- Check if migration is complete
    IF members_without_category_id > 0 THEN
        RAISE EXCEPTION 'Migration not complete! % members still missing category_id. Please complete the migration first.', members_without_category_id;
    END IF;
    
    RAISE NOTICE 'Migration verification passed. Safe to remove category column.';
END $$;

-- Step 2: Create backup of the category column data (just in case)
CREATE TABLE IF NOT EXISTS members_category_backup AS 
SELECT id, category, created_at 
FROM members 
WHERE category IS NOT NULL;

-- Step 3: Drop the trigger that was updating category_id from category
DROP TRIGGER IF EXISTS trigger_update_member_category_id ON members;
DROP FUNCTION IF EXISTS update_member_category_id();

-- Step 4: Drop the check constraint on the category column
ALTER TABLE members DROP CONSTRAINT IF EXISTS check_valid_category;

-- Step 5: Drop the index on the category column
DROP INDEX IF EXISTS idx_members_category;

-- Step 6: Remove the category column
ALTER TABLE members DROP COLUMN IF EXISTS category;

-- Step 7: Verify the column has been removed
DO $$ 
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'members' 
        AND column_name = 'category'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE EXCEPTION 'Failed to remove category column!';
    ELSE
        RAISE NOTICE 'Successfully removed category column from members table.';
    END IF;
END $$;

-- Step 8: Final verification - show current members table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;

-- Step 9: Show summary
DO $$ 
DECLARE
    total_members INTEGER;
    members_with_category_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_members FROM members;
    SELECT COUNT(*) INTO members_with_category_id FROM members WHERE category_id IS NOT NULL;
    
    RAISE NOTICE 'Final Status:';
    RAISE NOTICE 'Total members: %', total_members;
    RAISE NOTICE 'Members with category_id: %', members_with_category_id;
    RAISE NOTICE 'Legacy category column successfully removed!';
END $$;
