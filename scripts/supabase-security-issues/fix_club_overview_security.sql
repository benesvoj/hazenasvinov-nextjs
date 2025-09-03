-- Fix club_overview SECURITY DEFINER security warning
-- This script ensures the club_overview view is properly secured

-- 1. Drop the existing view if it exists
DROP VIEW IF EXISTS club_overview;

-- 2. Recreate the view without SECURITY DEFINER
-- This view only exposes public club information and aggregated counts
CREATE OR REPLACE VIEW club_overview AS
SELECT 
    c.id,
    c.name,
    c.short_name,
    c.city,
    c.founded_year,
    c.logo_url,
    c.is_active,
    COUNT(ct.team_id) as team_count,
    COUNT(cc.id) as category_count
FROM clubs c
LEFT JOIN club_teams ct ON c.id = ct.club_id
LEFT JOIN club_categories cc ON c.id = cc.club_id AND cc.is_active = true
GROUP BY c.id, c.name, c.short_name, c.city, c.founded_year, c.logo_url, c.is_active;

-- 3. Grant appropriate permissions
-- This view contains only public club information, so it's safe for authenticated users
GRANT SELECT ON club_overview TO authenticated;

-- 4. Add comment explaining the view's purpose
COMMENT ON VIEW club_overview IS 'Public club information with team and category counts - safe for all authenticated users';

-- 5. Verify the view was created without SECURITY DEFINER
-- This query will show if the view has SECURITY DEFINER (it shouldn't)
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'club_overview' 
AND schemaname = 'public';
