-- Fix category_lineup_members table structure
-- This table should NOT have category_id column as it's redundant
-- The category is already defined in the parent category_lineups table

-- Step 1: Check current structure of category_lineup_members
DO $$ 
DECLARE
    has_category_id BOOLEAN;
    has_legacy_category BOOLEAN;
    has_lineup_id BOOLEAN;
    has_member_id BOOLEAN;
BEGIN
    -- Check current columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'category_lineup_members' 
        AND column_name = 'category_id'
    ) INTO has_category_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'category_lineup_members' 
        AND column_name = 'category'
        AND data_type = 'character varying'
    ) INTO has_legacy_category;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'category_lineup_members' 
        AND column_name = 'lineup_id'
    ) INTO has_lineup_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'category_lineup_members' 
        AND column_name = 'member_id'
    ) INTO has_member_id;
    
    RAISE NOTICE '=== CATEGORY_LINEUP_MEMBERS STRUCTURE CHECK ===';
    RAISE NOTICE 'Has category_id: %', has_category_id;
    RAISE NOTICE 'Has legacy category: %', has_legacy_category;
    RAISE NOTICE 'Has lineup_id: %', has_lineup_id;
    RAISE NOTICE 'Has member_id: %', has_member_id;
    
    -- This table should have lineup_id and member_id, but NOT category_id
    IF has_lineup_id AND has_member_id THEN
        RAISE NOTICE '✅ Core structure is correct (has lineup_id and member_id)';
    ELSE
        RAISE WARNING '❌ Missing core columns (lineup_id or member_id)';
    END IF;
    
    -- Remove category_id if it exists (it's redundant)
    IF has_category_id THEN
        RAISE NOTICE 'Removing redundant category_id column from category_lineup_members';
        ALTER TABLE category_lineup_members DROP COLUMN IF EXISTS category_id;
    END IF;
    
    -- Remove legacy category column if it exists
    IF has_legacy_category THEN
        RAISE NOTICE 'Removing legacy category column from category_lineup_members';
        ALTER TABLE category_lineup_members DROP COLUMN IF EXISTS category;
    END IF;
    
    RAISE NOTICE '✅ category_lineup_members structure cleaned up';
END $$;

-- Step 2: Verify the relationship works correctly
-- Check if we can get category information through the proper relationship
SELECT 
    'Relationship verification' as info,
    clm.id as lineup_member_id,
    clm.lineup_id,
    clm.member_id,
    cl.name as lineup_name,
    cl.category_id,
    c.name as category_name,
    m.name as member_name,
    m.surname as member_surname
FROM category_lineup_members clm
JOIN category_lineups cl ON clm.lineup_id = cl.id
JOIN categories c ON cl.category_id = c.id
JOIN members m ON clm.member_id = m.id
LIMIT 5;

-- Step 3: Show the correct table structure
SELECT 
    'Correct category_lineup_members structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'category_lineup_members'
ORDER BY ordinal_position;
