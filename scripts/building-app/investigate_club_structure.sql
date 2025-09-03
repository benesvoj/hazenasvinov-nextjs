-- Investigate current club structure to understand what's missing
-- Run this to see the current state before fixing

DO $$ 
DECLARE
    v_club RECORD;
    v_club_category RECORD;
    v_team RECORD;
BEGIN
    RAISE NOTICE '=== INVESTIGATING CURRENT CLUB STRUCTURE ===';
    
    -- Show all clubs
    RAISE NOTICE 'All clubs:';
    FOR v_club IN SELECT id, name, is_active FROM clubs ORDER BY name LOOP
        RAISE NOTICE '  - % (ID: %, Active: %)', v_club.name, v_club.id, v_club.is_active;
    END LOOP;
    
    -- Show existing club_categories
    RAISE NOTICE '';
    RAISE NOTICE 'Existing club_categories:';
    FOR v_club_category IN 
        SELECT cc.id, c.name as club_name, cat.name as category_name, s.name as season_name, cc.max_teams
        FROM club_categories cc
        JOIN clubs c ON c.id = cc.club_id
        JOIN categories cat ON cc.category_id = cat.id
        JOIN seasons s ON cc.season_id = s.id
        ORDER BY c.name, cat.name
    LOOP
        RAISE NOTICE '  - %: % in % - % (max_teams: %)', 
                    v_club_category.club_name, 
                    v_club_category.category_name,
                    v_club_category.season_name,
                    v_club_category.max_teams;
    END LOOP;
    
    -- Show existing club_category_teams
    RAISE NOTICE '';
    RAISE NOTICE 'Existing club_category_teams:';
    FOR v_team IN 
        SELECT cct.id, c.name as club_name, cat.name as category_name, s.name as season_name, cct.team_suffix
        FROM club_category_teams cct
        JOIN club_categories cc ON cct.club_category_id = cc.id
        JOIN clubs c ON cc.club_id = c.id
        JOIN categories cat ON cc.category_id = cat.id
        JOIN seasons s ON cc.season_id = s.id
        ORDER BY c.name, cat.name, cct.team_suffix
    LOOP
        RAISE NOTICE '  - %: % in % - % (Suffix: %)', 
                    v_team.club_name, 
                    v_team.category_name,
                    v_team.season_name,
                    v_team.team_suffix;
    END LOOP;
    
    -- Show teams that need club_categories (simplified without LIKE patterns)
    RAISE NOTICE '';
    RAISE NOTICE 'Teams that need club_categories:';
    FOR v_team IN 
        SELECT DISTINCT t.name as team_name, c.name as club_name
        FROM teams t
        LEFT JOIN clubs c ON c.name = t.name
        WHERE c.id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM club_categories cc 
            WHERE cc.club_id = c.id
        )
        ORDER BY c.name
    LOOP
        RAISE NOTICE '  - % (Club: %)', v_team.team_name, v_team.club_name;
    END LOOP;
    
    -- Show summary
    RAISE NOTICE '';
    RAISE NOTICE '=== SUMMARY ===';
    RAISE NOTICE 'Total clubs: %', (SELECT COUNT(*) FROM clubs);
    RAISE NOTICE 'Clubs with categories: %', (SELECT COUNT(DISTINCT club_id) FROM club_categories);
    RAISE NOTICE 'Total club_categories: %', (SELECT COUNT(*) FROM club_categories);
    RAISE NOTICE 'Total club_category_teams: %', (SELECT COUNT(*) FROM club_category_teams);
    
END $$;
