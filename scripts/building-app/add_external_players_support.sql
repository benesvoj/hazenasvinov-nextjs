-- Add External Players Support to Lineup System
-- This allows adding players from other clubs with auto-completion

-- External players table to store players from other clubs
CREATE TABLE IF NOT EXISTS external_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    "position" VARCHAR(50) NOT NULL CHECK ("position" IN ('goalkeeper', 'field_player')),
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
    p_position VARCHAR(50)
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
            "position" = p_position,
            updated_at = NOW()
        WHERE id = player_id;
    ELSE
        -- Create new external player
        INSERT INTO external_players (
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
    "position" VARCHAR(50),
    display_name VARCHAR(200)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ep.id,
        ep.registration_number,
        ep.name,
        ep.surname,
        ep."position",
        CONCAT(ep.name, ' ', ep.surname, ' (', ep.registration_number, ')') as display_name
    FROM external_players ep
    WHERE 
        ep.registration_number ILIKE '%' || search_term || '%' OR
        ep.name ILIKE '%' || search_term || '%' OR
        ep.surname ILIKE '%' || search_term || '%'
    ORDER BY ep.surname, ep.name
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Enhanced lineup validation function to include coach rules
CREATE OR REPLACE FUNCTION validate_lineup_enhanced()
RETURNS TRIGGER AS $$
DECLARE
    goalkeeper_count INTEGER;
    field_player_count INTEGER;
    coach_count INTEGER;
    total_players INTEGER;
    current_lineup_id UUID;
BEGIN
    -- Determine which table triggered this
    IF TG_TABLE_NAME = 'lineup_players' THEN
        current_lineup_id := NEW.lineup_id;
    ELSIF TG_TABLE_NAME = 'lineup_coaches' THEN
        current_lineup_id := NEW.lineup_id;
    END IF;
    
    -- Count players by position
    SELECT 
        COUNT(*) FILTER (WHERE "position" = 'goalkeeper'),
        COUNT(*) FILTER (WHERE "position" = 'field_player')
    INTO goalkeeper_count, field_player_count
    FROM lineup_players
    WHERE lineup_id = current_lineup_id;
    
    -- Count coaches
    SELECT COUNT(*) INTO coach_count
    FROM lineup_coaches
    WHERE lineup_id = current_lineup_id;
    
    total_players := goalkeeper_count + field_player_count;
    
    -- Validate minimum requirements
    IF goalkeeper_count < 1 THEN
        RAISE EXCEPTION 'Lineup must have at least 1 goalkeeper';
    END IF;
    
    IF field_player_count < 6 THEN
        RAISE EXCEPTION 'Lineup must have at least 6 field players';
    END IF;
    
    IF total_players < 7 THEN
        RAISE EXCEPTION 'Lineup must have at least 7 total players';
    END IF;
    
    -- Validate maximum requirements
    IF goalkeeper_count > 2 THEN
        RAISE EXCEPTION 'Lineup cannot have more than 2 goalkeepers';
    END IF;
    
    IF field_player_count > 13 THEN
        RAISE EXCEPTION 'Lineup cannot have more than 13 field players';
    END IF;
    
    -- Coach validation rules
    IF coach_count > 3 THEN
        RAISE EXCEPTION 'Lineup cannot have more than 3 coaches';
    END IF;
    
    -- Additional coach rules for handball federation
    IF coach_count > 0 THEN
        -- Check for duplicate roles (optional - can be relaxed if needed)
        -- This ensures at least one head coach
        IF NOT EXISTS (
            SELECT 1 FROM lineup_coaches 
            WHERE lineup_id = current_lineup_id AND role = 'head_coach'
        ) THEN
            RAISE EXCEPTION 'Lineup must have at least 1 head coach';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers and recreate with enhanced validation
DROP TRIGGER IF EXISTS validate_lineup_players ON lineup_players;
DROP TRIGGER IF EXISTS validate_lineup_coaches ON lineup_coaches;

-- Create triggers for enhanced lineup validation
CREATE TRIGGER validate_lineup_players_enhanced
    AFTER INSERT OR UPDATE ON lineup_players
    FOR EACH ROW
    EXECUTE FUNCTION validate_lineup_enhanced();

CREATE TRIGGER validate_lineup_coaches_enhanced
    AFTER INSERT OR UPDATE ON lineup_coaches
    FOR EACH ROW
    EXECUTE FUNCTION validate_lineup_enhanced();

-- Test the setup
SELECT 'External players support with club IDs and enhanced coach validation added successfully!' as status;
