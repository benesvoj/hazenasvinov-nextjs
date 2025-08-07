-- Database schema for matches and standings management

-- Teams table
CREATE TABLE teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    short_name VARCHAR(20),
    city VARCHAR(100),
    region VARCHAR(100),
    logo_url VARCHAR(500),
    website VARCHAR(500),
    email VARCHAR(100),
    phone VARCHAR(20),
    contact_person VARCHAR(100),
    founded_year INTEGER,
    home_venue VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'men', 'women', 'juniorBoys', 'juniorGirls'
    date DATE NOT NULL,
    time TIME NOT NULL,
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    venue VARCHAR(200) NOT NULL,
    competition VARCHAR(100) NOT NULL,
    is_home BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'completed'
    home_score INTEGER,
    away_score INTEGER,
    result VARCHAR(10), -- 'win', 'loss', 'draw'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Standings table
CREATE TABLE standings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'men', 'women', 'juniorBoys', 'juniorGirls'
    position INTEGER NOT NULL,
    team_id UUID REFERENCES teams(id),
    matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, team_id)
);

-- Indexes for better performance
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_active ON teams(is_active);
CREATE INDEX idx_matches_category ON matches(category);
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_standings_category ON standings(category);
CREATE INDEX idx_standings_position ON standings(position);
CREATE INDEX idx_standings_team ON standings(team_id);

-- Row Level Security (RLS) policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

-- Policies for teams table
CREATE POLICY "Teams are viewable by everyone" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Teams are insertable by authenticated users" ON teams
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Teams are updatable by authenticated users" ON teams
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Teams are deletable by authenticated users" ON teams
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for matches table
CREATE POLICY "Matches are viewable by everyone" ON matches
    FOR SELECT USING (true);

CREATE POLICY "Matches are insertable by authenticated users" ON matches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Matches are updatable by authenticated users" ON matches
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Matches are deletable by authenticated users" ON matches
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for standings table
CREATE POLICY "Standings are viewable by everyone" ON standings
    FOR SELECT USING (true);

CREATE POLICY "Standings are insertable by authenticated users" ON standings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Standings are updatable by authenticated users" ON standings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Standings are deletable by authenticated users" ON standings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample teams data
INSERT INTO teams (name, short_name, city, region, website, email, phone, contact_person, founded_year, home_venue, is_active) VALUES
('TJ Sokol Svinov', 'Svinov', 'Ostrava', 'Moravskoslezský kraj', 'https://www.sokol-svinov.cz', 'info@sokol-svinov.cz', '+420 123 456 789', 'Jan Novák', 1920, 'Sportovní hala Svinov', true),
('TJ Sokol Ostrava', 'Ostrava', 'Ostrava', 'Moravskoslezský kraj', 'https://www.sokol-ostrava.cz', 'info@sokol-ostrava.cz', '+420 123 456 790', 'Petr Svoboda', 1918, 'Sportovní hala Ostrava', true),
('TJ Sokol Frýdek-Místek', 'Frýdek-Místek', 'Frýdek-Místek', 'Moravskoslezský kraj', 'https://www.sokol-fm.cz', 'info@sokol-fm.cz', '+420 123 456 791', 'Martin Dvořák', 1922, 'Sportovní hala Frýdek-Místek', true),
('TJ Sokol Karviná', 'Karviná', 'Karviná', 'Moravskoslezský kraj', 'https://www.sokol-karvina.cz', 'info@sokol-karvina.cz', '+420 123 456 792', 'Tomáš Černý', 1921, 'Sportovní hala Karviná', true),
('TJ Sokol Poruba', 'Poruba', 'Ostrava', 'Moravskoslezský kraj', 'https://www.sokol-poruba.cz', 'info@sokol-poruba.cz', '+420 123 456 793', 'Lukáš Veselý', 1923, 'Sportovní hala Poruba', true),
('TJ Sokol Klimkovice', 'Klimkovice', 'Klimkovice', 'Moravskoslezský kraj', 'https://www.sokol-klimkovice.cz', 'info@sokol-klimkovice.cz', '+420 123 456 794', 'David Malý', 1924, 'Sportovní hala Klimkovice', true),
('TJ Sokol Bohumín', 'Bohumín', 'Bohumín', 'Moravskoslezský kraj', 'https://www.sokol-bohumin.cz', 'info@sokol-bohumin.cz', '+420 123 456 795', 'Pavel Horák', 1925, 'Sportovní hala Bohumín', true),
('TJ Sokol Havířov', 'Havířov', 'Havířov', 'Moravskoslezský kraj', 'https://www.sokol-havirov.cz', 'info@sokol-havirov.cz', '+420 123 456 796', 'Josef Král', 1926, 'Sportovní hala Havířov', true),
('TJ Sokol Třinec', 'Třinec', 'Třinec', 'Moravskoslezský kraj', 'https://www.sokol-trinec.cz', 'info@sokol-trinec.cz', '+420 123 456 797', 'Michal Procházka', 1927, 'Sportovní hala Třinec', true),
('TJ Sokol Opava', 'Opava', 'Opava', 'Moravskoslezský kraj', 'https://www.sokol-opava.cz', 'info@sokol-opava.cz', '+420 123 456 798', 'Roman Kučera', 1928, 'Sportovní hala Opava', true),
('TJ Sokol Krnov', 'Krnov', 'Krnov', 'Moravskoslezský kraj', 'https://www.sokol-krnov.cz', 'info@sokol-krnov.cz', '+420 123 456 799', 'Ondřej Zeman', 1929, 'Sportovní hala Krnov', true),
('TJ Sokol Bruntál', 'Bruntál', 'Bruntál', 'Moravskoslezský kraj', 'https://www.sokol-bruntal.cz', 'info@sokol-bruntal.cz', '+420 123 456 800', 'Václav Růžička', 1930, 'Sportovní hala Bruntál', true);

-- Sample match data for testing (updated to use team IDs)
INSERT INTO matches (category, date, time, home_team_id, away_team_id, venue, competition, is_home, status) VALUES
('men', '2024-09-21', '15:00', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava'), 
 'Sportovní hala Svinov', '1. liga muži', true, 'completed'),
('men', '2024-09-28', '16:30', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Frýdek-Místek'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 'Sportovní hala Frýdek-Místek', '1. liga muži', false, 'upcoming'),
('men', '2024-10-05', '15:00', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Karviná'), 
 'Sportovní hala Svinov', '1. liga muži', true, 'upcoming'),
('women', '2024-09-22', '16:00', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava'), 
 'Sportovní hala Svinov', '1. liga ženy', true, 'completed'),
('women', '2024-10-06', '15:30', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Poruba'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 'Sportovní hala Poruba', '1. liga ženy', false, 'upcoming');

-- Update some matches with results
UPDATE matches SET 
    home_score = 18, 
    away_score = 12, 
    result = 'win', 
    status = 'completed' 
WHERE home_team_id = (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov') 
  AND away_team_id = (SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava') 
  AND category = 'men';

UPDATE matches SET 
    home_score = 16, 
    away_score = 14, 
    result = 'win', 
    status = 'completed' 
WHERE home_team_id = (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov') 
  AND away_team_id = (SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava') 
  AND category = 'women';
