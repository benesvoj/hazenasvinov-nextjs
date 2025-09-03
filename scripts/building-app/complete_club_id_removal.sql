-- Complete workflow: Remove club_id column from matches table
-- This script handles the entire process: constraint removal + column removal

DO $$
DECLARE
    v_constraint_name TEXT := 'matches_club_id_fkey';
    v_table_name TEXT := 'matches';
    v_column_name TEXT := 'club_id';
    v_constraint_exists BOOLEAN;
    v_column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== COMPLETE CLUB_ID REMOVAL WORKFLOW ===';
    RAISE NOTICE 'Table: %', v_table_name;
    RAISE NOTICE 'Column: %', v_column_name;
    RAISE NOTICE '';
    
    -- Step 1: Check if constraint exists
    RAISE NOTICE 'Step 1: Checking for foreign key constraints...';
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = v_constraint_name
        AND table_name = v_table_name
        AND constraint_type = 'FOREIGN KEY'
    ) INTO v_constraint_exists;
    
    IF v_constraint_exists THEN
        RAISE NOTICE '✅ Found constraint: %', v_constraint_name;
        RAISE NOTICE 'Dropping constraint...';
        
        -- Drop the constraint
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', v_table_name, v_constraint_name);
        RAISE NOTICE '✅ Constraint dropped successfully!';
    ELSE
        RAISE NOTICE 'ℹ️  No foreign key constraints found.';
    END IF;
    
    RAISE NOTICE '';
    
    -- Step 2: Check if column exists
    RAISE NOTICE 'Step 2: Checking if column exists...';
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = v_table_name 
        AND column_name = v_column_name
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
        RAISE NOTICE '✅ Column % exists', v_column_name;
        RAISE NOTICE 'Removing column...';
        
        -- Remove the column
        EXECUTE format('ALTER TABLE %I DROP COLUMN %I', v_table_name, v_column_name);
        RAISE NOTICE '✅ Column removed successfully!';
    ELSE
        RAISE NOTICE 'ℹ️  Column % does not exist', v_column_name;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== WORKFLOW COMPLETED ===';
    RAISE NOTICE '';
    
    -- Step 3: Verification
    RAISE NOTICE 'Step 3: Verifying changes...';
    
    -- Show remaining columns
    RAISE NOTICE 'Remaining columns in % table:', v_table_name;
    FOR v_column_name IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = v_table_name 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %', v_column_name;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ club_id column removal completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '=== IMPORTANT NOTES ===';
    RAISE NOTICE '1. The club_id column has been permanently removed';
    RAISE NOTICE '2. Club information can still be accessed via:';
    RAISE NOTICE '   matches -> teams -> club_categories -> clubs';
    RAISE NOTICE '3. Update any application code that referenced matches.club_id';
    RAISE NOTICE '4. Consider updating any views or functions that used this column';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error during workflow: % %', SQLERRM, SQLSTATE;
END $$;
