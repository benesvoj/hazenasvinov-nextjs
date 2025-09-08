-- Rollback script for category_id column from members table
-- This script removes the category_id column and related triggers

-- Step 1: Drop the trigger
DROP TRIGGER IF EXISTS trigger_update_member_category_id ON members;

-- Step 2: Drop the function
DROP FUNCTION IF EXISTS update_member_category_id();

-- Step 3: Drop the index
DROP INDEX IF EXISTS idx_members_category_id;

-- Step 4: Drop the category_id column
ALTER TABLE members DROP COLUMN IF EXISTS category_id;

-- Step 5: Remove comments
COMMENT ON COLUMN members.category IS 'Category code for the member';

-- Step 6: Verify the rollback
DO $$ 
DECLARE
    total_members INTEGER;
    members_with_category INTEGER;
BEGIN
    -- Count total members
    SELECT COUNT(*) INTO total_members FROM members;
    
    -- Count members with category
    SELECT COUNT(*) INTO members_with_category FROM members WHERE category IS NOT NULL;
    
    RAISE NOTICE '=== ROLLBACK COMPLETED ===';
    RAISE NOTICE 'Total members: %', total_members;
    RAISE NOTICE 'Members with category (legacy): %', members_with_category;
    RAISE NOTICE '=== CATEGORY_ID COLUMN REMOVED ===';
END $$;

-- Step 7: Show sample data for verification
SELECT 
    m.id,
    m.name,
    m.surname,
    m.category as legacy_category
FROM members m
ORDER BY m.surname, m.name
LIMIT 10;
