-- Investigate Specific Old Team IDs
-- This script investigates the 5 old team IDs found by the match integrity check
-- Run this to understand what teams these IDs represent and why they weren't migrated

DO $$
DECLARE
    v_old_team_id UUID;
    v_old_team RECORD;
    v_new_team RECORD;
    v_matches_count INTEGER;
    v_club_category_count INTEGER;
BEGIN
    RAISE NOTICE '=== INVESTIGATING OLD TEAM IDS ===';
    RAISE NOTICE 'Old team IDs found by integrity check:';
    RAISE NOTICE '- 70671e85-bda0-4e27-80c8-878edf6cff57';
    RAISE NOTICE '- 29043dde-dd16-40fc-b418-ab81ff490245';
    RAISE NOTICE '- 4f2c31c2-4840-4d4d-8e86-c2735ab00716';
    RAISE NOTICE '- 53540e71-ba5e-4e33-adbb-2a70da9deec5';
    RAISE NOTICE '- 2f4b0208-a2b2-4712-b87d-a56d1674da01';
    RAISE NOTICE '';
    
    -- Investigate each old team ID
    FOR v_old_team_id IN 
        SELECT unnest(ARRAY[
            '70671e85-bda0-4e27-80c8-878edf6cff57'::UUID,
            '29043dde-dd16-40fc-b418-ab81ff490245'::UUID,
            '4f2c31c2-4840-4d4d-8e86-c2735ab00716'::UUID,
            '53540e71-ba5e-4e33-adbb-2a70da9deec5'::UUID,
            '2f4b0208-a2b2-4712-b87d-a56d1674da01'::UUID
        ])
    LOOP
        RAISE NOTICE '--- Investigating Team ID: % ---', v_old_team_id;
        
        -- Get old team information
        SELECT * INTO v_old_team FROM teams WHERE id = v_old_team_id;
        
        IF v_old_team IS NOT NULL THEN
            RAISE NOTICE 'Old team found:';
            RAISE NOTICE '  Name: %', v_old_team.name;
            RAISE NOTICE '  Club name: %', v_old_team.club_name;
            RAISE NOTICE '  Team suffix: %', COALESCE(v_old_team.team_suffix, 'N/A');
            RAISE NOTICE '  Created: %', v_old_team.created_at;
            
            -- Count matches using this team ID
            SELECT COUNT(*) INTO v_matches_count 
            FROM matches 
            WHERE home_team_id = v_old_team_id OR away_team_id = v_old_team_id;
            
            RAISE NOTICE '  Matches using this team: %', v_matches_count;
            
            -- Check if club exists in new structure
            IF v_old_team.club_name IS NOT NULL THEN
                RAISE NOTICE '  Checking new structure for club: %', v_old_team.club_name;
                
                -- Count club_categories for this club
                SELECT COUNT(*) INTO v_club_category_count
                FROM club_categories cc
                JOIN clubs c ON cc.club_id = c.id
                WHERE c.name = v_old_team.club_name;
                
                RAISE NOTICE '  Club_categories found: %', v_club_category_count;
                
                -- Check if corresponding new team exists
                SELECT cct.id, cct.team_suffix, cc.max_teams, c.name as club_name
                INTO v_new_team
                FROM club_category_teams cct
                JOIN club_categories cc ON cct.club_category_id = cc.id
                JOIN clubs c ON cc.club_id = c.id
                WHERE c.name = v_old_team.club_name 
                  AND cct.team_suffix = COALESCE(v_old_team.team_suffix, 'A')
                LIMIT 1;
                
                IF v_new_team IS NOT NULL THEN
                    RAISE NOTICE '  ✅ New team found:';
                    RAISE NOTICE '    ID: %', v_new_team.id;
                    RAISE NOTICE '    Club: %', v_new_team.club_name;
                    RAISE NOTICE '    Suffix: %', v_new_team.team_suffix;
                    RAISE NOTICE '    Max teams: %', v_new_team.max_teams;
                ELSE
                    RAISE NOTICE '  ❌ No new team found for club: %', v_old_team.club_name;
                    
                    -- Show available clubs with similar names
                    RAISE NOTICE '  Available clubs (partial matches):';
                    FOR v_new_team IN 
                        SELECT c.id, c.name, c.short_name
                        FROM clubs c
                        WHERE c.name ILIKE '%%' || v_old_team.club_name || '%%'
                           OR v_old_team.club_name ILIKE '%%' || c.name || '%%'
                        LIMIT 5
                    LOOP
                        RAISE NOTICE '    - % (ID: %)', v_new_team.name, v_new_team.id;
                    END LOOP;
                END IF;
            ELSE
                RAISE NOTICE '  ❌ No club_name found for this team';
            END IF;
        ELSE
            RAISE NOTICE '❌ Team ID not found in old teams table';
        END IF;
        
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE '=== INVESTIGATION COMPLETE ===';
    RAISE NOTICE 'This information should help identify why these teams were not migrated';
    RAISE NOTICE 'Common issues:';
    RAISE NOTICE '1. Club name mismatch between old and new structure';
    RAISE NOTICE '2. Missing club_categories entries';
    RAISE NOTICE '3. Team suffix differences';
    RAISE NOTICE '4. Data inconsistencies in old teams table';
    
END $$;
