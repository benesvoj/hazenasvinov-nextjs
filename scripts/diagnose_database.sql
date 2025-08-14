-- Comprehensive Database Diagnostic Script
-- Run this in your Supabase SQL Editor to identify issues

-- 1. Check if required columns exist in teams table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teams' 
AND column_name IN ('is_own_club', 'logo_url', 'committee_id')
ORDER BY column_name;

-- 2. Check if committees table exists and has data
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'committees') 
        THEN 'committees table exists' 
        ELSE 'committees table does NOT exist' 
    END as committees_status;

-- 3. Check teams data
SELECT 
    COUNT(*) as total_teams,
    COUNT(CASE WHEN is_own_club = true THEN 1 END) as own_club_teams,
    COUNT(CASE WHEN logo_url IS NOT NULL THEN 1 END) as teams_with_logos,
    COUNT(CASE WHEN committee_id IS NOT NULL THEN 1 END) as teams_with_committees
FROM teams;

-- 4. Check if there are any teams marked as own club
SELECT 
    id, 
    name, 
    is_own_club, 
    logo_url,
    committee_id
FROM teams 
WHERE is_own_club = true;

-- 5. Check matches data
SELECT 
    COUNT(*) as total_matches,
    COUNT(CASE WHEN status = 'upcoming' THEN 1 END) as upcoming_matches,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_matches
FROM matches;

-- 6. Check if there are any matches for own club teams
SELECT 
    m.id,
    m.date,
    m.status,
    ht.name as home_team,
    ht.is_own_club as home_is_own_club,
    at.name as away_team,
    at.is_own_club as away_is_own_club
FROM matches m
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
WHERE ht.is_own_club = true OR at.is_own_club = true
LIMIT 10;

-- 7. Check standings data
SELECT 
    COUNT(*) as total_standings,
    COUNT(CASE WHEN t.is_own_club = true THEN 1 END) as own_club_standings
FROM standings s
JOIN teams t ON s.team_id = t.id;

-- 8. Check categories data
SELECT 
    COUNT(*) as total_categories,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_categories
FROM categories;

-- 9. Check seasons data
SELECT 
    COUNT(*) as total_seasons,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_seasons
FROM seasons;

-- 10. Check if there are any active seasons
SELECT 
    id, 
    name, 
    is_active,
    start_date,
    end_date
FROM seasons 
WHERE is_active = true;

-- 11. Check if there are any active categories
SELECT 
    id, 
    code, 
    name, 
    is_active
FROM categories 
WHERE is_active = true
ORDER BY sort_order;

-- 12. Check RLS policies for teams table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'teams';

-- 13. Check if user has proper permissions
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_database() as current_database;
