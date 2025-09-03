-- Fix Remaining Matches Migration
-- This script targets the specific matches that still have old team IDs
-- Run this after the main migration to clean up any remaining inconsistencies

DO $$
DECLARE
    v_match RECORD;
    v_old_team_id UUID;
    v_new_team_id UUID;
    v_club_name TEXT;
    v_team_suffix TEXT;
    v_matches_processed INTEGER := 0;
    v_matches_fixed INTEGER := 0;
    v_matches_failed INTEGER := 0;
BEGIN
    RAISE NOTICE '=== FIXING REMAINING MATCHES MIGRATION ===';
    
    -- Check current state
    RAISE NOTICE 'Current state:';
    RAISE NOTICE '- Total matches: %', (SELECT COUNT(*) FROM matches);
    RAISE NOTICE '- Matches with old team IDs: %', (
        SELECT COUNT(*) FROM matches m 
        WHERE m.home_team_id NOT IN (SELECT id FROM club_category_teams)
           OR m.away_team_id NOT IN (SELECT id FROM club_category_teams)
    );
    
    -- Process matches that still have old team IDs
    FOR v_match IN 
        SELECT DISTINCT m.id, m.home_team_id, m.away_team_id
        FROM matches m
        WHERE m.home_team_id NOT IN (SELECT id FROM club_category_teams)
           OR m.away_team_id NOT IN (SELECT id FROM club_category_teams)
    LOOP
        v_matches_processed := v_matches_processed + 1;
        RAISE NOTICE 'Processing match % (ID: %)', v_matches_processed, v_match.id;
        
        -- Fix home_team_id if it's old
        IF v_match.home_team_id NOT IN (SELECT id FROM club_category_teams) THEN
            v_old_team_id := v_match.home_team_id;
            
            -- Get team info from old teams table
            SELECT t.name, t.club_name, t.team_suffix 
            INTO v_club_name, v_club_name, v_team_suffix
            FROM teams t 
            WHERE t.id = v_old_team_id;
            
            IF v_club_name IS NOT NULL THEN
                -- Find corresponding new team in club_category_teams
                SELECT cct.id INTO v_new_team_id
                FROM club_category_teams cct
                JOIN club_categories cc ON cct.club_category_id = cc.id
                JOIN clubs c ON cc.club_id = c.id
                WHERE c.name = v_club_name 
                  AND cct.team_suffix = COALESCE(v_team_suffix, 'A')
                LIMIT 1;
                
                IF v_new_team_id IS NOT NULL THEN
                    -- Update the match
                    UPDATE matches 
                    SET home_team_id = v_new_team_id,
                        updated_at = NOW()
                    WHERE id = v_match.id;
                    
                    RAISE NOTICE '  ✅ Fixed home_team_id: % -> % (Club: %, Suffix: %)', 
                        v_old_team_id, v_new_team_id, v_club_name, COALESCE(v_team_suffix, 'A');
                    v_matches_fixed := v_matches_fixed + 1;
                ELSE
                    RAISE NOTICE '  ❌ Could not find new team for home_team_id % (Club: %, Suffix: %)', 
                        v_old_team_id, v_club_name, COALESCE(v_team_suffix, 'A');
                    v_matches_failed := v_matches_failed + 1;
                END IF;
            ELSE
                RAISE NOTICE '  ❌ Could not find old team info for home_team_id %', v_old_team_id;
                v_matches_failed := v_matches_failed + 1;
            END IF;
        END IF;
        
        -- Fix away_team_id if it's old
        IF v_match.away_team_id NOT IN (SELECT id FROM club_category_teams) THEN
            v_old_team_id := v_match.away_team_id;
            
            -- Get team info from old teams table
            SELECT t.name, t.club_name, t.team_suffix 
            INTO v_club_name, v_club_name, v_team_suffix
            FROM teams t 
            WHERE t.id = v_old_team_id;
            
            IF v_club_name IS NOT NULL THEN
                -- Find corresponding new team in club_category_teams
                SELECT cct.id INTO v_new_team_id
                FROM club_category_teams cct
                JOIN club_categories cc ON cct.club_category_id = cc.id
                JOIN clubs c ON cc.club_id = c.id
                WHERE c.name = v_club_name 
                  AND cct.team_suffix = COALESCE(v_team_suffix, 'A')
                LIMIT 1;
                
                IF v_new_team_id IS NOT NULL THEN
                    -- Update the match
                    UPDATE matches 
                    SET away_team_id = v_new_team_id,
                        updated_at = NOW()
                    WHERE id = v_match.id;
                    
                    RAISE NOTICE '  ✅ Fixed away_team_id: % -> % (Club: %, Suffix: %)', 
                        v_old_team_id, v_new_team_id, v_club_name, COALESCE(v_team_suffix, 'A');
                    v_matches_fixed := v_matches_fixed + 1;
                ELSE
                    RAISE NOTICE '  ❌ Could not find new team for away_team_id % (Club: %, Suffix: %)', 
                        v_old_team_id, v_club_name, COALESCE(v_team_suffix, 'A');
                    v_matches_failed := v_matches_failed + 1;
                END IF;
            ELSE
                RAISE NOTICE '  ❌ Could not find old team info for away_team_id %', v_old_team_id;
                v_matches_failed := v_matches_failed + 1;
            END IF;
        END IF;
    END LOOP;
    
    -- Final verification
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION COMPLETED ===';
    RAISE NOTICE 'Matches processed: %', v_matches_processed;
    RAISE NOTICE 'Matches fixed: %', v_matches_fixed;
    RAISE NOTICE 'Matches failed: %', v_matches_failed;
    
    -- Check final state
    RAISE NOTICE '';
    RAISE NOTICE 'Final verification:';
    RAISE NOTICE '- Matches with old team IDs: %', (
        SELECT COUNT(*) FROM matches m 
        WHERE m.home_team_id NOT IN (SELECT id FROM club_category_teams)
           OR m.away_team_id NOT IN (SELECT id FROM club_category_teams)
    );
    
    IF v_matches_failed > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  WARNING: % matches could not be migrated automatically', v_matches_failed;
        RAISE NOTICE 'These may need manual review or the teams may not exist in the new structure';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration fix completed!';
    
END $$;
