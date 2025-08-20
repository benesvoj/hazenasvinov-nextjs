-- Comprehensive setup script for the members system
-- This script updates the schema and adds registration numbers

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS members_backup AS SELECT * FROM members;

-- Step 2: Update schema to use string categories
-- Drop the existing foreign key constraint
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_category_id_fkey;

-- Add the new category column as string
ALTER TABLE members ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Update the category column with the code from the categories table
UPDATE members 
SET category = c.code 
FROM categories c 
WHERE members.category_id = c.id AND members.category IS NULL;

-- Make the category column NOT NULL
ALTER TABLE members ALTER COLUMN category SET NOT NULL;

-- Add a check constraint to ensure valid category values
ALTER TABLE members DROP CONSTRAINT IF EXISTS check_valid_category;
ALTER TABLE members ADD CONSTRAINT check_valid_category 
CHECK (category IN ('men', 'women', 'juniorBoys', 'juniorGirls', 'prepKids', 'youngestKids', 'youngerBoys', 'youngerGirls', 'olderBoys', 'olderGirls'));

-- Drop the old category_id column
ALTER TABLE members DROP COLUMN IF EXISTS category_id;

-- Drop the old index
DROP INDEX IF EXISTS idx_members_category;

-- Create new index on the category column
CREATE INDEX idx_members_category ON members(category);

-- Step 3: Add registration number field
-- Add the registration_number column
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);

-- Create an index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_members_registration_number ON members(registration_number);

-- Add a comment to document the field
COMMENT ON COLUMN members.registration_number IS 'Unique federation registration number for the member';

-- Update existing members with placeholder registration numbers (if any exist)
-- This ensures the UNIQUE constraint doesn't fail
UPDATE members 
SET registration_number = 'REG-' || LPAD(id::text, 8, '0')
WHERE registration_number IS NULL;

-- Make the field NOT NULL after setting default values
ALTER TABLE members 
ALTER COLUMN registration_number SET NOT NULL;

-- Add validation to ensure registration numbers follow a specific format
ALTER TABLE members DROP CONSTRAINT IF EXISTS check_registration_number_format;
ALTER TABLE members 
ADD CONSTRAINT check_registration_number_format 
CHECK (registration_number ~ '^[A-Z0-9\-]+$');

-- Step 4: Create function to generate unique registration numbers
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TRIGGER AS $$
DECLARE
    new_reg_number VARCHAR(50);
    counter INTEGER := 1;
BEGIN
    -- Generate base registration number
    new_reg_number := 'REG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::text, 4, '0');
    
    -- Keep trying until we find a unique number
    WHILE EXISTS (SELECT 1 FROM members WHERE registration_number = new_reg_number) LOOP
        counter := counter + 1;
        new_reg_number := 'REG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::text, 4, '0');
    END LOOP;
    
    NEW.registration_number := new_reg_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically generate registration numbers
DROP TRIGGER IF EXISTS generate_member_registration_number ON members;
CREATE TRIGGER generate_member_registration_number
    BEFORE INSERT ON members
    FOR EACH ROW
    WHEN (NEW.registration_number IS NULL)
    EXECUTE FUNCTION generate_registration_number();

-- Step 6: Update the updated_at trigger
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

-- Step 7: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON members TO authenticated;

-- Step 8: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;

-- Step 9: Show sample data
SELECT 
    id,
    registration_number,
    name,
    surname,
    category,
    sex,
    functions,
    created_at,
    updated_at
FROM members 
LIMIT 5;
