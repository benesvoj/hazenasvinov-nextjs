-- Fix Match Team IDs Script
-- This script allows you to update team IDs in matches for specific categories
-- Use this when you need to correct team references after database migrations or data fixes

DO $$
DECLARE
    -- Configuration variables - modify these as needed
    v_category_id UUID := '5b0e437a-b815-4a37-a41d-088566637c7d'; -- Replace with your category ID
    v_old_team_id UUID := '102a7408-b2c5-4a09-80d5-f76771ea4c3e'; -- Replace with old team ID
    v_new_team_id UUID := '2fbd366c-f375-40bb-a177-fd4c4a80a09e'; -- Replace with new team ID
    
    -- Internal variables
    v_matches_updated INTEGER := 0;
    v_home_team_updates INTEGER := 0;
    v_away_team_updates INTEGER := 0;
    v_match RECORD;
BEGIN
    RAISE NOTICE '=== FIXING MATCH TEAM IDS ===';
    RAISE NOTICE 'Category ID: %', v_category_id;
    RAISE NOTICE 'Old Team ID: %', v_old_team_id;
    RAISE NOTICE 'New Team ID: %', v_new_team_id;
    RAISE NOTICE '';
    
    -- Validate that the new team ID exists
    IF NOT EXISTS(SELECT 1 FROM club_category_teams WHERE id = v_new_team_id) THEN
        RAISE EXCEPTION 'New team ID % does not exist in club_category_teams table', v_new_team_id;
    END IF;
    
    -- Validate that the category ID exists
    IF NOT EXISTS(SELECT 1 FROM categories WHERE id = v_category_id) THEN
        RAISE EXCEPTION 'Category ID % does not exist', v_category_id;
    END IF;
    
    -- Show current state
    RAISE NOTICE 'Current matches with old team ID %:', v_old_team_id;
    FOR v_match IN 
        SELECT id, date, time, home_team_id, away_team_id, category_id
        FROM matches 
        WHERE (home_team_id = v_old_team_id OR away_team_id = v_old_team_id)
          AND category_id = v_category_id
        ORDER BY date DESC
    LOOP
        RAISE NOTICE '  Match %: % % (Home: %, Away: %)', 
            v_match.id, 
            v_match.date, 
            v_match.time,
            v_match.home_team_id,
            v_match.away_team_id;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Starting team ID updates...';
    
    -- Update home_team_id
    UPDATE matches 
    SET home_team_id = v_new_team_id,
        updated_at = NOW()
    WHERE category_id = v_category_id 
      AND home_team_id = v_old_team_id;
    
    GET DIAGNOSTICS v_home_team_updates = ROW_COUNT;
    
    -- Update away_team_id
    UPDATE matches 
    SET away_team_id = v_new_team_id,
        updated_at = NOW()
    WHERE category_id = v_category_id 
      AND away_team_id = v_old_team_id;
    
    GET DIAGNOSTICS v_away_team_updates = ROW_COUNT;
    
    v_matches_updated := v_home_team_updates + v_away_team_updates;
    
    -- Show results
    RAISE NOTICE '';
    RAISE NOTICE '=== UPDATE COMPLETED ===';
    RAISE NOTICE 'Home team updates: %', v_home_team_updates;
    RAISE NOTICE 'Away team updates: %', v_away_team_updates;
    RAISE NOTICE 'Total matches updated: %', v_matches_updated;
    
    -- Verify the updates
    RAISE NOTICE '';
    RAISE NOTICE 'Verification - checking for remaining old team IDs:';
    
    IF EXISTS(SELECT 1 FROM matches WHERE home_team_id = v_old_team_id OR away_team_id = v_old_team_id) THEN
        RAISE NOTICE '  ⚠️  WARNING: Some matches still reference the old team ID %', v_old_team_id;
        
        FOR v_match IN 
            SELECT id, date, time, home_team_id, away_team_id, category_id
            FROM matches 
            WHERE (home_team_id = v_old_team_id OR away_team_id = v_old_team_id)
            ORDER BY date DESC
            LIMIT 5
        LOOP
            RAISE NOTICE '    Match %: % % (Home: %, Away: %)', 
                v_match.id, 
                v_match.date, 
                v_match.time,
                v_match.home_team_id,
                v_match.away_team_id;
        END LOOP;
        
        IF (SELECT COUNT(*) FROM matches WHERE home_team_id = v_old_team_id OR away_team_id = v_old_team_id) > 5 THEN
            RAISE NOTICE '    ... and % more matches', 
                (SELECT COUNT(*) FROM matches WHERE home_team_id = v_old_team_id OR away_team_id = v_old_team_id) - 5;
        END IF;
    ELSE
        RAISE NOTICE '  ✅ SUCCESS: No matches reference the old team ID %', v_old_team_id;
    END IF;
    
    -- Show new team ID usage
    RAISE NOTICE '';
    RAISE NOTICE 'New team ID % usage after update:', v_new_team_id;
    FOR v_match IN 
        SELECT id, date, time, home_team_id, away_team_id, category_id
        FROM matches 
        WHERE (home_team_id = v_new_team_id OR away_team_id = v_new_team_id)
          AND category_id = v_category_id
        ORDER BY date DESC
        LIMIT 5
    LOOP
        RAISE NOTICE '  Match %: % % (Home: %, Away: %)', 
            v_match.id, 
            v_match.date, 
            v_match.time,
            v_match.home_team_id,
            v_match.away_team_id;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Team ID fix completed successfully!';
    
END $$;
