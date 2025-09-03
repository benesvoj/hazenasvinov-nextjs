-- Update matches table foreign key relationships
-- This script updates the matches table to use the new club_category_teams structure

-- First, let's check the current structure and data
DO $$ 
BEGIN
    RAISE NOTICE 'Current matches table structure:';
    RAISE NOTICE 'home_team_id column type: %', (
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'home_team_id'
    );
    RAISE NOTICE 'away_team_id column type: %', (
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'away_team_id'
    );
    
    -- Check how many matches exist
    RAISE NOTICE 'Total matches: %', (SELECT COUNT(*) FROM matches);
    
    -- Check for orphaned team references
    RAISE NOTICE 'Matches with home_team_id not in club_category_teams: %', (
        SELECT COUNT(*) FROM matches m 
        WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.home_team_id)
    );
    
    RAISE NOTICE 'Matches with away_team_id not in club_category_teams: %', (
        SELECT COUNT(*) FROM matches m 
        WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.away_team_id)
    );
END $$;

-- Check if foreign key constraints exist
DO $$ 
BEGIN
    RAISE NOTICE 'Checking existing foreign key constraints...';
    
    -- Check for home_team_id constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_home_team_id_fkey'
    ) THEN
        RAISE NOTICE 'Found existing home_team_id foreign key constraint';
    ELSE
        RAISE NOTICE 'No home_team_id foreign key constraint found';
    END IF;
    
    -- Check for away_team_id constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_away_team_id_fkey'
    ) THEN
        RAISE NOTICE 'Found existing away_team_id foreign key constraint';
    ELSE
        RAISE NOTICE 'No away_team_id foreign key constraint found';
    END IF;
END $$;

-- Handle existing data before adding constraints - PRESERVE ALL DATA
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
    RAISE NOTICE 'Starting data migration to preserve all match data...';
    
    -- Debug: Show what we're working with
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
    
    -- Step 1: Process each orphaned match individually
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
                   WHEN t.name LIKE '% A' THEN 'A'
                   WHEN t.name LIKE '% B' THEN 'B'
                   WHEN t.name LIKE '% C' THEN 'C'
                   WHEN t.name LIKE '% D' THEN 'D'
                   WHEN t.name LIKE '% E' THEN 'E'
                   ELSE 'A'
               END
        INTO team_name, club_name, team_suffix_var
        FROM teams t
        LEFT JOIN clubs c ON c.name = 
            CASE 
                WHEN t.name LIKE '% A' THEN REPLACE(t.name, ' A', '')
                WHEN t.name LIKE '% B' THEN REPLACE(t.name, ' B', '')
                WHEN t.name LIKE '% C' THEN REPLACE(t.name, ' C', '')
                WHEN t.name LIKE '% D' THEN REPLACE(t.name, ' D', '')
                WHEN t.name LIKE '% E' THEN REPLACE(t.name, ' E', '')
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
            -- Show what we're looking for
            RAISE NOTICE '  Looking for: club_name="%", team_suffix="%"', club_name, team_suffix_var;
            -- Show available options
            RAISE NOTICE '  Available club_category_teams:';
            FOR new_team_id IN 
                SELECT cct.id, c2.name, cct.team_suffix, cc.category_id
                FROM club_category_teams cct
                JOIN club_categories cc ON cc.id = cct.club_category_id
                JOIN clubs c2 ON c2.id = cc.club_id
                WHERE c2.name = COALESCE(club_name, 'Unknown Club')
                LIMIT 5
            LOOP
                RAISE NOTICE '    - ID: %, Club: %, Suffix: %, Category: %', new_team_id.id, new_team_id.name, new_team_id.team_suffix, new_team_id.category_id;
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Processed % teams', migrated_count;
    
    -- Step 2: Verify migration
    SELECT COUNT(*) INTO orphaned_matches_count
    FROM matches m 
    WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.home_team_id)
       OR NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.away_team_id);
    
    IF orphaned_matches_count > 0 THEN
        RAISE NOTICE '⚠️ Warning: % matches still have invalid team references after migration', orphaned_matches_count;
        RAISE NOTICE 'These may need manual review or the teams may not exist in the new structure';
        
        -- Show details of remaining orphaned matches
        RAISE NOTICE 'Remaining orphaned team IDs:';
        FOR team_id IN 
            SELECT DISTINCT home_team_id FROM matches m 
            WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.home_team_id)
            UNION
            SELECT DISTINCT away_team_id FROM matches m 
            WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.away_team_id)
        LOOP
            SELECT name INTO team_name FROM teams WHERE id = team_id;
            RAISE NOTICE '  - Team: % (ID: %)', COALESCE(team_name, 'Unknown'), team_id;
        END LOOP;
    ELSE
        RAISE NOTICE '✅ All matches successfully migrated to new team structure';
    END IF;
    
END $$;

