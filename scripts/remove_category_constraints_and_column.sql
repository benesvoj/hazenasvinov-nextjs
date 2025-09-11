-- Remove category constraints and column from training_sessions table
-- This is the proper way to complete the migration
-- Run this in Supabase SQL Editor

-- Step 1: Check current constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'training_sessions'::regclass
    AND conname LIKE '%category%';

-- Step 2: Drop the check constraint on category column
ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS check_valid_category;

-- Step 3: Drop the category column entirely
ALTER TABLE training_sessions DROP COLUMN IF EXISTS category;

-- Step 4: Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'training_sessions'
    AND column_name IN ('category', 'category_id')
ORDER BY column_name;

-- Step 5: Verify constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'training_sessions'::regclass
    AND conname LIKE '%category%';

-- Step 6: Add comment to category_id column
COMMENT ON COLUMN training_sessions.category_id IS 'Foreign key reference to categories table - migrated from legacy category VARCHAR field';
