-- Populate club_category_teams table before foreign key migration
-- This script creates the necessary club_category_teams entries based on existing teams and club data

DO $$ 
DECLARE
    v_season_id UUID;
    v_category_id UUID;
    v_club RECORD;
    v_club_category RECORD;
    v_team_suffix TEXT;
    v_suffixes TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E'];
    v_i INTEGER;
    v_sample_club RECORD;
BEGIN
    RAISE NOTICE 'Starting population of club_category_teams table...';
    
    -- Check current state
    RAISE NOTICE 'Current state:';
    RAISE NOTICE '  - Total clubs: %', (SELECT COUNT(*) FROM clubs);
    RAISE NOTICE '  - Total club_categories: %', (SELECT COUNT(*) FROM club_categories);
    RAISE NOTICE '  - Total club_category_teams: %', (SELECT COUNT(*) FROM club_category_teams);
    RAISE NOTICE '  - Total teams: %', (SELECT COUNT(*) FROM teams);
    
    -- If club_categories is empty, we need to create entries first
    IF (SELECT COUNT(*) FROM club_categories) = 0 THEN
        RAISE NOTICE 'No club_categories found. Creating basic structure...';
        
        -- Get the first active season and category to create basic entries
        -- Get first active season
        SELECT id INTO v_season_id FROM seasons WHERE is_active = true LIMIT 1;
        IF v_season_id IS NULL THEN
            SELECT id INTO v_season_id FROM seasons LIMIT 1;
        END IF;
        
        -- Get first active category
        SELECT id INTO v_category_id FROM categories WHERE is_active = true LIMIT 1;
        IF v_category_id IS NULL THEN
            SELECT id INTO v_category_id FROM categories LIMIT 1;
        END IF;
        
        IF v_season_id IS NULL OR v_category_id IS NULL THEN
            RAISE EXCEPTION 'No seasons or categories found. Please create at least one season and category first.';
        END IF;
        
        RAISE NOTICE 'Using season ID: % and category ID: %', v_season_id, v_category_id;
        
        -- Create club_categories entries for all clubs
        FOR v_club IN SELECT id, name FROM clubs WHERE is_active = true LOOP
            INSERT INTO club_categories (club_id, category_id, season_id, max_teams, is_active)
            VALUES (v_club.id, v_category_id, v_season_id, 1, true)
            ON CONFLICT (club_id, category_id, season_id) DO NOTHING;
            
            RAISE NOTICE 'Created club_category for club: %', v_club.name;
        END LOOP;
    END IF;
    
    -- Now populate club_category_teams based on existing teams
    RAISE NOTICE 'Populating club_category_teams...';
    
    -- Create a temporary mapping table to understand team-club relationships
    CREATE TEMP TABLE IF NOT EXISTS temp_team_club_mapping AS
    SELECT 
        t.id as team_id,
        t.name as team_name,
        c.id as club_id,
        c.name as club_name,
        CASE 
            WHEN t.name LIKE '%% A' THEN 'A'
            WHEN t.name LIKE '%% B' THEN 'B'
            WHEN t.name LIKE '%% C' THEN 'C'
            WHEN t.name LIKE '%% D' THEN 'D'
            WHEN t.name LIKE '%% E' THEN 'E'
            ELSE 'A'
        END as team_suffix
    FROM teams t
    LEFT JOIN clubs c ON c.name = 
        CASE 
            WHEN t.name LIKE '%% A' THEN REPLACE(t.name, ' A', '')
            WHEN t.name LIKE '%% B' THEN REPLACE(t.name, ' B', '')
            WHEN t.name LIKE '%% C' THEN REPLACE(t.name, ' C', '')
            WHEN t.name LIKE '%% D' THEN REPLACE(t.name, ' D', '')
            WHEN t.name LIKE '%% E' THEN REPLACE(t.name, ' E', '')
            ELSE t.name
        END
    WHERE c.id IS NOT NULL;
    
    RAISE NOTICE 'Created team-club mapping for % teams', (SELECT COUNT(*) FROM temp_team_club_mapping);
    
    -- Populate club_category_teams for each club_category
    FOR v_club_category IN 
        SELECT cc.id, cc.club_id, cc.max_teams, c.name as club_name
        FROM club_categories cc
        JOIN clubs c ON c.id = cc.club_id
        WHERE cc.is_active = true
    LOOP
        RAISE NOTICE 'Processing club_category for club: % (max_teams: %)', v_club_category.club_name, v_club_category.max_teams;
        
        -- Generate teams based on max_teams
        FOR v_i IN 1..v_club_category.max_teams LOOP
            v_team_suffix := v_suffixes[v_i];
            
            INSERT INTO club_category_teams (club_category_id, team_suffix, is_active)
            VALUES (v_club_category.id, v_team_suffix, true)
            ON CONFLICT (club_category_id, team_suffix) DO NOTHING;
            
            RAISE NOTICE '  Created team % for club %', v_team_suffix, v_club_category.club_name;
        END LOOP;
    END LOOP;
    
    -- Clean up temporary table
    DROP TABLE IF EXISTS temp_team_club_mapping;
    
    RAISE NOTICE 'Population completed!';
    RAISE NOTICE 'Final state:';
    RAISE NOTICE '  - Total club_category_teams: %', (SELECT COUNT(*) FROM club_category_teams);
    
    -- Show sample of created teams
    RAISE NOTICE 'Sample of created teams:';
    FOR v_sample_club IN 
        SELECT 
            c.name as club_name,
            cat.name as category_name,
            s.name as season_name,
            COUNT(cct.team_suffix) as team_count,
            STRING_AGG(cct.team_suffix, ', ' ORDER BY cct.team_suffix) as team_suffixes
        FROM club_category_teams cct
        JOIN club_categories cc ON cct.club_category_id = cc.id
        JOIN clubs c ON cc.club_id = c.id
        JOIN categories cat ON cc.category_id = cat.id
        JOIN seasons s ON cc.season_id = s.id
        GROUP BY c.id, c.name, cat.id, cat.name, s.id, s.name
        LIMIT 5
    LOOP
        RAISE NOTICE '  - %: % teams (%) in % - %', 
                    v_sample_club.club_name, 
                    v_sample_club.team_count, 
                    v_sample_club.team_suffixes,
                    v_sample_club.category_name,
                    v_sample_club.season_name;
    END LOOP;
    
END $$;
