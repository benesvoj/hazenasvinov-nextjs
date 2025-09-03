-- Fix public access for visitor pages
-- This script creates RLS policies that allow public read access to data
-- that should be visible to visitors while maintaining security for write operations

-- 1. Fix clubs table - allow public read access
DROP POLICY IF EXISTS "Allow authenticated users to read clubs" ON clubs;
CREATE POLICY "Allow public read access to clubs" ON clubs
    FOR SELECT 
    USING (true);

-- 2. Fix matches table - allow public read access
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON matches;
DROP POLICY IF EXISTS "Allow authenticated users to read matches" ON matches;
CREATE POLICY "Allow public read access to matches" ON matches
    FOR SELECT 
    USING (true);

-- 3. Fix teams table - allow public read access
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
DROP POLICY IF EXISTS "Allow authenticated users to read teams" ON teams;
CREATE POLICY "Allow public read access to teams" ON teams
    FOR SELECT 
    USING (true);

-- 4. Fix standings table - allow public read access
DROP POLICY IF EXISTS "Standings are viewable by everyone" ON standings;
DROP POLICY IF EXISTS "Allow authenticated users to read standings" ON standings;
CREATE POLICY "Allow public read access to standings" ON standings
    FOR SELECT 
    USING (true);

-- 5. Fix categories table - allow public read access
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON categories;
CREATE POLICY "Allow public read access to categories" ON categories
    FOR SELECT 
    USING (true);

-- 6. Fix seasons table - allow public read access
DROP POLICY IF EXISTS "Allow authenticated users to read seasons" ON seasons;
CREATE POLICY "Allow public read access to seasons" ON seasons
    FOR SELECT 
    USING (true);

-- 7. Fix club_teams table - allow public read access
DROP POLICY IF EXISTS "Allow authenticated users to read club_teams" ON club_teams;
CREATE POLICY "Allow public read access to club_teams" ON club_teams
    FOR SELECT 
    USING (true);

-- 8. Fix club_categories table - allow public read access
DROP POLICY IF EXISTS "Allow authenticated users to read club_categories" ON club_categories;
CREATE POLICY "Allow public read access to club_categories" ON club_categories
    FOR SELECT 
    USING (true);

-- 9. Fix club_category_teams table - allow public read access
DROP POLICY IF EXISTS "Allow authenticated users to read club_category_teams" ON club_category_teams;
CREATE POLICY "Allow public read access to club_category_teams" ON club_category_teams
    FOR SELECT 
    USING (true);

-- 10. Fix category_seasons table - allow public read access
DROP POLICY IF EXISTS "Allow authenticated users to read category_seasons" ON category_seasons;
CREATE POLICY "Allow public read access to category_seasons" ON category_seasons
    FOR SELECT 
    USING (true);

-- 11. Grant public read permissions to anon role
GRANT SELECT ON clubs TO anon;
GRANT SELECT ON matches TO anon;
GRANT SELECT ON teams TO anon;
GRANT SELECT ON standings TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON seasons TO anon;
GRANT SELECT ON club_teams TO anon;
GRANT SELECT ON club_categories TO anon;
GRANT SELECT ON club_category_teams TO anon;
GRANT SELECT ON category_seasons TO anon;

-- 12. Add comments explaining the public access
COMMENT ON POLICY "Allow public read access to clubs" ON clubs IS 
'Allows anonymous visitors to read club information for public pages';

COMMENT ON POLICY "Allow public read access to matches" ON matches IS 
'Allows anonymous visitors to read match data for public pages';

COMMENT ON POLICY "Allow public read access to teams" ON teams IS 
'Allows anonymous visitors to read team data for public pages';

COMMENT ON POLICY "Allow public read access to standings" ON standings IS 
'Allows anonymous visitors to read standings data for public pages';

COMMENT ON POLICY "Allow public read access to categories" ON categories IS 
'Allows anonymous visitors to read category data for public pages';

COMMENT ON POLICY "Allow public read access to seasons" ON seasons IS 
'Allows anonymous visitors to read season data for public pages';

COMMENT ON POLICY "Allow public read access to club_teams" ON club_teams IS 
'Allows anonymous visitors to read club-team relationships for public pages';

COMMENT ON POLICY "Allow public read access to club_categories" ON club_categories IS 
'Allows anonymous visitors to read club-category relationships for public pages';

COMMENT ON POLICY "Allow public read access to club_category_teams" ON club_category_teams IS 
'Allows anonymous visitors to read club-category-team relationships for public pages';

COMMENT ON POLICY "Allow public read access to category_seasons" ON category_seasons IS 
'Allows anonymous visitors to read category-season relationships for public pages';

-- 13. Verify the public access policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('clubs', 'matches', 'teams', 'standings', 'categories', 'seasons', 'club_teams', 'club_categories', 'club_category_teams', 'category_seasons')
AND schemaname = 'public'
AND policyname LIKE '%public read access%'
ORDER BY tablename, policyname;

-- 14. Show summary of changes
SELECT 
    'Public Access Fix Applied' as status,
    'Anonymous visitors can now read public data for visitor pages' as change,
    'Write access remains restricted to authenticated users and admins' as security_note;
