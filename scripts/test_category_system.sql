-- Minimal test script for the category system
-- Run this in your Supabase SQL Editor to test the system

-- 1. Check if tables exist
SELECT 
    'categories' as table_name,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'categories') as exists
UNION ALL
SELECT 
    'seasons' as table_name,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'seasons') as exists
UNION ALL
SELECT 
    'matches' as table_name,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'matches') as exists;

-- 2. If categories table doesn't exist, create it
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    age_group VARCHAR(100),
    gender VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. If teams table doesn't exist, create it
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    city VARCHAR(255),
    logo_url TEXT,
    is_own_club BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. If seasons table doesn't exist, create it
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. If matches table doesn't exist, create it
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    time TIME,
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    venue VARCHAR(255),
    competition VARCHAR(255),
    status VARCHAR(50) DEFAULT 'upcoming',
    home_score INTEGER,
    away_score INTEGER,
    matchweek INTEGER,
    match_number INTEGER,
    category_id UUID REFERENCES categories(id),
    season_id UUID REFERENCES seasons(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. If standings table doesn't exist, create it
CREATE TABLE IF NOT EXISTS standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id),
    category_id UUID REFERENCES categories(id),
    season_id UUID REFERENCES seasons(id),
    matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, category_id, season_id)
);

-- 7. Insert test data (only if tables are empty)
-- Teams
INSERT INTO teams (name, short_name, city, is_own_club) 
SELECT 'TJ Sokol Svinov', 'Svinov', 'Ostrava', true
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'TJ Sokol Svinov');

INSERT INTO teams (name, short_name, city, is_own_club) 
SELECT 'Sparta Praha', 'Sparta', 'Praha', false
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Sparta Praha');

-- Categories
INSERT INTO categories (code, name, description, age_group, gender, sort_order) 
SELECT 'men', 'Muži', '1.liga mužů, SM oblast', '18+', 'male', 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE code = 'men');

-- Seasons
INSERT INTO seasons (name, is_active) 
SELECT '2024/2025', true
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE is_active = true);

-- 8. Insert a test match with team IDs
INSERT INTO matches (date, time, venue, competition, status, home_team_id, away_team_id, category_id, season_id)
SELECT 
    '2024-09-15 16:00:00',
    '16:00:00',
    'Sportovní hala Svinov',
    '1. liga mužů',
    'upcoming',
    ht.id,
    at.id,
    c.id,
    s.id
FROM seasons s, categories c, teams ht, teams at
WHERE s.is_active = true 
  AND c.code = 'men'
  AND ht.name = 'TJ Sokol Svinov'
  AND at.name = 'Sparta Praha'
  AND NOT EXISTS (
    SELECT 1 FROM matches m 
    WHERE m.date = '2024-09-15 16:00:00'
    AND m.category_id = c.id
    AND m.season_id = s.id
  )
LIMIT 1;

-- 9. Insert test standings data
INSERT INTO standings (team_id, category_id, season_id, matches, wins, draws, losses, goals_for, goals_against, points, position)
SELECT 
    t.id,
    c.id,
    s.id,
    2,
    1,
    0,
    1,
    3,
    2,
    3,
    1
FROM teams t, categories c, seasons s
WHERE t.name = 'TJ Sokol Svinov' 
  AND c.code = 'men'
  AND s.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM standings st 
    WHERE st.team_id = t.id 
    AND st.category_id = c.id 
    AND st.season_id = s.id
  )
LIMIT 1;

INSERT INTO standings (team_id, category_id, season_id, matches, wins, draws, losses, goals_for, goals_against, points, position)
SELECT 
    t.id,
    c.id,
    s.id,
    2,
    1,
    0,
    1,
    2,
    3,
    3,
    2
FROM teams t, categories c, seasons s
WHERE t.name = 'Sparta Praha' 
  AND c.code = 'men'
  AND s.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM standings st 
    WHERE st.team_id = t.id 
    AND st.category_id = c.id 
    AND st.season_id = s.id
  )
LIMIT 1;

-- 10. Verify the setup
SELECT 'Setup complete!' as status;

SELECT 
    'Teams' as table_name,
    COUNT(*) as count
FROM teams
UNION ALL
SELECT 
    'Categories' as table_name,
    COUNT(*) as count
FROM categories
UNION ALL
SELECT 
    'Seasons' as table_name,
    COUNT(*) as count
FROM seasons
UNION ALL
SELECT 
    'Matches' as table_name,
    COUNT(*) as count
FROM matches
UNION ALL
SELECT 
    'Standings' as table_name,
    COUNT(*) as count
FROM standings;

-- 11. Show active season
SELECT 
    'Active Season' as info,
    name,
    is_active
FROM seasons 
WHERE is_active = true;

-- 12. Show test match with team names
SELECT 
    'Test Match' as info,
    m.date,
    m.time,
    m.venue,
    m.status,
    ht.name as home_team,
    ht.is_own_club as home_is_own_club,
    at.name as away_team,
    at.is_own_club as away_is_own_club,
    c.name as category,
    s.name as season
FROM matches m
JOIN categories c ON m.category_id = c.id
JOIN seasons s ON m.season_id = s.id
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
LIMIT 1;
