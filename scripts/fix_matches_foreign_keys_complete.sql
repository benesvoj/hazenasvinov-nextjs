-- Complete Fix for Matches Foreign Keys
-- This script first populates the club_category_teams table, then migrates the data and adds foreign key constraints

-- Step 1: Populate club_category_teams table
DO $$ 
DECLARE
    v_season_id UUID;
    v_category_id UUID;
    v_club RECORD;
    v_club_category RECORD;
    v_team_suffix TEXT;
    v_suffixes TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E'];
    v_i INTEGER;
BEGIN
    RAISE NOTICE '=== STEP 1: POPULATING CLUB_CATEGORY_TEAMS ===';
    RAISE NOTICE 'Starting population of club_category_teams table...';
    
    -- Check current state
    RAISE NOTICE 'Current state:';
    RAISE NOTICE '  - Total clubs: %', (SELECT COUNT(*) FROM clubs);
    RAISE NOTICE '  - Total club_categories: %', (SELECT COUNT(*) FROM club_categories);
    RAISE NOTICE '  - Total club_category_teams: %', (SELECT COUNT(*) FROM club_category_teams);
    RAISE NOTICE '  - Total teams: %', (SELECT COUNT(*) FROM teams);
    
    -- If club_categories is empty, we need to create entries first
    IF (SELECT COUNT(*) FROM club_categories) = 0 THEN
        RAISE NOTICE 'No club_categories found. Creating basic structure...';
        
        -- Get the first active season and category to create basic entries
        -- Get first active season
        SELECT id INTO v_season_id FROM seasons WHERE is_active = true LIMIT 1;
        IF v_season_id IS NULL THEN
            SELECT id INTO v_season_id FROM seasons LIMIT 1;
        END IF;
        
        -- Get first active category
        SELECT id INTO v_category_id FROM categories WHERE is_active = true LIMIT 1;
        IF v_category_id IS NULL THEN
            SELECT id INTO v_category_id FROM categories LIMIT 1;
        END IF;
        
        IF v_season_id IS NULL OR v_category_id IS NULL THEN
            RAISE EXCEPTION 'No seasons or categories found. Please create at least one season and category first.';
        END IF;
        
        RAISE NOTICE 'Using season ID: % and category ID: %', v_season_id, v_category_id;
        
        -- Create club_categories entries for all clubs
        FOR v_club IN SELECT id, name FROM clubs WHERE is_active = true LOOP
            INSERT INTO club_categories (club_id, category_id, season_id, max_teams, is_active)
            VALUES (v_club.id, v_category_id, v_season_id, 1, true)
            ON CONFLICT (club_id, category_id, season_id) DO NOTHING;
            
            RAISE NOTICE 'Created club_category for club: %', v_club.name;
        END LOOP;
    END IF;
    
    -- Now populate club_category_teams based on existing teams
    RAISE NOTICE 'Populating club_category_teams...';
    
    -- Create a temporary mapping table to understand team-club relationships
    CREATE TEMP TABLE IF NOT EXISTS temp_team_club_mapping AS
    SELECT 
        t.id as team_id,
        t.name as team_name,
        c.id as club_id,
        c.name as club_name,
        CASE 
            WHEN t.name LIKE '%% A' THEN 'A'
            WHEN t.name LIKE '%% B' THEN 'B'
            WHEN t.name LIKE '%% C' THEN 'C'
            WHEN t.name LIKE '%% D' THEN 'D'
            WHEN t.name LIKE '%% E' THEN 'E'
            ELSE 'A'
        END as team_suffix
    FROM teams t
    LEFT JOIN clubs c ON c.name = 
        CASE 
            WHEN t.name LIKE '%% A' THEN REPLACE(t.name, ' A', '')
            WHEN t.name LIKE '%% B' THEN REPLACE(t.name, ' B', '')
            WHEN t.name LIKE '%% C' THEN REPLACE(t.name, ' C', '')
            WHEN t.name LIKE '%% D' THEN REPLACE(t.name, ' D', '')
            WHEN t.name LIKE '%% E' THEN REPLACE(t.name, ' E', '')
            ELSE t.name
        END
    WHERE c.id IS NOT NULL;
    
    RAISE NOTICE 'Created team-club mapping for % teams', (SELECT COUNT(*) FROM temp_team_club_mapping);
    
    -- Populate club_category_teams for each club_category
    FOR v_club_category IN 
        SELECT cc.id, cc.club_id, cc.max_teams, c.name as club_name
        FROM club_categories cc
        JOIN clubs c ON c.id = cc.club_id
        WHERE cc.is_active = true
    LOOP
        RAISE NOTICE 'Processing club_category for club: % (max_teams: %)', v_club_category.club_name, v_club_category.max_teams;
        
        -- Generate teams based on max_teams
        FOR v_i IN 1..v_club_category.max_teams LOOP
            v_team_suffix := v_suffixes[v_i];
            
            INSERT INTO club_category_teams (club_category_id, team_suffix, is_active)
            VALUES (v_club_category.id, v_team_suffix, true)
            ON CONFLICT (club_category_id, team_suffix) DO NOTHING;
            
            RAISE NOTICE '  Created team % for club %', v_team_suffix, v_club_category.club_name;
        END LOOP;
    END LOOP;
    
    -- Clean up temporary table
    DROP TABLE IF EXISTS temp_team_club_mapping;
    
    RAISE NOTICE 'Population completed!';
    RAISE NOTICE 'Final state:';
    RAISE NOTICE '  - Total club_category_teams: %', (SELECT COUNT(*) FROM club_category_teams);
    
