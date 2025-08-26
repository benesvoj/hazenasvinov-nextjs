-- Check standings table structure and foreign key relationships
-- This script will help identify why the standings table can't access club_category_teams

DO $$ 
DECLARE
    v_column_info RECORD;
    v_constraint_info RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING STANDINGS TABLE STRUCTURE ===';
    
    -- Check table structure
    RAISE NOTICE 'Standings table columns:';
    FOR v_column_info IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'standings' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %, default: %)', 
                    v_column_info.column_name, 
                    v_column_info.data_type,
                    v_column_info.is_nullable,
                    v_column_info.column_default;
    END LOOP;
    
    -- Check foreign key constraints
    RAISE NOTICE '';
    RAISE NOTICE 'Foreign key constraints on standings table:';
    FOR v_constraint_info IN 
        SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name as referenced_table,
            ccu.column_name as referenced_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'standings' 
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        RAISE NOTICE '  - %: % → %.%', 
                    v_constraint_info.constraint_name,
                    v_constraint_info.column_name,
                    v_constraint_info.referenced_table,
                    v_constraint_info.referenced_column;
    END LOOP;
    
    -- Check if team_id column exists and what it references
    RAISE NOTICE '';
    RAISE NOTICE 'Checking team_id column:';
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'standings' AND column_name = 'team_id'
    ) THEN
        RAISE NOTICE '  - team_id column exists';
        
        -- Check what table it should reference
        SELECT 
            ccu.table_name as referenced_table,
            ccu.column_name as referenced_column
        INTO v_constraint_info
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'standings' 
        AND kcu.column_name = 'team_id'
        AND tc.constraint_type = 'FOREIGN KEY';
        
        IF v_constraint_info.referenced_table IS NOT NULL THEN
            RAISE NOTICE '  - team_id references: %.%', 
                        v_constraint_info.referenced_table,
                        v_constraint_info.referenced_column;
        ELSE
            RAISE NOTICE '  - team_id has no foreign key constraint';
        END IF;
    ELSE
        RAISE NOTICE '  - team_id column does not exist';
    END IF;
    
    -- Check sample data
    RAISE NOTICE '';
    RAISE NOTICE 'Sample standings data:';
    RAISE NOTICE '  - Total standings records: %', (SELECT COUNT(*) FROM standings);
    RAISE NOTICE '  - Standings with team_id: %', (SELECT COUNT(*) FROM standings WHERE team_id IS NOT NULL);
    
    -- Check if any team_ids are invalid
    RAISE NOTICE '  - Invalid team_id references: %', (
        SELECT COUNT(*) FROM standings s 
        WHERE s.team_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = s.team_id)
    );
    
    RAISE NOTICE '=== CHECK COMPLETED ===';
    
END $$;
