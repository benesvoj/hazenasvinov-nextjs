-- Check if sponsorship tables exist and their current schema
-- Run this in Supabase SQL Editor to diagnose the current state

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('main_partners', 'business_partners', 'media_partners', 'sponsorship_packages');

-- If main_partners exists, check its schema
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'main_partners') THEN
        RAISE NOTICE 'main_partners table exists. Checking schema...';
        
        -- Check columns
        RAISE NOTICE 'Columns in main_partners:';
        FOR col IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'main_partners'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  %: % (nullable: %)', col.column_name, col.data_type, col.is_nullable;
        END LOOP;
    ELSE
        RAISE NOTICE 'main_partners table does NOT exist. You need to run the setup scripts.';
    END IF;
END $$;

-- Check if there are any rows in the tables
SELECT 
    'main_partners' as table_name,
    COUNT(*) as row_count
FROM main_partners
UNION ALL
SELECT 
    'business_partners' as table_name,
    COUNT(*) as row_count
FROM business_partners
UNION ALL
SELECT 
    'media_partners' as table_name,
    COUNT(*) as row_count
FROM media_partners
UNION ALL
SELECT 
    'sponsorship_packages' as table_name,
    COUNT(*) as row_count
FROM sponsorship_packages;
