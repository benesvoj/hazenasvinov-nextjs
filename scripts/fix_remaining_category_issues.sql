-- Fix remaining category migration issues
-- Based on the actual database state analysis

-- Step 1: Check if category_lineup_members has category_id
DO $$ 
DECLARE
    has_category_id BOOLEAN;
    has_legacy_category BOOLEAN;
BEGIN
    -- Check if category_lineup_members has category_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'category_lineup_members' 
        AND column_name = 'category_id'
    ) INTO has_category_id;
    
    -- Check if category_lineup_members has legacy category column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'category_lineup_members' 
        AND column_name = 'category'
        AND data_type = 'character varying'
    ) INTO has_legacy_category;
    
    RAISE NOTICE '=== CATEGORY_LINEUP_MEMBERS STATUS ===';
    RAISE NOTICE 'Has category_id: %', has_category_id;
    RAISE NOTICE 'Has legacy category: %', has_legacy_category;
    
    -- Add category_id if missing
    IF NOT has_category_id THEN
        ALTER TABLE category_lineup_members ADD COLUMN category_id UUID REFERENCES categories(id);
        CREATE INDEX IF NOT EXISTS idx_category_lineup_members_category_id ON category_lineup_members(category_id);
        RAISE NOTICE 'Added category_id column to category_lineup_members';
    END IF;
    
    -- Migrate data from legacy category to category_id if both exist
    IF has_legacy_category AND has_category_id THEN
        UPDATE category_lineup_members 
        SET category_id = c.id 
        FROM categories c 
        WHERE category_lineup_members.category = c.code 
        AND category_lineup_members.category_id IS NULL;
        
        RAISE NOTICE 'Migrated data from category to category_id in category_lineup_members';
    END IF;
END $$;

-- Step 2: Verify the migration worked
SELECT 
    'category_lineup_members migration check' as info,
    COUNT(*) as total_records,
    COUNT(category_id) as records_with_category_id,
    COUNT(*) - COUNT(category_id) as records_missing_category_id
FROM category_lineup_members;

-- Step 3: Check if we can safely remove legacy category column from category_lineup_members
DO $$ 
DECLARE
    records_with_legacy_category INTEGER;
    records_with_category_id INTEGER;
    total_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records FROM category_lineup_members;
    SELECT COUNT(*) INTO records_with_category_id FROM category_lineup_members WHERE category_id IS NOT NULL;
    SELECT COUNT(*) INTO records_with_legacy_category FROM category_lineup_members WHERE category IS NOT NULL;
    
    RAISE NOTICE '=== CATEGORY_LINEUP_MEMBERS MIGRATION STATUS ===';
    RAISE NOTICE 'Total records: %', total_records;
    RAISE NOTICE 'Records with category_id: %', records_with_category_id;
    RAISE NOTICE 'Records with legacy category: %', records_with_legacy_category;
    
    IF records_with_category_id = total_records AND records_with_category_id > 0 THEN
        RAISE NOTICE '✅ Migration complete! Safe to remove legacy category column.';
        
        -- Remove legacy category column
        ALTER TABLE category_lineup_members DROP COLUMN IF EXISTS category;
        RAISE NOTICE 'Removed legacy category column from category_lineup_members';
    ELSE
        RAISE WARNING 'Migration incomplete. % records missing category_id', total_records - records_with_category_id;
    END IF;
END $$;

-- Step 4: Final verification of all category-related tables
DO $$ 
DECLARE
    table_name TEXT;
    has_category_id BOOLEAN;
    has_legacy_category BOOLEAN;
    important_tables TEXT[] := ARRAY[
        'training_sessions', 
        'category_lineup_members', 
        'members', 
        'matches', 
        'standings', 
        'blog_posts',
        'category_lineups',
        'club_categories',
        'club_teams'
    ];
BEGIN
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    
    FOREACH table_name IN ARRAY important_tables
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            -- Check for category_id
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = table_name
                AND column_name = 'category_id'
            ) INTO has_category_id;
            
            -- Check for legacy category
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = table_name
                AND column_name = 'category'
                AND data_type = 'character varying'
            ) INTO has_legacy_category;
            
            IF has_category_id AND NOT has_legacy_category THEN
                RAISE NOTICE '✅ % - Fully migrated', table_name;
            ELSIF has_category_id AND has_legacy_category THEN
                RAISE NOTICE '⚠️ % - Has both category_id and legacy category', table_name;
            ELSIF NOT has_category_id AND has_legacy_category THEN
                RAISE NOTICE '❌ % - Only has legacy category', table_name;
            ELSE
                RAISE NOTICE '❓ % - No category columns found', table_name;
            END IF;
        ELSE
            RAISE NOTICE '❓ % - Table does not exist', table_name;
        END IF;
    END LOOP;
END $$;

-- Step 5: Show current state of categories table
SELECT 
    'Categories table status' as info,
    COUNT(*) as total_categories,
    COUNT(code) as categories_with_code,
    COUNT(slug) as categories_with_slug
FROM categories;