-- Drop existing foreign key constraints if they exist
DO $$ 
BEGIN
    -- Drop home_team_id constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_home_team_id_fkey'
    ) THEN
        ALTER TABLE matches DROP CONSTRAINT matches_home_team_id_fkey;
        RAISE NOTICE 'Dropped matches_home_team_id_fkey constraint';
    END IF;
    
    -- Drop away_team_id constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_away_team_id_fkey'
    ) THEN
        ALTER TABLE matches DROP CONSTRAINT matches_away_team_id_fkey;
        RAISE NOTICE 'Dropped matches_away_team_id_fkey constraint';
    END IF;
END $$;

-- Debug: Show what's still orphaned before trying to add constraints
DO $$ 
DECLARE
    final_check_count INTEGER;
    team_id UUID;
    team_name TEXT;
    club_name TEXT;
    team_suffix_var TEXT;
BEGIN
    RAISE NOTICE '=== FINAL DEBUGGING ===';
    
    SELECT COUNT(*) INTO final_check_count
    FROM matches m 
    WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.home_team_id)
       OR NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.id = m.away_team_id);
    
    RAISE NOTICE 'Found % matches still have invalid team references', final_check_count;
    
    IF final_check_count > 0 THEN
        RAISE NOTICE '=== DETAILS OF ORPHANED MATCHES ===';
        
        -- Show details of remaining orphaned matches
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
                       WHEN t.name LIKE '% A' THEN 'A'
                       WHEN t.name LIKE '% B' THEN 'B'
                       WHEN t.name LIKE '% C' THEN 'C'
                       WHEN t.name LIKE '% D' THEN 'D'
                       WHEN t.name LIKE '% E' THEN 'E'
                       ELSE 'A'
                   END
            INTO team_name, club_name, team_suffix_var
            FROM teams t
            LEFT JOIN clubs c ON c.name = 
                CASE 
                    WHEN t.name LIKE '% A' THEN REPLACE(t.name, ' A', '')
                    WHEN t.name LIKE '% B' THEN REPLACE(t.name, ' B', '')
                    WHEN t.name LIKE '% C' THEN REPLACE(t.name, ' C', '')
                    WHEN t.name LIKE '% D' THEN REPLACE(t.name, ' D', '')
                    WHEN t.name LIKE '% E' THEN REPLACE(t.name, ' E', '')
                    ELSE t.name
                END
            WHERE t.id = team_id;
            
            RAISE NOTICE 'Team ID: %, Name: %, Extracted Club: %, Extracted Suffix: %', 
                        team_id, team_name, club_name, team_suffix_var;
            
            -- Show what we're looking for in club_category_teams
            RAISE NOTICE '  Looking for in club_category_teams: club_name="%", team_suffix="%"', club_name, team_suffix_var;
            
            -- Show available options
            RAISE NOTICE '  Available club_category_teams:';
            FOR team_id IN 
                SELECT cct.id, c2.name, cct.team_suffix, cc.category_id
                FROM club_category_teams cct
                JOIN club_categories cc ON cc.id = cct.club_category_id
                JOIN clubs c2 ON c2.id = cc.club_id
                WHERE c2.name = COALESCE(club_name, 'Unknown Club')
                LIMIT 5
            LOOP
                RAISE NOTICE '    - ID: %, Club: %, Suffix: %, Category: %', team_id.id, team_id.name, team_id.team_suffix, team_id.category_id;
            END LOOP;
            
            RAISE NOTICE '  ---';
        END LOOP;
        
        RAISE EXCEPTION 'Cannot add foreign key constraints: % matches still have invalid team references. Check the debug output above.', final_check_count;
    END IF;
    
    RAISE NOTICE '✅ All matches verified - safe to add foreign key constraints';
END $$;

-- Add new foreign key constraints to club_category_teams
DO $$ 
BEGIN
    -- Add home_team_id constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_home_team_id_fkey'
    ) THEN
        ALTER TABLE matches 
        ADD CONSTRAINT matches_home_team_id_fkey 
        FOREIGN KEY (home_team_id) REFERENCES club_category_teams(id);
        RAISE NOTICE 'Added matches_home_team_id_fkey constraint to club_category_teams';
    END IF;
    
    -- Add away_team_id constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_away_team_id_fkey'
    ) THEN
        ALTER TABLE matches 
        ADD CONSTRAINT matches_away_team_id_fkey 
        FOREIGN KEY (away_team_id) REFERENCES club_category_teams(id);
        RAISE NOTICE 'Added matches_away_team_id_fkey constraint to club_category_teams';
    END IF;
END $$;

-- Verify the new constraints
DO $$ 
BEGIN
    RAISE NOTICE 'Verifying new foreign key constraints...';
    
    -- Check home_team_id constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_home_team_id_fkey'
    ) THEN
        RAISE NOTICE '✅ matches_home_team_id_fkey constraint exists';
    ELSE
        RAISE NOTICE '❌ matches_home_team_id_fkey constraint missing';
    END IF;
    
    -- Check away_team_id constraint
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
END $$;

-- Show final table structure
DO $$ 
BEGIN
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
END $$;