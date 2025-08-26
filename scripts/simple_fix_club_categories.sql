-- Simple fix for missing club_categories
-- This script creates missing club_categories for clubs that don't have them

DO $$ 
DECLARE
    v_season_id UUID;
    v_category_id UUID;
    v_club RECORD;
    v_club_category RECORD;
    v_created_count INTEGER := 0;
    v_teams_created_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== FIXING MISSING CLUB CATEGORIES ===';
    
    -- Check current state
    RAISE NOTICE 'Current state:';
    RAISE NOTICE '  - Total clubs: %', (SELECT COUNT(*) FROM clubs);
    RAISE NOTICE '  - Total club_categories: %', (SELECT COUNT(*) FROM club_categories);
    RAISE NOTICE '  - Total club_category_teams: %', (SELECT COUNT(*) FROM club_category_teams);
    
    -- Get the first active season and category to create basic entries
    SELECT id INTO v_season_id FROM seasons WHERE is_active = true LIMIT 1;
    IF v_season_id IS NULL THEN
        SELECT id INTO v_season_id FROM seasons LIMIT 1;
    END IF;
    
    SELECT id INTO v_category_id FROM categories WHERE is_active = true LIMIT 1;
    IF v_category_id IS NULL THEN
        SELECT id INTO v_category_id FROM categories LIMIT 1;
    END IF;
    
    IF v_season_id IS NULL OR v_category_id IS NULL THEN
        RAISE EXCEPTION 'No seasons or categories found. Please create at least one season and category first.';
    END IF;
    
    RAISE NOTICE 'Using season ID: % and category ID: %', v_season_id, v_category_id;
    
    -- Find clubs that don't have any club_categories
    RAISE NOTICE '';
    RAISE NOTICE 'Creating missing club_categories...';
    
    FOR v_club IN 
        SELECT c.id, c.name 
        FROM clubs c 
        WHERE c.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM club_categories cc WHERE cc.club_id = c.id
        )
        ORDER BY c.name
    LOOP
        -- Create club_category entry
        INSERT INTO club_categories (club_id, category_id, season_id, max_teams, is_active)
        VALUES (v_club.id, v_category_id, v_season_id, 1, true);
        
        v_created_count := v_created_count + 1;
        RAISE NOTICE 'Created club_category for club: %', v_club.name;
    END LOOP;
    
    RAISE NOTICE 'Created % new club_categories', v_created_count;
    
    -- Now populate club_category_teams for all club_categories
    RAISE NOTICE '';
    RAISE NOTICE 'Populating club_category_teams for all club_categories...';
    
    FOR v_club_category IN 
        SELECT cc.id, cc.club_id, cc.max_teams, c.name as club_name
        FROM club_categories cc
        JOIN clubs c ON c.id = cc.club_id
        WHERE cc.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM club_category_teams cct WHERE cct.club_category_id = cc.id
        )
        ORDER BY c.name
    LOOP
        RAISE NOTICE 'Processing club_category for club: % (max_teams: %)', v_club_category.club_name, v_club_category.max_teams;
        
        -- Generate teams based on max_teams (just create one team for now)
        INSERT INTO club_category_teams (club_category_id, team_suffix, is_active)
        VALUES (v_club_category.id, 'A', true);
        
        v_teams_created_count := v_teams_created_count + 1;
        RAISE NOTICE '  Created team A for club %', v_club_category.club_name;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL STATE ===';
    RAISE NOTICE '  - Total club_categories: %', (SELECT COUNT(*) FROM club_categories);
    RAISE NOTICE '  - Total club_category_teams: %', (SELECT COUNT(*) FROM club_category_teams);
    RAISE NOTICE '  - New club_categories created: %', v_created_count;
    RAISE NOTICE '  - New teams created: %', v_teams_created_count;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== FIX COMPLETED ===';
    
END $$;
