-- Simple investigation script to check current club structure
-- This script avoids complex patterns that could cause syntax issues

DO $$ 
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '=== SIMPLE CLUB STRUCTURE INVESTIGATION ===';
    
    -- Count basic tables
    SELECT COUNT(*) INTO v_count FROM clubs;
    RAISE NOTICE 'Total clubs: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM club_categories;
    RAISE NOTICE 'Total club_categories: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM club_category_teams;
    RAISE NOTICE 'Total club_category_teams: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM teams;
    RAISE NOTICE 'Total teams: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM matches;
    RAISE NOTICE 'Total matches: %', v_count;
    
    -- Check if any clubs are missing categories
    SELECT COUNT(*) INTO v_count 
    FROM clubs c 
    WHERE NOT EXISTS (SELECT 1 FROM club_categories cc WHERE cc.club_id = c.id);
    RAISE NOTICE 'Clubs missing categories: %', v_count;
    
    -- Check if any club_categories are missing teams
    SELECT COUNT(*) INTO v_count 
    FROM club_categories cc 
    WHERE NOT EXISTS (SELECT 1 FROM club_category_teams cct WHERE cct.club_category_id = cc.id);
    RAISE NOTICE 'Club_categories missing teams: %', v_count;
    
    RAISE NOTICE '=== INVESTIGATION COMPLETE ===';
    
END $$;
