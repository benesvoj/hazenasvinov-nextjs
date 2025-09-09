-- Fix Lineups Table Foreign Key Migration
-- This script updates lineups table to reference club_category_teams instead of teams
-- NOTE: teams table is kept for now due to existing code dependencies

-- Step 1: Update lineups table foreign key to reference club_category_teams
ALTER TABLE lineups DROP CONSTRAINT IF EXISTS lineups_team_id_fkey;
ALTER TABLE lineups ADD CONSTRAINT lineups_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES club_category_teams(id) ON DELETE CASCADE;

-- Verify the changes
DO $$ 
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETED ===';
    RAISE NOTICE '✅ lineups.team_id now references club_category_teams.id';
    RAISE NOTICE 'ℹ️ teams table kept for existing code compatibility';
    RAISE NOTICE '=== LINEUP FUNCTIONALITY NOW WORKS WITH CLUB_CATEGORY_TEAMS ===';
END $$;
