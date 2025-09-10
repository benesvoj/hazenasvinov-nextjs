-- Restore the legacy 'category' column to members table
-- This script restores the category column from the backup data

-- Step 1: Add the category column back
ALTER TABLE members 
ADD COLUMN category VARCHAR(50);

-- Step 2: Restore data from backup
UPDATE members 
SET category = backup.category 
FROM members_category_backup backup 
WHERE members.id = backup.id;

-- Step 3: Make the category column NOT NULL
ALTER TABLE members ALTER COLUMN category SET NOT NULL;

-- Step 4: Add the check constraint back
ALTER TABLE members ADD CONSTRAINT check_valid_category 
CHECK (category IN ('men', 'women', 'juniorBoys', 'juniorGirls', 'prepKids', 'youngestKids', 'youngerBoys', 'youngerGirls', 'olderBoys', 'olderGirls'));

-- Step 5: Create index on the category column
CREATE INDEX idx_members_category ON members(category);

-- Step 6: Recreate the trigger function
CREATE OR REPLACE FUNCTION update_member_category_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If category is updated, automatically set category_id
    IF NEW.category IS DISTINCT FROM OLD.category THEN
        SELECT id INTO NEW.category_id 
        FROM categories 
        WHERE code = NEW.category 
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Recreate the trigger
CREATE TRIGGER trigger_update_member_category_id
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_member_category_id();

-- Step 8: Verify the restoration
DO $$ 
DECLARE
    total_members INTEGER;
    members_with_category INTEGER;
    members_with_category_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_members FROM members;
    SELECT COUNT(*) INTO members_with_category FROM members WHERE category IS NOT NULL;
    SELECT COUNT(*) INTO members_with_category_id FROM members WHERE category_id IS NOT NULL;
    
    RAISE NOTICE 'Restoration Status:';
    RAISE NOTICE 'Total members: %', total_members;
    RAISE NOTICE 'Members with category: %', members_with_category;
    RAISE NOTICE 'Members with category_id: %', members_with_category_id;
    RAISE NOTICE 'Category column successfully restored!';
END $$;

-- Step 9: Show current members table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;
