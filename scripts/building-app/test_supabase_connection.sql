-- Simple test to check database connectivity and basic queries
-- Run this in your Supabase SQL Editor

-- Test 1: Basic table existence
SELECT 
    table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) 
         THEN 'EXISTS' 
         ELSE 'MISSING' 
    END as status
FROM (VALUES 
    ('teams'),
    ('matches'),
    ('standings'),
    ('categories'),
    ('seasons')
) AS t(table_name);

-- Test 2: Basic data counts
SELECT 
    'teams' as table_name,
    COUNT(*) as record_count
FROM teams
UNION ALL
SELECT 
    'matches' as table_name,
    COUNT(*) as record_count
FROM matches
UNION ALL
SELECT 
    'standings' as table_name,
    COUNT(*) as record_count
FROM standings
UNION ALL
SELECT 
    'categories' as table_name,
    COUNT(*) as record_count
FROM categories
UNION ALL
SELECT 
    'seasons' as table_name,
    COUNT(*) as record_count
FROM seasons;

-- Test 3: Check if there are any active seasons and categories
SELECT 
    'active_seasons' as type,
    COUNT(*) as count
FROM seasons 
WHERE is_active = true
UNION ALL
SELECT 
    'active_categories' as type,
    COUNT(*) as count
FROM categories 
WHERE is_active = true;

-- Test 4: Check if there are any teams with is_own_club = true
SELECT 
    'own_club_teams' as type,
    COUNT(*) as count
FROM teams 
WHERE is_own_club = true;

-- Test 5: Check if there are any matches for own club teams
SELECT 
    'own_club_matches' as type,
    COUNT(*) as count
FROM matches m
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
WHERE ht.is_own_club = true OR at.is_own_club = true;
