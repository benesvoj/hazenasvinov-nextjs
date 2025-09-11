-- Get current database schema for analysis
-- Run this in Supabase SQL Editor and save the results

-- 1. Get all tables with their columns
SELECT 
    'TABLE' as object_type,
    t.table_name as object_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length,
    c.ordinal_position
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'sql_%'
ORDER BY t.table_name, c.ordinal_position;

-- 2. Get all foreign key relationships
SELECT 
    'FOREIGN_KEY' as object_type,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 3. Get all functions
SELECT 
    'FUNCTION' as object_type,
    routine_name as object_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 4. Get all indexes
SELECT 
    'INDEX' as object_type,
    tablename as table_name,
    indexname as index_name,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Get specific table structures for key tables
SELECT 'CATEGORIES_TABLE' as info, 
       column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'categories' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'MATCHES_TABLE' as info, 
       column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'matches' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'TRAINING_SESSIONS_TABLE' as info, 
       column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'training_sessions' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'MEMBERS_TABLE' as info, 
       column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'members' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'BLOG_POSTS_TABLE' as info, 
       column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blog_posts' AND table_schema = 'public'
ORDER BY ordinal_position;
