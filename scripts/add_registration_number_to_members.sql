-- Add registration number field to members table
-- This script adds a unique federation registration number for each member
-- Updated to work with string-based categories

-- Add the registration_number column
ALTER TABLE members 
ADD COLUMN registration_number VARCHAR(50) UNIQUE;

-- Create an index for efficient lookups
CREATE INDEX idx_members_registration_number ON members(registration_number);

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
-- You can customize this regex pattern based on your federation's requirements
ALTER TABLE members 
ADD CONSTRAINT check_registration_number_format 
CHECK (registration_number ~ '^[A-Z0-9\-]+$');

-- Create a function to generate unique registration numbers
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

-- Create trigger to automatically generate registration numbers for new members
CREATE TRIGGER generate_member_registration_number
    BEFORE INSERT ON members
    FOR EACH ROW
    WHEN (NEW.registration_number IS NULL)
    EXECUTE FUNCTION generate_registration_number();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON members TO authenticated;
