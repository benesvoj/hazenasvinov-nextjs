-- Create Teams Materialized View Migration
-- This creates a materialized view for teams with all details to improve performance
-- and eliminate complex nested queries

-- 1. Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS teams_with_details CASCADE;

-- 2. Create the materialized view with all team, club, category, and season details
CREATE MATERIALIZED VIEW teams_with_details AS
SELECT 
  cct.id as team_id,
  cct.team_suffix,
  cct.is_active,
  cct.created_at,
  cct.updated_at,
  
  -- Club information
  c.id as club_id,
  c.name as club_name,
  c.short_name as club_short_name,
  c.logo_url as club_logo_url,
  c.is_own_club,
  
  -- Category information
  cat.id as category_id,
  cat.name as category_name,
  cat.gender,
  cat.age_group,
  cat.sort_order,
  
  -- Season information
  s.id as season_id,
  s.name as season_name,
  s.start_date as season_start_date,
  s.end_date as season_end_date,
  s.is_active as season_is_active,
  
  -- Computed fields for display
  CONCAT(c.name, ' ', cct.team_suffix) as team_display_name,
  CONCAT(COALESCE(c.short_name, c.name), ' ', cct.team_suffix) as team_short_name
FROM club_category_teams cct
JOIN club_categories cc ON cct.club_category_id = cc.id
JOIN clubs c ON cc.club_id = c.id
JOIN categories cat ON cc.category_id = cat.id
JOIN seasons s ON cc.season_id = s.id
WHERE cct.is_active = true;

-- 3. Create indexes for optimal performance
CREATE INDEX idx_teams_mv_team_id ON teams_with_details(team_id);
CREATE INDEX idx_teams_mv_club_id ON teams_with_details(club_id);
CREATE INDEX idx_teams_mv_category_id ON teams_with_details(category_id);
CREATE INDEX idx_teams_mv_season_id ON teams_with_details(season_id);
CREATE INDEX idx_teams_mv_is_own_club ON teams_with_details(is_own_club);
CREATE INDEX idx_teams_mv_is_active ON teams_with_details(is_active);
CREATE INDEX idx_teams_mv_display_name ON teams_with_details(team_display_name);
CREATE INDEX idx_teams_mv_club_name ON teams_with_details(club_name);
CREATE INDEX idx_teams_mv_category_season ON teams_with_details(category_id, season_id);

-- 4. Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_teams_materialized_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY teams_with_details;
END;
$$ LANGUAGE plpgsql;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION refresh_teams_materialized_view() TO authenticated;
GRANT SELECT ON teams_with_details TO authenticated;
GRANT SELECT ON teams_with_details TO anon;

-- 6. Create trigger function for automatic refresh
CREATE OR REPLACE FUNCTION trigger_refresh_teams_mv()
RETURNS trigger AS $$
BEGIN
  -- Use a background job to refresh the materialized view
  -- This prevents blocking the main transaction
  PERFORM pg_notify('refresh_teams_mv', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Create triggers for automatic refresh when data changes
CREATE TRIGGER refresh_teams_mv_on_insert
  AFTER INSERT ON club_category_teams
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_teams_mv();

CREATE TRIGGER refresh_teams_mv_on_update
  AFTER UPDATE ON club_category_teams
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_teams_mv();

CREATE TRIGGER refresh_teams_mv_on_delete
  AFTER DELETE ON club_category_teams
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_teams_mv();

-- 8. Create triggers for related table changes
CREATE TRIGGER refresh_teams_mv_on_club_update
  AFTER UPDATE ON clubs
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_teams_mv();

CREATE TRIGGER refresh_teams_mv_on_category_update
  AFTER UPDATE ON categories
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_teams_mv();

CREATE TRIGGER refresh_teams_mv_on_season_update
  AFTER UPDATE ON seasons
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_teams_mv();

-- 9. Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW teams_with_details;

-- 10. Add comment for documentation
COMMENT ON MATERIALIZED VIEW teams_with_details IS 'Precomputed teams data with club, category, and season details for improved query performance';
COMMENT ON FUNCTION refresh_teams_materialized_view() IS 'Refreshes the teams materialized view with latest data';
COMMENT ON FUNCTION trigger_refresh_teams_mv() IS 'Trigger function to refresh teams materialized view when underlying data changes';

-- 11. Create a view for backward compatibility (if needed)
CREATE OR REPLACE VIEW teams AS
SELECT 
  team_id as id,
  team_display_name as name,
  team_short_name as short_name,
  club_id,
  club_name,
  club_short_name,
  team_suffix,
  category_id,
  category_name,
  season_id,
  season_name,
  is_active,
  created_at,
  updated_at
FROM teams_with_details;

-- 12. Grant permissions on the compatibility view
GRANT SELECT ON teams TO authenticated;
GRANT SELECT ON teams TO anon;

COMMENT ON VIEW teams IS 'Compatibility view for teams data - points to teams_with_details materialized view';