END $$;

-- Step 2: Migrate team IDs from old teams to new club_category_teams
DO $$ 
DECLARE
    orphaned_matches_count INTEGER;
    team_id UUID;
    new_team_id UUID;
    team_name TEXT;
    club_name TEXT;
    team_suffix_var TEXT;
    migrated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== STEP 2: MIGRATING TEAM IDS ===';
    RAISE NOTICE 'Starting data migration to preserve all match data...';
    
    -- Debug: Show what we''re working with
    RAISE NOTICE 'Current state:';
    RAISE NOTICE '  - Total matches: %', (SELECT COUNT(*) FROM matches);
    RAISE NOTICE '  - Total teams (old structure): %', (SELECT COUNT(*) FROM teams);
    RAISE NOTICE '  - Total club_category_teams (new structure): %', (SELECT COUNT(*) FROM club_category_teams);
    RAISE NOTICE '  - Total clubs: %', (SELECT COUNT(*) FROM clubs);
    
    -- Count orphaned matches
    SELECT COUNT(*) INTO orphaned_matches_count
    FROM matches m 
    WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.home_team_id)
       OR NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.away_team_id);
    
    RAISE NOTICE 'Found % matches that need team ID migration', orphaned_matches_count;
    
    -- Process each orphaned match individually
    FOR team_id IN 
        SELECT DISTINCT home_team_id FROM matches m 
        WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.home_team_id)
        UNION
        SELECT DISTINCT away_team_id FROM matches m 
        WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.away_team_id)
    LOOP
        -- Get team details
        SELECT t.name, c.name, 
               CASE 
                   WHEN t.name LIKE '%% A' THEN 'A'
                   WHEN t.name LIKE '%% B' THEN 'B'
                   WHEN t.name LIKE '%% C' THEN 'C'
                   WHEN t.name LIKE '%% D' THEN 'D'
                   WHEN t.name LIKE '%% E' THEN 'E'
                   ELSE 'A'
               END
        INTO team_name, club_name, team_suffix_var
        FROM teams t
        LEFT JOIN clubs c ON c.name = 
            CASE 
                WHEN t.name LIKE '%% A' THEN REPLACE(t.name, ' A', '')
                WHEN t.name LIKE '%% B' THEN REPLACE(t.name, ' B', '')
                WHEN t.name LIKE '%% C' THEN REPLACE(t.name, ' C', '')
                WHEN t.name LIKE '%% D' THEN REPLACE(t.name, ' D', '')
                WHEN t.name LIKE '%% E' THEN REPLACE(t.name, ' E', '')
                ELSE t.name
            END
        WHERE t.id = team_id;
        
        RAISE NOTICE 'Processing team: % (ID: %) -> Club: %, Suffix: %', team_name, team_id, club_name, team_suffix_var;
        
        -- Find corresponding club_category_teams entry
        SELECT cct.id INTO new_team_id
        FROM club_category_teams cct
        JOIN club_categories cc ON cc.id = cct.club_category_id
        JOIN clubs c2 ON c2.id = cc.club_id
        WHERE c2.name = COALESCE(club_name, 'Unknown Club')
          AND cct.team_suffix = team_suffix_var
        LIMIT 1;
        
        IF new_team_id IS NOT NULL THEN
            -- Update all matches using this team
            UPDATE matches SET home_team_id = new_team_id WHERE home_team_id = team_id;
            UPDATE matches SET away_team_id = new_team_id WHERE away_team_id = team_id;
            migrated_count := migrated_count + 1;
            RAISE NOTICE '✅ Migrated team % to new ID %', team_id, new_team_id;
        ELSE
            RAISE NOTICE '⚠️ Could not find new team for % (Club: %, Suffix: %)', team_name, club_name, team_suffix_var;
            RAISE NOTICE '  Looking for: club_name="%", team_suffix="%"', club_name, team_suffix_var;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Processed % teams', migrated_count;
    
    -- Verify migration
    SELECT COUNT(*) INTO orphaned_matches_count
    FROM matches m 
    WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.home_team_id)
       OR NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.away_team_id);
    
    IF orphaned_matches_count > 0 THEN
        RAISE NOTICE '⚠️ Warning: % matches still have invalid team references after migration', orphaned_matches_count;
        RAISE NOTICE 'These may need manual review or the teams may not exist in the new structure';
    ELSE
        RAISE NOTICE '✅ All matches successfully migrated to new team structure';
    END IF;
    
