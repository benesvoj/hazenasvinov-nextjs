-- Check constraints on training_sessions table
-- Run this in Supabase SQL Editor

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'training_sessions'
    AND column_name IN ('category', 'category_id')
ORDER BY column_name;

-- Check constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'training_sessions'::regclass
    AND conname LIKE '%category%';
