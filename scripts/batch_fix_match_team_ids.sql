-- Batch Fix Match Team IDs Script
-- Use this when you need to update multiple team IDs at once
-- Add your team ID mappings to the team_mappings array

DO $$
DECLARE
    -- Team ID mappings: array of objects with old_id, new_id, and category_id
    -- Add your mappings here
    team_mappings RECORD;
    total_updates INTEGER := 0;
    home_updates INTEGER := 0;
    away_updates INTEGER := 0;
BEGIN
    RAISE NOTICE '=== BATCH TEAM ID FIX ===';
    RAISE NOTICE 'Processing multiple team ID updates...';
    RAISE NOTICE '';
    
    -- Process each team mapping
    FOR team_mappings IN 
        SELECT 
            '102a7408-b2c5-4a09-80d5-f76771ea4c3e'::UUID as old_id,
            '2fbd366c-f375-40bb-a177-fd4c4a80a09e'::UUID as new_id,
            '5b0e437a-b815-4a37-a41d-088566637c7d'::UUID as category_id
        UNION ALL
        SELECT 
            'ANOTHER-OLD-TEAM-ID'::UUID as old_id,
            'ANOTHER-NEW-TEAM-ID'::UUID as new_id,
            'ANOTHER-CATEGORY-ID'::UUID as category_id
        -- Add more mappings as needed
    LOOP
        RAISE NOTICE 'Processing: % -> % in category %', 
            team_mappings.old_id, 
            team_mappings.new_id, 
            team_mappings.category_id;
        
        -- Update home_team_id
        UPDATE matches 
        SET home_team_id = team_mappings.new_id,
            updated_at = NOW()
        WHERE category_id = team_mappings.category_id 
          AND home_team_id = team_mappings.old_id;
        
        GET DIAGNOSTICS home_updates = ROW_COUNT;
        
        -- Update away_team_id
        UPDATE matches 
        SET away_team_id = team_mappings.new_id,
            updated_at = NOW()
        WHERE category_id = team_mappings.category_id 
          AND away_team_id = team_mappings.old_id;
        
        GET DIAGNOSTICS away_updates = ROW_COUNT;
        
        total_updates := total_updates + home_updates + away_updates;
        
        RAISE NOTICE '  Updated: % home + % away = % total', 
            home_updates, away_updates, home_updates + away_updates;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== BATCH UPDATE COMPLETED ===';
    RAISE NOTICE 'Total matches updated: %', total_updates;
    
END $$;