END $$;

-- Step 3: Add foreign key constraints
DO $$ 
BEGIN
    RAISE NOTICE '=== STEP 3: ADDING FOREIGN KEY CONSTRAINTS ===';
    
    -- Drop existing foreign key constraints if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_home_team_id_fkey'
    ) THEN
        ALTER TABLE matches DROP CONSTRAINT matches_home_team_id_fkey;
        RAISE NOTICE 'Dropped existing matches_home_team_id_fkey constraint';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_away_team_id_fkey'
    ) THEN
        ALTER TABLE matches DROP CONSTRAINT matches_away_team_id_fkey;
        RAISE NOTICE 'Dropped existing matches_away_team_id_fkey constraint';
    END IF;
    
    -- Add new foreign key constraints to club_category_teams
    ALTER TABLE matches 
    ADD CONSTRAINT matches_home_team_id_fkey 
    FOREIGN KEY (home_team_id) REFERENCES club_category_teams(id);
    RAISE NOTICE 'Added matches_home_team_id_fkey constraint to club_category_teams';
    
    ALTER TABLE matches 
    ADD CONSTRAINT matches_away_team_id_fkey 
    FOREIGN KEY (away_team_id) REFERENCES club_category_teams(id);
    RAISE NOTICE 'Added matches_away_team_id_fkey constraint to club_category_teams';
    
END $$;

-- Step 4: Final verification
DO $$ 
BEGIN
    RAISE NOTICE '=== STEP 4: FINAL VERIFICATION ===';
    
    -- Verify the new constraints
    RAISE NOTICE 'Verifying new foreign key constraints...';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_home_team_id_fkey'
    ) THEN
        RAISE NOTICE '✅ matches_home_team_id_fkey constraint exists';
    ELSE
        RAISE NOTICE '❌ matches_home_team_id_fkey constraint missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_away_team_id_fkey'
    ) THEN
        RAISE NOTICE '✅ matches_away_team_id_fkey constraint exists';
    ELSE
        RAISE NOTICE '❌ matches_away_team_id_fkey constraint missing';
    END IF;
    
    -- Verify no orphaned data remains
    RAISE NOTICE 'Verifying no orphaned data remains...';
    RAISE NOTICE 'Matches with invalid home_team_id: %', (
        SELECT COUNT(*) FROM matches m 
        WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.home_team_id)
    );
    RAISE NOTICE 'Matches with invalid away_team_id: %', (
        SELECT COUNT(*) FROM matches m 
        WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.away_team_id)
    );
    
    -- Show final table structure
    RAISE NOTICE 'Final matches table structure:';
    RAISE NOTICE 'home_team_id references: %', (
        SELECT tc.table_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'matches' AND ccu.column_name = 'home_team_id'
    );
    RAISE NOTICE 'away_team_id references: %', (
        SELECT tc.table_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'matches' AND ccu.column_name = 'away_team_id'
    );
    
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
END $$;
