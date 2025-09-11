-- Migrate category_lineup_members table from category VARCHAR to category_id UUID
-- This script completes the migration for the category_lineup_members table

-- Step 1: Add category_id column if it doesn't exist
ALTER TABLE category_lineup_members 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_category_lineup_members_category_id ON category_lineup_members(category_id);

-- Step 3: Migrate data from category to category_id
UPDATE category_lineup_members 
SET category_id = c.id 
FROM categories c 
WHERE category_lineup_members.category = c.code 
AND category_lineup_members.category_id IS NULL;

-- Step 4: Verify migration
DO $$ 
DECLARE
    total_members INTEGER;
    members_with_category_id INTEGER;
    members_missing_category_id INTEGER;
    orphaned_members INTEGER;
BEGIN
    -- Count total lineup members
    SELECT COUNT(*) INTO total_members FROM category_lineup_members;
    
    -- Count members with category_id
    SELECT COUNT(*) INTO members_with_category_id 
    FROM category_lineup_members 
    WHERE category_id IS NOT NULL;
    
    -- Count members missing category_id
    SELECT COUNT(*) INTO members_missing_category_id 
    FROM category_lineup_members 
    WHERE category_id IS NULL;
    
    -- Count orphaned members (category_id doesn't match any category)
    SELECT COUNT(*) INTO orphaned_members
    FROM category_lineup_members clm
    LEFT JOIN categories c ON clm.category_id = c.id
    WHERE clm.category_id IS NOT NULL AND c.id IS NULL;
    
    -- Report the status
    RAISE NOTICE '=== CATEGORY_LINEUP_MEMBERS MIGRATION STATUS ===';
    RAISE NOTICE 'Total lineup members: %', total_members;
    RAISE NOTICE 'Members with category_id: %', members_with_category_id;
    RAISE NOTICE 'Members missing category_id: %', members_missing_category_id;
    RAISE NOTICE 'Orphaned members: %', orphaned_members;
    
    -- Check if migration is complete
    IF members_missing_category_id > 0 THEN
        RAISE WARNING 'Migration incomplete! % members still missing category_id.', members_missing_category_id;
        
        -- Show which members are missing category_id
        RAISE NOTICE 'Members missing category_id:';
        FOR rec IN 
            SELECT id, lineup_id, member_id, category, category_id 
            FROM category_lineup_members 
            WHERE category_id IS NULL 
            LIMIT 10
        LOOP
            RAISE NOTICE '  ID: %, Lineup: %, Member: %, Category: %, Category_ID: %', 
                rec.id, rec.lineup_id, rec.member_id, rec.category, rec.category_id;
        END LOOP;
    END IF;
    
    IF orphaned_members > 0 THEN
        RAISE WARNING 'Found % orphaned members with invalid category_id!', orphaned_members;
    END IF;
    
    IF members_missing_category_id = 0 AND orphaned_members = 0 THEN
        RAISE NOTICE 'Migration verification passed! All lineup members have valid category_id.';
    END IF;
END $$;

-- Step 5: Show sample of migrated data
SELECT 
    'Sample migrated data' as info,
    clm.id,
    clm.lineup_id,
    clm.member_id,
    clm.category as old_category,
    clm.category_id,
    c.name as category_name,
    c.code as category_code
FROM category_lineup_members clm
LEFT JOIN categories c ON clm.category_id = c.id
ORDER BY clm.added_at DESC
LIMIT 5;

-- Step 6: Add comment to document the migration
COMMENT ON COLUMN category_lineup_members.category_id IS 'Category UUID reference - migrated from category VARCHAR field';

-- Step 7: Final verification query
SELECT 
    'Final verification' as step,
    COUNT(*) as total_members,
    COUNT(category_id) as members_with_category_id,
    COUNT(*) - COUNT(category_id) as members_missing_category_id
FROM category_lineup_members;
