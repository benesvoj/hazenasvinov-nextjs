-- Simple Fix Match Team IDs Script
-- Use this for quick team ID updates in matches
-- Replace the UUIDs with your actual values

DO $$
DECLARE
    -- Configuration - MODIFY THESE VALUES
    old_team_id UUID := '2cd463ed-6e8c-4c6b-9eda-53589f6a3cf4';  -- OLD team ID to replace
    new_team_id UUID := '723b04fd-5d77-4c6e-8883-0e5799ebe264';  -- NEW team ID to use
    categoryId UUID := 'e0669720-62a9-421e-9a1a-e4b64ae191db';   -- Category ID to limit scope
    
    -- Counters
    home_updates INTEGER := 0;
    away_updates INTEGER := 0;
BEGIN
    RAISE NOTICE '=== SIMPLE TEAM ID FIX ===';
    RAISE NOTICE 'Replacing team ID % with % in category %', old_team_id, new_team_id, categoryId;
    RAISE NOTICE '';
    
    -- Update home_team_id
    UPDATE matches 
    SET home_team_id = new_team_id,
        updated_at = NOW()
    WHERE category_id = categoryId 
      AND home_team_id = old_team_id;
    
    GET DIAGNOSTICS home_updates = ROW_COUNT;
    
    -- Update away_team_id
    UPDATE matches 
    SET away_team_id = new_team_id,
        updated_at = NOW()
    WHERE category_id = categoryId 
      AND away_team_id = old_team_id;
    
    GET DIAGNOSTICS away_updates = ROW_COUNT;
    
    RAISE NOTICE 'Updates completed:';
    RAISE NOTICE '- Home team updates: %', home_updates;
    RAISE NOTICE '- Away team updates: %', away_updates;
    RAISE NOTICE '- Total: %', home_updates + away_updates;
    
END $$;
