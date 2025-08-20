-- Test script to verify external players syntax
-- Run this first to check for any syntax errors

-- Test table creation syntax
CREATE TABLE IF NOT EXISTS test_external_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    "position" VARCHAR(50) NOT NULL CHECK ("position" IN ('goalkeeper', 'field_player')),
    club_id UUID,
    club_name VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test function syntax
CREATE OR REPLACE FUNCTION test_get_or_create_external_player(
    p_registration_number VARCHAR(50),
    p_name VARCHAR(100),
    p_surname VARCHAR(100),
    p_position VARCHAR(50)
)
RETURNS UUID AS $$
DECLARE
    player_id UUID;
BEGIN
    -- Test the quoted position syntax
    INSERT INTO test_external_players (
        registration_number, 
        name, 
        surname, 
        "position"
    ) VALUES (
        p_registration_number, 
        p_name, 
        p_surname, 
        p_position
    ) RETURNING id INTO player_id;
    
    RETURN player_id;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT test_get_or_create_external_player('TEST001', 'Test', 'Player', 'goalkeeper');

-- Clean up test data
DROP FUNCTION IF EXISTS test_get_or_create_external_player;
DROP TABLE IF EXISTS test_external_players;

-- If we get here without errors, the syntax is correct
SELECT 'External players syntax test passed successfully!' as status;
