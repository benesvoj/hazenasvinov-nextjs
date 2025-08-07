-- Database schema for matches and standings management

-- Matches table
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'men', 'women', 'juniorBoys', 'juniorGirls'
    date DATE NOT NULL,
    time TIME NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
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
    team VARCHAR(100) NOT NULL,
    matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, team)
);

-- Indexes for better performance
CREATE INDEX idx_matches_category ON matches(category);
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_standings_category ON standings(category);
CREATE INDEX idx_standings_position ON standings(position);

-- Row Level Security (RLS) policies
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

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
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO matches (category, date, time, home_team, away_team, venue, competition, is_home, status) VALUES
('men', '2024-09-21', '15:00', 'TJ Sokol Svinov', 'TJ Sokol Ostrava', 'Sportovní hala Svinov', '1. liga muži', true, 'completed'),
('men', '2024-09-28', '16:30', 'TJ Sokol Frýdek-Místek', 'TJ Sokol Svinov', 'Sportovní hala Frýdek-Místek', '1. liga muži', false, 'upcoming'),
('men', '2024-10-05', '15:00', 'TJ Sokol Svinov', 'TJ Sokol Karviná', 'Sportovní hala Svinov', '1. liga muži', true, 'upcoming'),
('women', '2024-09-22', '16:00', 'TJ Sokol Svinov', 'TJ Sokol Ostrava', 'Sportovní hala Svinov', '1. liga ženy', true, 'completed'),
('women', '2024-10-06', '15:30', 'TJ Sokol Poruba', 'TJ Sokol Svinov', 'Sportovní hala Poruba', '1. liga ženy', false, 'upcoming');

-- Update some matches with results
UPDATE matches SET 
    home_score = 18, 
    away_score = 12, 
    result = 'win', 
    status = 'completed' 
WHERE home_team = 'TJ Sokol Svinov' AND away_team = 'TJ Sokol Ostrava' AND category = 'men';

UPDATE matches SET 
    home_score = 16, 
    away_score = 14, 
    result = 'win', 
    status = 'completed' 
WHERE home_team = 'TJ Sokol Svinov' AND away_team = 'TJ Sokol Ostrava' AND category = 'women';
