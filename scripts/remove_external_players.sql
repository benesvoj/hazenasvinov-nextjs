-- Remove External Players Support from Lineup System
-- This script removes all external players functionality

-- 1. Drop triggers first
DROP TRIGGER IF EXISTS validate_lineup_players_enhanced ON lineup_players;
DROP TRIGGER IF EXISTS validate_lineup_coaches_enhanced ON lineup_coaches;

-- 2. Drop functions
DROP FUNCTION IF EXISTS validate_lineup_enhanced();
DROP FUNCTION IF EXISTS search_external_players(VARCHAR);
DROP FUNCTION IF EXISTS get_or_create_external_player(VARCHAR, VARCHAR, VARCHAR, VARCHAR);

-- 3. Remove external_player_id column from lineup_players table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lineup_players' AND column_name = 'external_player_id') THEN
        ALTER TABLE lineup_players DROP COLUMN external_player_id;
    END IF;
END $$;

-- 4. Drop external_players table and all its data
DROP TABLE IF EXISTS external_players CASCADE;

-- 5. Test the removal
SELECT 'External players support removed successfully from lineup system!' as status;
