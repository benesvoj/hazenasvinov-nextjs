-- Remove club_id column from matches table
-- This script safely removes the redundant club_id column since club info can be derived
-- from the existing relationships: matches -> teams -> club_categories -> clubs

DO $$
DECLARE
    v_column_exists BOOLEAN;
    v_constraint_exists BOOLEAN;
    v_referenced_tables TEXT[];
    v_table_name TEXT := 'matches';
    v_column_name TEXT := 'club_id';
BEGIN
    RAISE NOTICE '=== REMOVING club_id COLUMN FROM MATCHES TABLE ===';
    RAISE NOTICE 'Table: %', v_table_name;
    RAISE NOTICE 'Column: %', v_column_name;
    RAISE NOTICE '';
    
    -- Check if the column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = v_table_name 
        AND column_name = v_column_name
    ) INTO v_column_exists;
    
    IF NOT v_column_exists THEN
        RAISE NOTICE '❌ Column % does not exist in table %', v_column_name, v_table_name;
        RAISE NOTICE 'No action needed.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Column % exists in table %', v_column_name, v_table_name;
    
    -- Check for foreign key constraints referencing this column
    SELECT array_agg(
        tc.table_name || '.' || tc.constraint_name
    ) INTO v_referenced_tables
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND kcu.table_name = v_table_name
        AND kcu.column_name = v_column_name;
    
    IF v_referenced_tables IS NOT NULL AND array_length(v_referenced_tables, 1) > 0 THEN
        RAISE NOTICE '⚠️  WARNING: Found foreign key constraints referencing %:', v_column_name;
        FOREACH v_table_name IN ARRAY v_referenced_tables
        LOOP
            RAISE NOTICE '  - %', v_table_name;
        END LOOP;
        RAISE NOTICE '';
        RAISE NOTICE 'You need to drop these constraints before removing the column.';
        RAISE NOTICE 'Consider running this script after handling the constraints.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ No foreign key constraints found. Safe to proceed.';
    
    -- Check for indexes on this column
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for indexes on % column...', v_column_name;
    
    -- List any indexes that might be affected
    FOR v_table_name IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'matches' 
        AND indexdef LIKE '%club_id%'
    LOOP
        RAISE NOTICE '  Found index: %', v_table_name;
    END LOOP;
    
    -- Check for any views that might reference this column
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for views that reference % column...', v_column_name;
    
    FOR v_table_name IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition LIKE '%club_id%'
    LOOP
        RAISE NOTICE '  Found view: %', v_table_name;
    END LOOP;
    
    -- Check for any functions/triggers that might reference this column
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for functions/triggers that reference % column...', v_column_name;
    
    FOR v_table_name IN 
        SELECT proname 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND prosrc LIKE '%club_id%'
    LOOP
        RAISE NOTICE '  Found function: %', v_table_name;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== READY TO REMOVE COLUMN ===';
    RAISE NOTICE 'The following actions will be performed:';
    RAISE NOTICE '1. Remove the % column from % table', v_column_name, v_table_name;
    RAISE NOTICE '2. This action is IRREVERSIBLE';
    RAISE NOTICE '';
    RAISE NOTICE 'To proceed, uncomment the ALTER TABLE statement below.';
    RAISE NOTICE '';
    
    -- Uncomment the line below to actually remove the column
    -- ALTER TABLE matches DROP COLUMN club_id;
    
    RAISE NOTICE 'Column removal completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION ===';
    RAISE NOTICE 'You can verify the column was removed with:';
    RAISE NOTICE 'SELECT column_name FROM information_schema.columns WHERE table_name = ''matches'';';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error during column removal: % %', SQLERRM, SQLSTATE;
END $$;
