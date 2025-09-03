-- Create a view to help with team suffix logic
-- This view provides team information with category context and team counts per club per category

CREATE OR REPLACE VIEW team_suffix_helper AS
SELECT 
    t.id as team_id,
    t.team_suffix,
    t.club_category_id,
    cc.category_id,
    c.id as club_id,
    c.name as club_name,
    c.short_name as club_short_name,
    c.logo_url as club_logo_url,
    c.is_own_club,
    cat.code as category_code,
    cat.name as category_name,
    -- Count of teams this club has in this specific category
    (SELECT COUNT(*) 
     FROM club_category_teams t2 
     JOIN club_categories cc2 ON t2.club_category_id = cc2.id 
     WHERE cc2.club_id = c.id AND cc2.category_id = cc.category_id
    ) as team_count_in_category
FROM club_category_teams t
JOIN club_categories cc ON t.club_category_id = cc.id
JOIN clubs c ON cc.club_id = c.id
JOIN categories cat ON cc.category_id = cat.id
WHERE cc.is_active = true AND c.is_active = true;

-- Note: Views cannot have indexes in PostgreSQL
-- The underlying tables (club_category_teams, club_categories, clubs, categories) 
-- should have appropriate indexes for optimal performance
