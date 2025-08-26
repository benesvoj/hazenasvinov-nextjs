-- Fix standings table foreign key relationships
-- This script will update the standings table to properly reference club_category_teams

DO $$ 
DECLARE
    v_constraint_name TEXT;
BEGIN
    RAISE NOTICE '=== FIXING STANDINGS TABLE FOREIGN KEYS ===';
    
    -- Check current state
    RAISE NOTICE 'Current standings table state:';
    RAISE NOTICE '  - Total standings records: %', (SELECT COUNT(*) FROM standings);
    RAISE NOTICE '  - Standings with team_id: %', (SELECT COUNT(*) FROM standings WHERE team_id IS NOT NULL);
    
    -- Check existing foreign key constraints
    RAISE NOTICE '';
    RAISE NOTICE 'Checking existing foreign key constraints...';
    
    -- Look for team_id foreign key constraint
    SELECT tc.constraint_name INTO v_constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'standings' 
    AND kcu.column_name = 'team_id'
    AND tc.constraint_type = 'FOREIGN KEY';
    
    IF v_constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Found existing team_id constraint: %', v_constraint_name;
        
        -- Drop the existing constraint
        EXECUTE format('ALTER TABLE standings DROP CONSTRAINT %I', v_constraint_name);
        RAISE NOTICE 'Dropped existing constraint: %', v_constraint_name;
    ELSE
        RAISE NOTICE 'No existing team_id foreign key constraint found';
    END IF;
    
    -- Check if any standings have invalid team_id references
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for invalid team_id references...';
    
    DECLARE
        v_invalid_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO v_invalid_count
        FROM standings s 
        WHERE s.team_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = s.team_id);
        
        IF v_invalid_count > 0 THEN
            RAISE NOTICE 'Found % standings with invalid team_id references', v_invalid_count;
            RAISE NOTICE 'These need to be updated to use valid club_category_teams IDs';
            
            -- Show sample of invalid references
            RAISE NOTICE 'Sample invalid team_ids:';
            FOR v_constraint_name IN 
                SELECT DISTINCT team_id FROM standings s 
                WHERE s.team_id IS NOT NULL 
                AND NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = s.team_id)
                LIMIT 5
            LOOP
                RAISE NOTICE '  - Invalid team_id: %', v_constraint_name;
            END LOOP;
            
            RAISE NOTICE '⚠️ You may need to update these standings manually or clear them';
        ELSE
            RAISE NOTICE '✅ All standings have valid team_id references';
        END IF;
    END;
    
    -- Add new foreign key constraint to club_category_teams
    RAISE NOTICE '';
    RAISE NOTICE 'Adding new foreign key constraint...';
    
    ALTER TABLE standings 
    ADD CONSTRAINT standings_team_id_fkey 
    FOREIGN KEY (team_id) REFERENCES club_category_teams(id);
    
    RAISE NOTICE '✅ Added standings_team_id_fkey constraint to club_category_teams';
    
    -- Verify the new constraint
    RAISE NOTICE '';
    RAISE NOTICE 'Verifying new constraint...';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'standings' 
        AND constraint_name = 'standings_team_id_fkey'
    ) THEN
        RAISE NOTICE '✅ standings_team_id_fkey constraint exists';
    ELSE
        RAISE NOTICE '❌ standings_team_id_fkey constraint missing';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== FOREIGN KEY FIX COMPLETED ===';
    
END $$;
