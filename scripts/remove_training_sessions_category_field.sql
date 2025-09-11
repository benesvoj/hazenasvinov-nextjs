-- Remove legacy category VARCHAR field from training_sessions table
-- Run this ONLY after verifying all application code has been updated
-- and the migration is working correctly

-- Step 1: Verify that category_id is populated and not null
SELECT 
    'Verification' as step,
    COUNT(*) as total_sessions,
    COUNT(category_id) as sessions_with_category_id,
    COUNT(*) - COUNT(category_id) as sessions_missing_category_id
FROM training_sessions;

-- Step 2: Show any sessions that still have null category_id
SELECT 
    'Sessions with null category_id' as issue,
    id,
    title,
    category,
    category_id
FROM training_sessions 
WHERE category_id IS NULL;

-- Step 3: Make category_id NOT NULL (only if all data is migrated)
-- ALTER TABLE training_sessions ALTER COLUMN category_id SET NOT NULL;

-- Step 4: Remove the legacy category column
-- ALTER TABLE training_sessions DROP COLUMN category;

-- Step 5: Update the constraint to remove the old category check
-- ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS check_valid_category;

-- Step 6: Add comment to document the completion
-- COMMENT ON COLUMN training_sessions.category_id IS 'Category UUID reference - migration completed';

-- Step 7: Final verification
-- SELECT 
--     'Final verification' as step,
--     COUNT(*) as total_sessions,
--     COUNT(category_id) as sessions_with_category_id
-- FROM training_sessions;
