-- Add External Players Support to Lineup System (Simplified Version)
-- This version avoids the reserved 'position' keyword to prevent syntax errors

-- External players table to store players from other clubs
CREATE TABLE IF NOT EXISTS external_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    player_position VARCHAR(50) NOT NULL CHECK (player_position IN ('goalkeeper', 'field_player')),
    club_id UUID REFERENCES teams(id), -- Reference to existing teams table
    club_name VARCHAR(200), -- Fallback for clubs not in teams table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for external_players
CREATE TRIGGER update_external_players_updated_at 
    BEFORE UPDATE ON external_players 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for fast lookup by registration number
CREATE INDEX IF NOT EXISTS idx_external_players_registration_number ON external_players(registration_number);

-- Index for name search
CREATE INDEX IF NOT EXISTS idx_external_players_name_search ON external_players(name, surname);

-- Index for club lookup
CREATE INDEX IF NOT EXISTS idx_external_players_club_id ON external_players(club_id);

-- Row Level Security for external_players
ALTER TABLE external_players ENABLE ROW LEVEL SECURITY;

-- Policies for external_players table
CREATE POLICY "External players are viewable by everyone" ON external_players
    FOR SELECT USING (true);

CREATE POLICY "External players are insertable by authenticated users" ON external_players
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "External players are updatable by authenticated users" ON external_players
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "External players are deletable by authenticated users" ON external_players
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON external_players TO authenticated;

-- Function to get or create external player
CREATE OR REPLACE FUNCTION get_or_create_external_player(
    p_registration_number VARCHAR(50),
    p_name VARCHAR(100),
    p_surname VARCHAR(100),
    p_position VARCHAR(50),
    p_club_id UUID DEFAULT NULL,
    p_club_name VARCHAR(200) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    player_id UUID;
BEGIN
    -- Try to find existing player by registration number
    SELECT id INTO player_id
    FROM external_players
    WHERE registration_number = p_registration_number;
    
    IF player_id IS NOT NULL THEN
        -- Update existing player if name/position changed
        UPDATE external_players 
        SET 
            name = p_name,
            surname = p_surname,
            player_position = p_position,
            club_id = COALESCE(p_club_id, club_id),
            club_name = COALESCE(p_club_name, club_name),
            updated_at = NOW()
        WHERE id = player_id;
    ELSE
        -- Create new external player
        INSERT INTO external_players (
            registration_number, 
            name, 
            surname, 
            player_position, 
            club_id,
            club_name
        ) VALUES (
            p_registration_number, 
            p_name, 
            p_surname, 
            p_position, 
            p_club_id,
            p_club_name
        ) RETURNING id INTO player_id;
    END IF;
    
    RETURN player_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search external players
CREATE OR REPLACE FUNCTION search_external_players(search_term VARCHAR(100))
RETURNS TABLE (
    id UUID,
    registration_number VARCHAR(50),
    name VARCHAR(100),
    surname VARCHAR(100),
    player_position VARCHAR(50),
    club_id UUID,
    club_name VARCHAR(200),
    display_name VARCHAR(200)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ep.id,
        ep.registration_number,
        ep.name,
        ep.surname,
        ep.player_position,
        ep.club_id,
        ep.club_name,
        CONCAT(ep.name, ' ', ep.surname, ' (', ep.registration_number, ') - ', 
               COALESCE(t.name, ep.club_name, 'Externí klub')) as display_name
    FROM external_players ep
    LEFT JOIN teams t ON ep.club_id = t.id
    WHERE 
        ep.registration_number ILIKE '%' || search_term || '%' OR
        ep.name ILIKE '%' || search_term || '%' OR
        ep.surname ILIKE '%' || search_term || '%'
    ORDER BY ep.surname, ep.name
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Test the setup
SELECT 'External players support (simplified) added successfully!' as status;
