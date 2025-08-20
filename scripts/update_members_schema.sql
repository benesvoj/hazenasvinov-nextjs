-- Update members table schema to use string categories instead of UUID references
-- This simplifies the structure and fixes the update error

-- First, backup the existing data
CREATE TABLE members_backup AS SELECT * FROM members;

-- Drop the existing foreign key constraint
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_category_id_fkey;

-- Add the new category column as string
ALTER TABLE members ADD COLUMN category VARCHAR(50);

-- Update the category column with the code from the categories table
UPDATE members 
SET category = c.code 
FROM categories c 
WHERE members.category_id = c.id;

-- Make the category column NOT NULL
ALTER TABLE members ALTER COLUMN category SET NOT NULL;

-- Add a check constraint to ensure valid category values
ALTER TABLE members ADD CONSTRAINT check_valid_category 
CHECK (category IN ('men', 'women', 'juniorBoys', 'juniorGirls', 'prepKids', 'youngestKids', 'youngerBoys', 'youngerGirls', 'olderBoys', 'olderGirls'));

-- Drop the old category_id column
ALTER TABLE members DROP COLUMN category_id;

-- Drop the old index
DROP INDEX IF EXISTS idx_members_category;

-- Create new index on the category column
CREATE INDEX idx_members_category ON members(category);

-- Update the trigger function to work with the new structure
CREATE OR REPLACE FUNCTION update_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is properly set
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at 
    BEFORE UPDATE ON members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_members_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON members TO authenticated;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;
