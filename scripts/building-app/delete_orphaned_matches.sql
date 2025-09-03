-- Delete Orphaned Matches
-- This script safely removes matches with team IDs that don't exist anywhere
-- This is the safest approach since these matches are completely broken

DO $$
DECLARE
    v_orphaned_team_ids UUID[] := ARRAY[
        '70671e85-bda0-4e27-80c8-878edf6cff57'::UUID,
        '29043dde-dd16-40fc-b418-ab81ff490245'::UUID,
        '4f2c31c2-4840-4d4d-8e86-c2735ab00716'::UUID,
        '53540e71-ba5e-4e33-adbb-2a70da9deec5'::UUID,
        '2f4b0208-a2b2-4712-b87d-a56d1674da01'::UUID
    ];
    v_match_count INTEGER;
    v_deleted_count INTEGER := 0;
    v_team_id UUID;
BEGIN
    RAISE NOTICE '=== DELETING ORPHANED MATCHES ===';
    RAISE NOTICE 'Found % orphaned team IDs that don''t exist anywhere', array_length(v_orphaned_team_ids, 1);
    RAISE NOTICE '';
    
    -- Count how many matches will be affected
    SELECT COUNT(*) INTO v_match_count
    FROM matches 
    WHERE home_team_id = ANY(v_orphaned_team_ids)
       OR away_team_id = ANY(v_orphaned_team_ids);
    
    RAISE NOTICE 'Matches to be deleted: %', v_match_count;
    
    IF v_match_count = 0 THEN
        RAISE NOTICE '✅ No matches found with orphaned team IDs';
        RAISE NOTICE 'No action needed';
        RETURN;
    END IF;
    
    -- Show details of matches to be deleted
    RAISE NOTICE '';
    RAISE NOTICE 'Details of matches to be deleted:';
    FOR v_team_id IN 
        SELECT unnest(v_orphaned_team_ids)
    LOOP
        RAISE NOTICE 'Team ID %:', v_team_id;
        
        -- Count matches using this team ID
        SELECT COUNT(*) INTO v_match_count
        FROM matches 
        WHERE home_team_id = v_team_id OR away_team_id = v_team_id;
        
        RAISE NOTICE '  - Used in % matches', v_match_count;
        
        -- Show sample match details
        FOR v_match IN 
            SELECT id, home_team_id, away_team_id, category_id, season_id, created_at
            FROM matches 
            WHERE home_team_id = v_team_id OR away_team_id = v_team_id
            LIMIT 3
        LOOP
            RAISE NOTICE '    Match %: home=% away=% category=% season=% created=%', 
                v_match.id, 
                v_match.home_team_id, 
                v_match.away_team_id,
                v_match.category_id,
                v_match.season_id,
                v_match.created_at;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  WARNING: These matches will be permanently deleted!';
    RAISE NOTICE 'They cannot be recovered after deletion.';
    RAISE NOTICE '';
    RAISE NOTICE 'Proceeding with deletion...';
    
    -- Delete matches with orphaned team IDs
    DELETE FROM matches 
    WHERE home_team_id = ANY(v_orphaned_team_ids)
       OR away_team_id = ANY(v_orphaned_team_ids);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Final verification
    RAISE NOTICE '';
    RAISE NOTICE '=== DELETION COMPLETED ===';
    RAISE NOTICE 'Matches deleted: %', v_deleted_count;
    
    -- Verify no orphaned team IDs remain
    RAISE NOTICE '';
    RAISE NOTICE 'Verification - checking for remaining orphaned team IDs:';
    FOR v_team_id IN 
        SELECT unnest(v_orphaned_team_ids)
    LOOP
        IF EXISTS(SELECT 1 FROM matches WHERE home_team_id = v_team_id OR away_team_id = v_team_id) THEN
            RAISE NOTICE '  ❌ Orphaned team ID % still exists in matches', v_team_id;
        ELSE
            RAISE NOTICE '  ✅ Orphaned team ID % no longer exists in matches', v_team_id;
        END IF;
    END LOOP;
    
    -- Check overall matches table health
    RAISE NOTICE '';
    RAISE NOTICE 'Overall matches table health:';
    RAISE NOTICE '- Total matches remaining: %', (SELECT COUNT(*) FROM matches);
    RAISE NOTICE '- Matches with invalid home_team_id: %', (
        SELECT COUNT(*) FROM matches m 
        WHERE m.home_team_id NOT IN (SELECT id FROM club_category_teams)
    );
    RAISE NOTICE '- Matches with invalid away_team_id: %', (
        SELECT COUNT(*) FROM matches m 
        WHERE m.away_team_id NOT IN (SELECT id FROM club_category_teams)
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Orphaned matches deletion completed!';
    RAISE NOTICE 'The matches table should now be clean and all team references should be valid.';
    
END $$;
