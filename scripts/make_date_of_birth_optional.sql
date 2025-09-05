-- Make date_of_birth optional in members table
-- Run this in Supabase SQL Editor

-- Step 1: Make date_of_birth column nullable
ALTER TABLE members ALTER COLUMN date_of_birth DROP NOT NULL;

-- Step 2: Add a comment to document the change
COMMENT ON COLUMN members.date_of_birth IS 'Optional date of birth for the member';

-- Step 3: Verify the change
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'members' 
AND column_name = 'date_of_birth';

-- Step 4: Test insert without date_of_birth
-- This should work after the change
-- INSERT INTO members (name, surname, category, sex, functions, registration_number) 
-- VALUES ('Test', 'Member', 'U15', 'male', '{}', 'TEST001');
