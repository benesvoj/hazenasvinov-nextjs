-- Add category_id column to members table
-- This script adds category_id while keeping the legacy category column for backward compatibility

-- Step 1: Add category_id column to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_members_category_id ON members(category_id);

-- Step 3: Populate category_id based on existing category codes
-- This maps the string category codes to their corresponding category IDs
UPDATE members 
SET category_id = c.id 
FROM categories c 
WHERE members.category = c.code 
AND members.category_id IS NULL;

-- Step 4: Add comment to document the new column
COMMENT ON COLUMN members.category_id IS 'Foreign key reference to categories table - new approach for category filtering';
COMMENT ON COLUMN members.category IS 'Legacy category code column - kept for backward compatibility';

-- Step 5: Create a function to automatically populate category_id when category is updated
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

-- Step 6: Create trigger to automatically update category_id when category changes
DROP TRIGGER IF EXISTS trigger_update_member_category_id ON members;
CREATE TRIGGER trigger_update_member_category_id
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_member_category_id();

-- Step 7: Verify the migration
DO $$ 
DECLARE
    total_members INTEGER;
    members_with_category_id INTEGER;
    members_with_category INTEGER;
BEGIN
    -- Count total members
    SELECT COUNT(*) INTO total_members FROM members;
    
    -- Count members with category_id
    SELECT COUNT(*) INTO members_with_category_id FROM members WHERE category_id IS NOT NULL;
    
    -- Count members with category
    SELECT COUNT(*) INTO members_with_category FROM members WHERE category IS NOT NULL;
    
    RAISE NOTICE '=== MIGRATION COMPLETED ===';
    RAISE NOTICE 'Total members: %', total_members;
    RAISE NOTICE 'Members with category_id: %', members_with_category_id;
    RAISE NOTICE 'Members with category (legacy): %', members_with_category;
    RAISE NOTICE 'Migration success rate: %', ROUND((members_with_category_id::DECIMAL / total_members * 100), 2) || '%';
    RAISE NOTICE '=== CATEGORY_ID COLUMN ADDED SUCCESSFULLY ===';
END $$;

-- Step 8: Show sample data for verification
SELECT 
    m.id,
    m.name,
    m.surname,
    m.category as legacy_category,
    m.category_id,
    c.code as category_code_from_id,
    c.name as category_name
FROM members m
LEFT JOIN categories c ON m.category_id = c.id
ORDER BY m.surname, m.name
LIMIT 10;
