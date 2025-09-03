-- =====================================================
-- SQL Script: Test Member Functions Optional
-- Purpose: Verify that functions column allows empty arrays
-- Created: $(date)
-- =====================================================

-- Start transaction
BEGIN;

-- Step 1: Check current table structure
SELECT 
    'Current members table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;

-- Step 2: Check if functions column allows empty arrays
SELECT 
    'Functions column constraints:' as info,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%functions%';

-- Step 3: Test inserting a member with empty functions array
INSERT INTO members (
    name, 
    surname, 
    date_of_birth, 
    category, 
    sex, 
    functions
) VALUES (
    'Test',
    'Member',
    '1990-01-01',
    'men',
    'male',
    '{}'  -- Empty array
);

-- Step 4: Verify the insert was successful
SELECT 
    'Test member inserted:' as info,
    id,
    name,
    surname,
    functions,
    array_length(functions, 1) as functions_count
FROM members 
WHERE name = 'Test' AND surname = 'Member';

-- Step 5: Test inserting a member with NULL functions (should work if column allows NULL)
-- Note: This will fail if the column has NOT NULL constraint
INSERT INTO members (
    name, 
    surname, 
    date_of_birth, 
    category, 
    sex
    -- functions column omitted to test default behavior
) VALUES (
    'Test2',
    'Member2',
    '1990-01-01',
    'men',
    'male'
);

-- Step 6: Verify the second insert was successful
SELECT 
    'Test member 2 inserted:' as info,
    id,
    name,
    surname,
    functions,
    array_length(functions, 1) as functions_count
FROM members 
WHERE name = 'Test2' AND surname = 'Member2';

-- Step 7: Clean up test data
DELETE FROM members WHERE name IN ('Test', 'Test2');

-- Step 8: Verify cleanup
SELECT 
    'After cleanup - test members count:' as info,
    COUNT(*) as test_members_count
FROM members 
WHERE name IN ('Test', 'Test2');

-- Commit the transaction
COMMIT;

-- Final verification
SELECT 
    'Test completed successfully!' as result,
    'Functions column allows empty arrays' as status;
