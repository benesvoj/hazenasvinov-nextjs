-- Migrate training_sessions table from category VARCHAR to category_id UUID
-- Run this in your Supabase SQL Editor

-- Step 1: Add category_id column to training_sessions table
ALTER TABLE training_sessions 
ADD COLUMN category_id UUID REFERENCES categories(id);

-- Step 2: Migrate existing data from category VARCHAR to category_id UUID
UPDATE training_sessions 
SET category_id = (
    SELECT id 
    FROM categories 
    WHERE code = training_sessions.category
)
WHERE category IS NOT NULL;

-- Step 3: Verify migration - check for any unmapped categories
SELECT 
    category,
    COUNT(*) as count,
    CASE 
        WHEN category_id IS NULL THEN 'MISSING MAPPING'
        ELSE 'MIGRATED'
    END as status
FROM training_sessions 
GROUP BY category, category_id
ORDER BY category;

-- Step 4: Handle any unmapped categories (if any exist)
-- This will show categories that don't have a corresponding code in the categories table
SELECT DISTINCT category 
FROM training_sessions 
WHERE category_id IS NULL;

-- Step 5: Make category_id NOT NULL after migration is complete
-- (Only run this after verifying all data is migrated)
-- ALTER TABLE training_sessions ALTER COLUMN category_id SET NOT NULL;

-- Step 6: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_category_id ON training_sessions(category_id);

-- Step 7: Add comment to document the migration
COMMENT ON COLUMN training_sessions.category_id IS 'Category UUID reference - migrated from category VARCHAR field';
COMMENT ON COLUMN training_sessions.category IS 'Legacy category VARCHAR field - to be removed after migration is complete';

-- Step 8: Show migration summary
SELECT 
    'Migration Summary' as info,
    COUNT(*) as total_sessions,
    COUNT(category_id) as migrated_sessions,
    COUNT(*) - COUNT(category_id) as unmapped_sessions
FROM training_sessions;
