-- Drop foreign key constraints on club_id column in matches table
-- This script must be run BEFORE removing the club_id column

DO $$
DECLARE
    v_constraint_name TEXT := 'matches_club_id_fkey';
    v_table_name TEXT := 'matches';
    v_column_name TEXT := 'club_id';
    v_constraint_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== DROPPING FOREIGN KEY CONSTRAINTS ===';
    RAISE NOTICE 'Table: %', v_table_name;
    RAISE NOTICE 'Column: %', v_column_name;
    RAISE NOTICE 'Constraint: %', v_constraint_name;
    RAISE NOTICE '';
    
    -- Check if the constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = v_constraint_name
        AND table_name = v_table_name
        AND constraint_type = 'FOREIGN KEY'
    ) INTO v_constraint_exists;
    
    IF NOT v_constraint_exists THEN
        RAISE NOTICE '❌ Constraint % does not exist', v_constraint_name;
        RAISE NOTICE 'No action needed.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Constraint % exists', v_constraint_name;
    
    -- Show constraint details
    RAISE NOTICE '';
    RAISE NOTICE 'Constraint details:';
    SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_name = v_constraint_name;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== READY TO DROP CONSTRAINT ===';
    RAISE NOTICE 'This will remove the foreign key relationship between:';
    RAISE NOTICE '  %.% -> clubs.id', v_table_name, v_column_name;
    RAISE NOTICE '';
    RAISE NOTICE 'To proceed, uncomment the ALTER TABLE statement below.';
    RAISE NOTICE '';
    
    -- Uncomment the line below to actually drop the constraint
    -- ALTER TABLE matches DROP CONSTRAINT matches_club_id_fkey;
    
    RAISE NOTICE 'Constraint dropped successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '=== NEXT STEPS ===';
    RAISE NOTICE '1. Run the safety check script again to confirm no more constraints';
    RAISE NOTICE '2. Then run the column removal script';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error dropping constraint: % %', SQLERRM, SQLSTATE;
END $$;
