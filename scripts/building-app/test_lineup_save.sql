-- Test Lineup Save Functionality
-- This script tests if the lineup tables exist and can accept data

-- 1. Check if tables exist
SELECT 
    'lineups' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lineups') as exists
UNION ALL
SELECT 
    'lineup_players' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lineup_players') as exists
UNION ALL
SELECT 
    'lineup_coaches' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lineup_coaches') as exists
UNION ALL
SELECT 
    'external_players' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'external_players') as exists;

-- 2. Check table structures
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lineups') THEN
        RAISE NOTICE 'lineups table structure:';
        RAISE NOTICE 'Columns: %', (
            SELECT string_agg(column_name || ' ' || data_type, ', ')
            FROM information_schema.columns 
            WHERE table_name = 'lineups'
        );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lineup_players') THEN
        RAISE NOTICE 'lineup_players table structure:';
        RAISE NOTICE 'Columns: %', (
            SELECT string_agg(column_name || ' ' || data_type, ', ')
            FROM information_schema.columns 
            WHERE table_name = 'lineup_players'
        );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lineup_coaches') THEN
        RAISE NOTICE 'lineup_coaches table structure:';
        RAISE NOTICE 'Columns: %', (
            SELECT string_agg(column_name || ' ' || data_type, ', ')
            FROM information_schema.columns 
            WHERE table_name = 'lineup_coaches'
        );
    END IF;
END $$;

-- 3. Check for existing matches and teams
SELECT 
    'matches' as table_name,
    COUNT(*) as record_count
FROM matches
UNION ALL
SELECT 
    'teams' as table_name,
    COUNT(*) as record_count
FROM teams;

-- 4. Show sample matches with their IDs
SELECT 
    id,
    date,
    home_team_id,
    away_team_id,
    category_id,
    season_id
FROM matches 
LIMIT 5;

-- 5. Show sample teams with their IDs
SELECT 
    id,
    name,
    short_name
FROM teams 
LIMIT 5;

-- 6. Test inserting a lineup with actual existing data (if tables exist)
DO $$ 
DECLARE
    test_lineup_id TEXT;
    test_match_id TEXT;
    test_team_id TEXT;
    existing_match RECORD;
    existing_team RECORD;
BEGIN
    -- Get an existing match
    SELECT id, home_team_id INTO existing_match FROM matches LIMIT 1;
    
    IF existing_match.id IS NULL THEN
        RAISE NOTICE 'No matches found in database';
        RETURN;
    END IF;
    
    -- Get an existing team
    SELECT id INTO existing_team FROM teams LIMIT 1;
    
    IF existing_team.id IS NULL THEN
        RAISE NOTICE 'No teams found in database';
        RETURN;
    END IF;
    
    test_match_id := existing_match.id;
    test_team_id := existing_team.id;
    test_lineup_id := test_match_id || '_' || test_team_id || '_home';
    
    RAISE NOTICE 'Testing with: match_id=%, team_id=%, lineup_id=%', test_match_id, test_team_id, test_lineup_id;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lineups') THEN
        -- Try to insert a test lineup
        INSERT INTO lineups (id, match_id, team_id, is_home_team) 
        VALUES (test_lineup_id, test_match_id, test_team_id, true);
        
        RAISE NOTICE 'Successfully inserted test lineup with ID: %', test_lineup_id;
        
        -- Clean up
        DELETE FROM lineups WHERE id = test_lineup_id;
        RAISE NOTICE 'Test lineup cleaned up successfully';
    ELSE
        RAISE NOTICE 'lineups table does not exist';
    END IF;
END $$;

-- 7. Check for any existing lineup data
SELECT 
    'lineups' as table_name,
    COUNT(*) as record_count
FROM lineups
UNION ALL
SELECT 
    'lineup_players' as table_name,
    COUNT(*) as record_count
FROM lineup_players
UNION ALL
SELECT 
    'lineup_coaches' as table_name,
    COUNT(*) as record_count
FROM lineup_coaches
UNION ALL
SELECT 
    'external_players' as table_name,
    COUNT(*) as record_count
FROM external_players;

-- 8. Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('lineups', 'lineup_players', 'lineup_coaches');

-- 9. Final status
SELECT 'Lineup save test completed!' as status;
