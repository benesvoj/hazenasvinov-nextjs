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

-- Seasons table (moved before tables that reference it)
CREATE TABLE seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g., '2023/2024', '2024/2025'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table (moved before tables that reference it)
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE, -- 'men', 'women', 'juniorBoys', etc.
    name VARCHAR(100) NOT NULL, -- 'Muži', 'Ženy', 'Dorostenci', etc.
    description TEXT,
    age_group VARCHAR(50), -- 'adults', 'juniors', 'youth', 'kids'
    gender VARCHAR(20), -- 'male', 'female', 'mixed'
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'men', 'women', 'juniorBoys', 'juniorGirls'
    season_id UUID REFERENCES seasons(id),
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
    season_id UUID REFERENCES seasons(id),
    matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, season_id, team_id)
);

-- Indexes for better performance
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_active ON teams(is_active);
CREATE INDEX idx_matches_category ON matches(category);
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_matches_season ON matches(season_id);
CREATE INDEX idx_standings_category ON standings(category);
CREATE INDEX idx_standings_position ON standings(position);
CREATE INDEX idx_standings_team ON standings(team_id);
CREATE INDEX idx_standings_season ON standings(season_id);

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

-- Members table
CREATE TABLE members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    sex VARCHAR(10) NOT NULL CHECK (sex IN ('male', 'female')),
    functions TEXT[] DEFAULT '{}', -- Array of functions: 'player', 'coach', 'referee', 'club_management'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for members table
CREATE INDEX idx_members_surname ON members(surname);
CREATE INDEX idx_members_name ON members(name);
CREATE INDEX idx_members_category ON members(category_id);
CREATE INDEX idx_members_sex ON members(sex);

-- Row Level Security (RLS) policies for members table
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members are viewable by everyone" ON members
    FOR SELECT USING (true);

CREATE POLICY "Members are insertable by authenticated users" ON members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members are updatable by authenticated users" ON members
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Members are deletable by authenticated users" ON members
    FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger to automatically update updated_at for members
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Team Categories table (many-to-many relationship between teams and categories per season)
CREATE TABLE team_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, season_id, category_id)
);

-- Indexes for new tables
CREATE INDEX idx_seasons_active ON seasons(is_active);
CREATE INDEX idx_seasons_dates ON seasons(start_date, end_date);
CREATE INDEX idx_team_categories_team ON team_categories(team_id);
CREATE INDEX idx_team_categories_season ON team_categories(season_id);
CREATE INDEX idx_team_categories_category ON team_categories(category_id);
CREATE INDEX idx_team_categories_active ON team_categories(is_active);

-- Row Level Security (RLS) policies for new tables
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_categories ENABLE ROW LEVEL SECURITY;

-- Policies for seasons table
CREATE POLICY "Seasons are viewable by everyone" ON seasons
    FOR SELECT USING (true);

CREATE POLICY "Seasons are insertable by authenticated users" ON seasons
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Seasons are updatable by authenticated users" ON seasons
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Seasons are deletable by authenticated users" ON seasons
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for team_categories table
CREATE POLICY "Team categories are viewable by everyone" ON team_categories
    FOR SELECT USING (true);

CREATE POLICY "Team categories are insertable by authenticated users" ON team_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Team categories are updatable by authenticated users" ON team_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Team categories are deletable by authenticated users" ON team_categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Triggers for new tables
CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_categories_updated_at BEFORE UPDATE ON team_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample seasons data
INSERT INTO seasons (name, start_date, end_date, is_active, is_closed) VALUES
('2023/2024', '2023-09-01', '2024-06-30', false, true),
('2024/2025', '2024-09-01', '2025-06-30', true, false);

-- Indexes for categories table
CREATE INDEX idx_categories_code ON categories(code);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- Row Level Security (RLS) policies for categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Categories are insertable by authenticated users" ON categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Categories are updatable by authenticated users" ON categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Categories are deletable by authenticated users" ON categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger for categories table
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample categories data
INSERT INTO categories (code, name, description, age_group, gender, sort_order) VALUES
('men', 'Muži', 'Dospělí muži - 1. liga', 'adults', 'male', 1),
('women', 'Ženy', 'Dospělé ženy - 1. liga', 'adults', 'female', 2),
('juniorBoys', 'Dorostenci', 'Junioři 15-18 let', 'juniors', 'male', 3),
('juniorGirls', 'Dorostenky', 'Juniorky 15-18 let', 'juniors', 'female', 4),
('olderBoys', 'Starší žáci', 'Starší žáci 12-15 let', 'youth', 'male', 5),
('olderGirls', 'Starší žákyně', 'Starší žákyně 12-15 let', 'youth', 'female', 6),
('youngerBoys', 'Mladší žáci', 'Mladší žáci 9-12 let', 'youth', 'male', 7),
('youngerGirls', 'Mladší žákyně', 'Mladší žákyně 9-12 let', 'youth', 'female', 8),
('prepKids', 'Přípravka', 'Děti 5-10 let', 'kids', 'mixed', 9),
('youngestKids', 'Nejmladší děti', 'Děti 3-6 let', 'kids', 'mixed', 10);

-- Update team_categories table to reference categories (not needed since table is created with category_id)

-- Update matches table to reference categories
ALTER TABLE matches DROP COLUMN category;
ALTER TABLE matches ADD COLUMN category_id UUID REFERENCES categories(id);

