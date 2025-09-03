-- Lineup Management System for National Handball
-- This system allows managing team lineups for matches with specific constraints

-- Lineup table to store team lineups for each match
CREATE TABLE IF NOT EXISTS lineups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    is_home_team BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, team_id)
);

-- Lineup players table to store individual players in lineups
CREATE TABLE IF NOT EXISTS lineup_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lineup_id UUID NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    position VARCHAR(50) NOT NULL CHECK (position IN ('goalkeeper', 'field_player')),
    jersey_number INTEGER CHECK (jersey_number >= 1 AND jersey_number <= 99),
    is_starter BOOLEAN DEFAULT false,
    is_captain BOOLEAN DEFAULT false,
    is_vice_captain BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lineup_id, member_id),
    UNIQUE(lineup_id, jersey_number)
);

-- Lineup coaches table to store coaches for each team
CREATE TABLE IF NOT EXISTS lineup_coaches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lineup_id UUID NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('head_coach', 'assistant_coach', 'goalkeeper_coach')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lineup_id, member_id)
);

-- Lineup validation function to ensure proper lineup composition
CREATE OR REPLACE FUNCTION validate_lineup()
RETURNS TRIGGER AS $$
DECLARE
    goalkeeper_count INTEGER;
    field_player_count INTEGER;
    coach_count INTEGER;
    total_players INTEGER;
BEGIN
    -- Count players by position
    SELECT 
        COUNT(*) FILTER (WHERE position = 'goalkeeper'),
        COUNT(*) FILTER (WHERE position = 'field_player')
    INTO goalkeeper_count, field_player_count
    FROM lineup_players
    WHERE lineup_id = NEW.lineup_id;
    
    -- Count coaches
    SELECT COUNT(*) INTO coach_count
    FROM lineup_coaches
    WHERE lineup_id = NEW.lineup_id;
    
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
    
    IF coach_count > 3 THEN
        RAISE EXCEPTION 'Lineup cannot have more than 3 coaches';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for lineup validation
CREATE TRIGGER validate_lineup_players
    AFTER INSERT OR UPDATE ON lineup_players
    FOR EACH ROW
    EXECUTE FUNCTION validate_lineup();

CREATE TRIGGER validate_lineup_coaches
    AFTER INSERT OR UPDATE ON lineup_coaches
    FOR EACH ROW
    EXECUTE FUNCTION validate_lineup();

-- Function to get lineup summary
CREATE OR REPLACE FUNCTION get_lineup_summary(match_uuid UUID, team_uuid UUID)
RETURNS TABLE (
    total_players INTEGER,
    goalkeepers INTEGER,
    field_players INTEGER,
    coaches INTEGER,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.total_players, 0) + COALESCE(c.coach_count, 0) as total_players,
        COALESCE(p.goalkeepers, 0) as goalkeepers,
        COALESCE(p.field_players, 0) as field_players,
        COALESCE(c.coach_count, 0) as coaches,
        CASE 
            WHEN COALESCE(p.goalkeepers, 0) >= 1 
                 AND COALESCE(p.field_players, 0) >= 6 
                 AND COALESCE(p.goalkeepers, 0) <= 2 
                 AND COALESCE(p.field_players, 0) <= 13 
                 AND COALESCE(c.coach_count, 0) <= 3
            THEN true
            ELSE false
        END as is_valid
    FROM (
        SELECT 
            COUNT(*) as total_players,
            COUNT(*) FILTER (WHERE position = 'goalkeeper') as goalkeepers,
            COUNT(*) FILTER (WHERE position = 'field_player') as field_players
        FROM lineup_players lp
        JOIN lineups l ON lp.lineup_id = l.id
        WHERE l.match_id = match_uuid AND l.team_id = team_uuid
    ) p
    CROSS JOIN (
        SELECT COUNT(*) as coach_count
        FROM lineup_coaches lc
        JOIN lineups l ON lc.lineup_id = l.id
        WHERE l.match_id = match_uuid AND l.team_id = team_uuid
    ) c;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX idx_lineups_match_id ON lineups(match_id);
CREATE INDEX idx_lineups_team_id ON lineups(team_id);
CREATE INDEX idx_lineup_players_lineup_id ON lineup_players(lineup_id);
CREATE INDEX idx_lineup_players_member_id ON lineup_players(member_id);
CREATE INDEX idx_lineup_coaches_lineup_id ON lineup_coaches(lineup_id);
CREATE INDEX idx_lineup_coaches_member_id ON lineup_coaches(member_id);

-- Row Level Security (RLS) policies
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_coaches ENABLE ROW LEVEL SECURITY;

-- Policies for lineups table
CREATE POLICY "Lineups are viewable by everyone" ON lineups
    FOR SELECT USING (true);

CREATE POLICY "Lineups are insertable by authenticated users" ON lineups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Lineups are updatable by authenticated users" ON lineups
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Lineups are deletable by authenticated users" ON lineups
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for lineup_players table
CREATE POLICY "Lineup players are viewable by everyone" ON lineup_players
    FOR SELECT USING (true);

CREATE POLICY "Lineup players are insertable by authenticated users" ON lineup_players
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Lineup players are updatable by authenticated users" ON lineup_players
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Lineup players are deletable by authenticated users" ON lineup_players
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for lineup_coaches table
CREATE POLICY "Lineup coaches are viewable by everyone" ON lineup_coaches
    FOR SELECT USING (true);

CREATE POLICY "Lineup coaches are insertable by authenticated users" ON lineup_coaches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Lineup coaches are updatable by authenticated users" ON lineup_coaches
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Lineup coaches are deletable by authenticated users" ON lineup_coaches
    FOR DELETE USING (auth.role() = 'authenticated');

-- Triggers to automatically update updated_at
CREATE TRIGGER update_lineups_updated_at BEFORE UPDATE ON lineups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lineup_players_updated_at BEFORE UPDATE ON lineup_players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lineup_coaches_updated_at BEFORE UPDATE ON lineup_coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON lineups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lineup_players TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lineup_coaches TO authenticated;

-- Sample data for testing
INSERT INTO lineups (match_id, team_id, is_home_team) VALUES
-- You can add sample data here after creating matches and teams
-- Example:
-- ((SELECT id FROM matches LIMIT 1), (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov' LIMIT 1), true),
-- ((SELECT id FROM matches LIMIT 1), (SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava' LIMIT 1), false);

-- Verify the setup
SELECT 
    'lineups' as table_name,
    COUNT(*) as record_count
FROM lineups
UNION ALL
SELECT 
    'lineup_players' as table_name,
    COUNT(*) as record_count
FROM lineup_players
UNION ALL
SELECT 
    'lineup_coaches' as table_name,
    COUNT(*) as record_count
FROM lineup_coaches;
