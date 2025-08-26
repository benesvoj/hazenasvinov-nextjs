-- Fix Orphaned Team IDs
-- This script handles matches with team IDs that don't exist anywhere
-- These are corrupted matches that need to be either fixed or removed

DO $$
DECLARE
    v_match RECORD;
    v_orphaned_matches INTEGER := 0;
    v_fixed_matches INTEGER := 0;
    v_deleted_matches INTEGER := 0;
    v_orphaned_team_ids UUID[] := ARRAY[
        '70671e85-bda0-4e27-80c8-878edf6cff57'::UUID,
        '29043dde-dd16-40fc-b418-ab81ff490245'::UUID,
        '4f2c31c2-4840-4d4d-8e86-c2735ab00716'::UUID,
        '53540e71-ba5e-4e33-adbb-2a70da9deec5'::UUID,
        '2f4b0208-a2b2-4712-b87d-a56d1674da01'::UUID
    ];
    v_team_id UUID;
    v_default_team_id UUID;
    v_default_away_team_id UUID;
BEGIN
    RAISE NOTICE '=== FIXING ORPHANED TEAM IDS ===';
    RAISE NOTICE 'Found % orphaned team IDs that don''t exist anywhere', array_length(v_orphaned_team_ids, 1);
    RAISE NOTICE '';
    
    -- Get default team IDs to use as replacements
    -- We'll use the first available teams from club_category_teams
    SELECT id INTO v_default_team_id 
    FROM club_category_teams 
    LIMIT 1;
    
    SELECT id INTO v_default_away_team_id 
    FROM club_category_teams 
    WHERE id != v_default_team_id 
    LIMIT 1;
    
    IF v_default_team_id IS NULL OR v_default_away_team_id IS NULL THEN
        RAISE NOTICE '❌ ERROR: No teams found in club_category_teams table';
        RAISE NOTICE 'Cannot proceed with fix - need at least 2 teams for replacement';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Default replacement teams:';
    RAISE NOTICE '- Home team ID: %', v_default_team_id;
    RAISE NOTICE '- Away team ID: %', v_default_away_team_id;
    RAISE NOTICE '';
    
    -- Find all matches that use these orphaned team IDs
    FOR v_match IN 
        SELECT id, home_team_id, away_team_id, category_id, season_id, created_at
        FROM matches 
        WHERE home_team_id = ANY(v_orphaned_team_ids)
           OR away_team_id = ANY(v_orphaned_team_ids)
        ORDER BY created_at DESC
    LOOP
        v_orphaned_matches := v_orphaned_matches + 1;
        RAISE NOTICE 'Processing orphaned match % (ID: %)', v_orphaned_matches, v_match.id;
        RAISE NOTICE '  Home team ID: % (orphaned: %)', 
            v_match.home_team_id, 
            CASE WHEN v_match.home_team_id = ANY(v_orphaned_team_ids) THEN 'YES' ELSE 'NO' END;
        RAISE NOTICE '  Away team ID: % (orphaned: %)', 
            v_match.away_team_id, 
            CASE WHEN v_match.away_team_id = ANY(v_orphaned_team_ids) THEN 'YES' ELSE 'NO' END;
        
        -- Check if this match has any valid data worth preserving
        IF v_match.category_id IS NOT NULL AND v_match.season_id IS NOT NULL THEN
            RAISE NOTICE '  ✅ Match has valid category and season - attempting to fix';
            
            -- Fix home_team_id if it's orphaned
            IF v_match.home_team_id = ANY(v_orphaned_team_ids) THEN
                UPDATE matches 
                SET home_team_id = v_default_team_id,
                    updated_at = NOW()
                WHERE id = v_match.id;
                RAISE NOTICE '    Fixed home_team_id: % -> %', v_match.home_team_id, v_default_team_id;
            END IF;
            
            -- Fix away_team_id if it's orphaned
            IF v_match.away_team_id = ANY(v_orphaned_team_ids) THEN
                UPDATE matches 
                SET away_team_id = v_default_away_team_id,
                    updated_at = NOW()
                WHERE id = v_match.id;
                RAISE NOTICE '    Fixed away_team_id: % -> %', v_match.away_team_id, v_default_away_team_id;
            END IF;
            
            v_fixed_matches := v_fixed_matches + 1;
            RAISE NOTICE '    ✅ Match fixed successfully';
        ELSE
            RAISE NOTICE '  ❌ Match missing category or season - deleting corrupted match';
            
            -- Delete the corrupted match
            DELETE FROM matches WHERE id = v_match.id;
            v_deleted_matches := v_deleted_matches + 1;
            RAISE NOTICE '    🗑️  Match deleted';
        END IF;
        
        RAISE NOTICE '';
    END LOOP;
    
    -- Final verification
    RAISE NOTICE '=== FIX COMPLETED ===';
    RAISE NOTICE 'Orphaned matches processed: %', v_orphaned_matches;
    RAISE NOTICE 'Matches fixed: %', v_fixed_matches;
    RAISE NOTICE 'Matches deleted: %', v_deleted_matches;
    
    -- Check if any orphaned team IDs remain
    RAISE NOTICE '';
    RAISE NOTICE 'Final verification - checking for remaining orphaned team IDs:';
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
    RAISE NOTICE '- Total matches: %', (SELECT COUNT(*) FROM matches);
    RAISE NOTICE '- Matches with invalid home_team_id: %', (
        SELECT COUNT(*) FROM matches m 
        WHERE m.home_team_id NOT IN (SELECT id FROM club_category_teams)
    );
    RAISE NOTICE '- Matches with invalid away_team_id: %', (
        SELECT COUNT(*) FROM matches m 
        WHERE m.away_team_id NOT IN (SELECT id FROM club_category_teams)
    );
    
    IF v_fixed_matches > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  IMPORTANT: % matches were fixed with default team IDs', v_fixed_matches;
        RAISE NOTICE 'These matches now use placeholder teams and should be manually reviewed';
        RAISE NOTICE 'Consider updating them with the correct teams based on match context';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Orphaned team ID fix completed!';
    
END $$;