-- Update standings table to reference categories
ALTER TABLE standings DROP COLUMN category;
ALTER TABLE standings ADD COLUMN category_id UUID REFERENCES categories(id);

-- Update unique constraint for standings (after columns are added)
ALTER TABLE standings DROP CONSTRAINT IF EXISTS standings_category_season_id_team_id_key;
ALTER TABLE standings ADD CONSTRAINT standings_category_id_season_id_team_id_key UNIQUE(category_id, season_id, team_id);

-- Update members table to reference categories (not needed since table is created with category_id)

-- Sample team categories data (updated to use category_id)
INSERT INTO team_categories (team_id, season_id, category_id) VALUES
-- TJ Sokol Svinov categories for 2024/2025 season
((SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'men')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'women')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'juniorBoys')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'juniorGirls')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'prepKids')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'youngestKids')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'youngerBoys')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'youngerGirls')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'olderBoys')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'olderGirls')),

-- Other teams with selected categories
((SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'men')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'women')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Frýdek-Místek'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'men')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Karviná'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'men')),
((SELECT id FROM teams WHERE name = 'TJ Sokol Poruba'), (SELECT id FROM seasons WHERE name = '2024/2025'), (SELECT id FROM categories WHERE code = 'women'));

-- Sample members data (updated to use category_id)
INSERT INTO members (name, surname, date_of_birth, category_id, sex) VALUES
('Jan', 'Novák', '1990-05-15', (SELECT id FROM categories WHERE code = 'men'), 'male'),
('Petra', 'Svobodová', '1992-08-22', (SELECT id FROM categories WHERE code = 'women'), 'female'),
('Tomáš', 'Černý', '2005-03-10', (SELECT id FROM categories WHERE code = 'juniorBoys'), 'male'),
('Anna', 'Veselá', '2006-11-05', (SELECT id FROM categories WHERE code = 'juniorGirls'), 'female'),
('Lukáš', 'Malý', '2010-07-18', (SELECT id FROM categories WHERE code = 'prepKids'), 'male'),
('Eva', 'Horáková', '2012-01-30', (SELECT id FROM categories WHERE code = 'youngestKids'), 'female'),
('Martin', 'Dvořák', '2008-09-12', (SELECT id FROM categories WHERE code = 'youngerBoys'), 'male'),
('Lucie', 'Krejčí', '2009-04-25', (SELECT id FROM categories WHERE code = 'youngerGirls'), 'female'),
('David', 'Procházka', '2007-06-08', (SELECT id FROM categories WHERE code = 'olderBoys'), 'male'),
('Karolína', 'Kučerová', '2008-12-14', (SELECT id FROM categories WHERE code = 'olderGirls'), 'female');

-- Update some matches with results
UPDATE matches SET 
    home_score = 18, 
    away_score = 12, 
    result = 'win', 
    status = 'completed' 
WHERE home_team_id = (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov') 
  AND away_team_id = (SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava') 
  AND category_id = (SELECT id FROM categories WHERE code = 'men');

UPDATE matches SET 
    home_score = 16, 
    away_score = 14, 
    result = 'win', 
    status = 'completed' 
WHERE home_team_id = (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov') 
  AND away_team_id = (SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava') 
  AND category_id = (SELECT id FROM categories WHERE code = 'women');

-- Sample match data for testing (updated to use category_id, season_id and team IDs)
INSERT INTO matches (category_id, season_id, date, time, home_team_id, away_team_id, venue, competition, is_home, status) VALUES
((SELECT id FROM categories WHERE code = 'men'), (SELECT id FROM seasons WHERE name = '2024/2025'), '2024-09-21', '15:00', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava'), 
 'Sportovní hala Svinov', '1. liga muži', true, 'completed'),
((SELECT id FROM categories WHERE code = 'men'), (SELECT id FROM seasons WHERE name = '2024/2025'), '2024-09-28', '16:30', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Frýdek-Místek'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 'Sportovní hala Frýdek-Místek', '1. liga muži', false, 'upcoming'),
((SELECT id FROM categories WHERE code = 'men'), (SELECT id FROM seasons WHERE name = '2024/2025'), '2024-10-05', '15:00', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Karviná'), 
 'Sportovní hala Svinov', '1. liga muži', true, 'upcoming'),
((SELECT id FROM categories WHERE code = 'women'), (SELECT id FROM seasons WHERE name = '2024/2025'), '2024-09-22', '16:00', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava'), 
 'Sportovní hala Svinov', '1. liga ženy', true, 'completed'),
((SELECT id FROM categories WHERE code = 'women'), (SELECT id FROM seasons WHERE name = '2024/2025'), '2024-10-06', '15:30', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Poruba'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 'Sportovní hala Poruba', '1. liga ženy', false, 'upcoming');

-- Sample match data for previous season (2023/2024)
INSERT INTO matches (category_id, season_id, date, time, home_team_id, away_team_id, venue, competition, is_home, status) VALUES
((SELECT id FROM categories WHERE code = 'men'), (SELECT id FROM seasons WHERE name = '2023/2024'), '2023-09-15', '15:00', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Ostrava'), 
 'Sportovní hala Svinov', '1. liga muži', true, 'completed'),
((SELECT id FROM categories WHERE code = 'women'), (SELECT id FROM seasons WHERE name = '2023/2024'), '2023-09-20', '16:00', 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Svinov'), 
 (SELECT id FROM teams WHERE name = 'TJ Sokol Frýdek-Místek'), 
 'Sportovní hala Svinov', '1. liga ženy', true, 'completed');
