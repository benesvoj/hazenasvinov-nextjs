-- Debug script to check team categories data
-- Run this in your Supabase SQL Editor

-- Check if there are any teams marked as own club
SELECT 
    id, 
    name, 
    is_own_club,
    committee_id
FROM teams 
WHERE is_own_club = true;

-- Check if there are any team_categories records
SELECT 
    tc.id,
    tc.team_id,
    tc.season_id,
    tc.category_id,
    tc.is_active,
    t.name as team_name,
    t.is_own_club,
    s.name as season_name,
    s.is_active as season_active,
    c.name as category_name,
    c.code as category_code
FROM team_categories tc
JOIN teams t ON tc.team_id = t.id
JOIN seasons s ON tc.season_id = s.id
JOIN categories c ON tc.category_id = c.id
ORDER BY t.name, s.name, c.sort_order;

-- Check team_categories for own club teams specifically
SELECT 
    tc.id,
    tc.team_id,
    tc.season_id,
    tc.category_id,
    tc.is_active,
    t.name as team_name,
    t.is_own_club,
    s.name as season_name,
    s.is_active as season_active,
    c.name as category_name,
    c.code as category_code
FROM team_categories tc
JOIN teams t ON tc.team_id = t.id
JOIN seasons s ON tc.season_id = s.id
JOIN categories c ON tc.category_id = c.id
WHERE t.is_own_club = true
ORDER BY s.name, c.sort_order;

-- Check active seasons
SELECT 
    id, 
    name, 
    is_active,
    start_date,
    end_date
FROM seasons 
WHERE is_active = true;

-- Check active categories
SELECT 
    id, 
    code, 
    name, 
    is_active,
    sort_order
FROM categories 
WHERE is_active = true
ORDER BY sort_order;
