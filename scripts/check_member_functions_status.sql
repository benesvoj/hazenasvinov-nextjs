-- =====================================================
-- SQL Script: Check Member Functions Status
-- Purpose: Diagnose issues with member_functions table
-- Created: $(date)
-- =====================================================

-- Check if the table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'member_functions') 
        THEN 'Table exists' 
        ELSE 'Table does not exist' 
    END as table_status;

-- Check if UUID extension is available
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_extension WHERE extname = 'uuid-ossp') 
        THEN 'UUID extension available' 
        ELSE 'UUID extension NOT available' 
    END as uuid_extension_status;

-- Check table structure if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'member_functions') THEN
        RAISE NOTICE 'Table structure:';
        RAISE NOTICE '================';
        
        -- Show table columns
        FOR r IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'member_functions'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
                r.column_name, r.data_type, r.is_nullable, r.column_default;
        END LOOP;
        
        -- Show table constraints
        RAISE NOTICE '';
        RAISE NOTICE 'Constraints:';
        RAISE NOTICE '============';
        
        FOR r IN 
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints 
            WHERE table_name = 'member_functions'
        LOOP
            RAISE NOTICE 'Constraint: %, Type: %', r.constraint_name, r.constraint_type;
        END LOOP;
        
        -- Show RLS status
        RAISE NOTICE '';
        RAISE NOTICE 'RLS Status:';
        RAISE NOTICE '===========';
        
        DECLARE
            rls_status TEXT;
        BEGIN
            SELECT 
                CASE 
                    WHEN relrowsecurity THEN 'RLS enabled'
                    ELSE 'RLS disabled'
                END
            INTO rls_status
            FROM pg_class 
            WHERE relname = 'member_functions';
            
            RAISE NOTICE 'RLS: %', rls_status;
        END;
        
        -- Show data count
        RAISE NOTICE '';
        RAISE NOTICE 'Data Status:';
        RAISE NOTICE '============';
        
        DECLARE
            row_count INTEGER;
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM member_functions' INTO row_count;
            RAISE NOTICE 'Total rows: %', row_count;
        END;
        
    ELSE
        RAISE NOTICE 'Table member_functions does not exist.';
    END IF;
END $$;

-- Check for any recent errors in the logs (if accessible)
-- This might not work in all Supabase instances
SELECT 
    'Database check completed' as status,
    NOW() as check_time;
