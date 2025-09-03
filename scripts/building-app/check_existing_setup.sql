-- Check Existing Lineup System Setup
-- Run this first to see what already exists in your database

-- 1. Check if lineup tables exist
SELECT 
    'lineups' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lineups') as exists
UNION ALL
SELECT 
    'lineup_players' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lineup_players') as exists
UNION ALL
SELECT 
    'lineup_coaches' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lineup_coaches') as exists
UNION ALL
SELECT 
    'external_players' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'external_players') as exists;

-- 2. Check if external_player_id column exists in lineup_players
SELECT 
    'external_player_id column in lineup_players' as check_name,
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lineup_players' AND column_name = 'external_player_id') as exists;

-- 3. Check if functions exist
SELECT 
    'get_or_create_external_player function' as function_name,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_or_create_external_player') as exists
UNION ALL
SELECT 
    'search_external_players function' as function_name,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_external_players') as exists
UNION ALL
SELECT 
    'validate_lineup_enhanced function' as function_name,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_lineup_enhanced') as exists;

-- 4. Check if triggers exist
SELECT 
    'validate_lineup_players_enhanced trigger' as trigger_name,
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_lineup_players_enhanced') as exists
UNION ALL
SELECT 
    'validate_lineup_coaches_enhanced trigger' as trigger_name,
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_lineup_coaches_enhanced') as exists;

-- 5. Check if update_updated_at_column function exists (needed for triggers)
SELECT 
    'update_updated_at_column function' as function_name,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') as exists;
