-- Remove NOT NULL constraint from category column in training_sessions table
-- This allows the column to be nullable during the migration period
-- Run this in Supabase SQL Editor

-- Step 1: Check current constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'training_sessions'
    AND column_name = 'category';

-- Step 2: Remove NOT NULL constraint
ALTER TABLE training_sessions ALTER COLUMN category DROP NOT NULL;

-- Step 3: Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'training_sessions'
    AND column_name = 'category';

-- Step 4: Add comment explaining the temporary state
COMMENT ON COLUMN training_sessions.category IS 'Legacy field - will be removed after migration to category_id is complete';
