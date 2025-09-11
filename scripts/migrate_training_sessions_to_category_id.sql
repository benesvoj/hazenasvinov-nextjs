-- Migrate training_sessions table from category VARCHAR to category_id UUID
-- This script completes the migration for the training_sessions table

-- Step 1: Add category_id column if it doesn't exist
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_category_id ON training_sessions(category_id);

-- Step 3: Migrate data from category to category_id
UPDATE training_sessions 
SET category_id = c.id 
FROM categories c 
WHERE training_sessions.category = c.code 
AND training_sessions.category_id IS NULL;

-- Step 4: Verify migration
DO $$ 
DECLARE
    total_sessions INTEGER;
    sessions_with_category_id INTEGER;
    sessions_missing_category_id INTEGER;
    orphaned_sessions INTEGER;
BEGIN
    -- Count total sessions
    SELECT COUNT(*) INTO total_sessions FROM training_sessions;
    
    -- Count sessions with category_id
    SELECT COUNT(*) INTO sessions_with_category_id 
    FROM training_sessions 
    WHERE category_id IS NOT NULL;
    
    -- Count sessions missing category_id
    SELECT COUNT(*) INTO sessions_missing_category_id 
    FROM training_sessions 
    WHERE category_id IS NULL;
    
    -- Count orphaned sessions (category_id doesn't match any category)
    SELECT COUNT(*) INTO orphaned_sessions
    FROM training_sessions ts
    LEFT JOIN categories c ON ts.category_id = c.id
    WHERE ts.category_id IS NOT NULL AND c.id IS NULL;
    
    -- Report the status
    RAISE NOTICE '=== TRAINING_SESSIONS MIGRATION STATUS ===';
    RAISE NOTICE 'Total sessions: %', total_sessions;
    RAISE NOTICE 'Sessions with category_id: %', sessions_with_category_id;
    RAISE NOTICE 'Sessions missing category_id: %', sessions_missing_category_id;
    RAISE NOTICE 'Orphaned sessions: %', orphaned_sessions;
    
    -- Check if migration is complete
    IF sessions_missing_category_id > 0 THEN
        RAISE WARNING 'Migration incomplete! % sessions still missing category_id.', sessions_missing_category_id;
        
        -- Show which sessions are missing category_id
        RAISE NOTICE 'Sessions missing category_id:';
        FOR rec IN 
            SELECT id, title, category, category_id 
            FROM training_sessions 
            WHERE category_id IS NULL 
            LIMIT 10
        LOOP
            RAISE NOTICE '  ID: %, Title: %, Category: %, Category_ID: %', 
                rec.id, rec.title, rec.category, rec.category_id;
        END LOOP;
    END IF;
    
    IF orphaned_sessions > 0 THEN
        RAISE WARNING 'Found % orphaned sessions with invalid category_id!', orphaned_sessions;
    END IF;
    
    IF sessions_missing_category_id = 0 AND orphaned_sessions = 0 THEN
        RAISE NOTICE 'Migration verification passed! All sessions have valid category_id.';
    END IF;
END $$;

-- Step 5: Show sample of migrated data
SELECT 
    'Sample migrated data' as info,
    ts.id,
    ts.title,
    ts.category as old_category,
    ts.category_id,
    c.name as category_name,
    c.code as category_code
FROM training_sessions ts
LEFT JOIN categories c ON ts.category_id = c.id
ORDER BY ts.created_at DESC
LIMIT 5;

-- Step 6: Add comment to document the migration
COMMENT ON COLUMN training_sessions.category_id IS 'Category UUID reference - migrated from category VARCHAR field';

-- Step 7: Final verification query
SELECT 
    'Final verification' as step,
    COUNT(*) as total_sessions,
    COUNT(category_id) as sessions_with_category_id,
    COUNT(*) - COUNT(category_id) as sessions_missing_category_id
FROM training_sessions;