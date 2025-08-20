-- Fix Lineup Summary Function Type Mismatch
-- This script fixes the "bigint vs integer" type error

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_lineup_summary(UUID, UUID);

-- Create a properly typed lineup summary function
CREATE OR REPLACE FUNCTION get_lineup_summary(
    match_uuid UUID,
    team_uuid UUID
)
RETURNS TABLE (
    total_players INTEGER,
    goalkeepers INTEGER,
    field_players INTEGER,
    coaches INTEGER,
    is_valid BOOLEAN
) AS $$
DECLARE
    lineup_id UUID;
    player_count INTEGER;
    goalkeeper_count INTEGER;
    field_player_count INTEGER;
    coach_count INTEGER;
    is_valid_lineup BOOLEAN;
BEGIN
    -- Get the lineup ID for this match and team
    SELECT id INTO lineup_id
    FROM lineups
    WHERE match_id = match_uuid AND team_id = team_uuid;
    
    -- If no lineup exists, return empty counts
    IF lineup_id IS NULL THEN
        RETURN QUERY SELECT 0, 0, 0, 0, false;
        RETURN;
    END IF;
    
    -- Count total players
    SELECT COUNT(*) INTO player_count
    FROM lineup_players
    WHERE lineup_id = lineup_id;
    
    -- Count goalkeepers
    SELECT COUNT(*) INTO goalkeeper_count
    FROM lineup_players
    WHERE lineup_id = lineup_id AND position = 'goalkeeper';
    
    -- Count field players
    SELECT COUNT(*) INTO field_player_count
    FROM lineup_players
    WHERE lineup_id = lineup_id AND position = 'field_player';
    
    -- Count coaches
    SELECT COUNT(*) INTO coach_count
    FROM lineup_coaches
    WHERE lineup_id = lineup_id;
    
    -- Validate lineup according to handball rules
    is_valid_lineup := (
        goalkeeper_count >= 1 AND
        goalkeeper_count <= 2 AND
        field_player_count >= 6 AND
        field_player_count <= 13 AND
        player_count >= 7 AND
        player_count <= 15 AND
        coach_count <= 3 AND
        (coach_count = 0 OR EXISTS (
            SELECT 1 FROM lineup_coaches 
            WHERE lineup_id = lineup_id AND role = 'head_coach'
        ))
    );
    
    -- Return the summary
    RETURN QUERY SELECT 
        player_count::INTEGER,
        goalkeeper_count::INTEGER,
        field_player_count::INTEGER,
        coach_count::INTEGER,
        is_valid_lineup;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'Lineup summary function fixed successfully!' as status;
