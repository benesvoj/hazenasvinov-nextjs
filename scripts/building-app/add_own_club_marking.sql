-- Add is_own_club field to clubs table
-- This field marks which club is the "home club" for filtering matches and standings

DO $$
DECLARE
    v_column_exists BOOLEAN;
    v_table_name TEXT := 'clubs';
    v_column_name TEXT := 'is_own_club';
BEGIN
    RAISE NOTICE '=== ADDING OWN CLUB MARKING ===';
    RAISE NOTICE 'Table: %', v_table_name;
    RAISE NOTICE 'Column: %', v_column_name;
    RAISE NOTICE '';
    
    -- Check if the column already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = v_table_name 
        AND column_name = v_column_name
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
        RAISE NOTICE '✅ Column % already exists in table %', v_column_name, v_table_name;
        RAISE NOTICE 'No action needed.';
        RETURN;
    END IF;
    
    RAISE NOTICE '❌ Column % does not exist in table %', v_column_name, v_table_name;
    RAISE NOTICE 'Adding column...';
    
    -- Add the is_own_club column
    ALTER TABLE clubs ADD COLUMN is_own_club BOOLEAN DEFAULT false;
    
    RAISE NOTICE '✅ Column % added successfully!', v_column_name;
    
    -- Show current clubs
    RAISE NOTICE '';
    RAISE NOTICE 'Current clubs in the system:';
    SELECT 
        id,
        name,
        short_name,
        is_own_club
    FROM clubs
    ORDER BY name;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== NEXT STEPS ===';
    RAISE NOTICE '1. Mark your home club by setting is_own_club = true';
    RAISE NOTICE '2. Update the club management interface to show this field';
    RAISE NOTICE '3. Update data fetching logic to use this field for filtering';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error adding column: % %', SQLERRM, SQLSTATE;
END $$;
