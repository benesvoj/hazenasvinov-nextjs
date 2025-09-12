-- Database query optimization scripts for match queries
-- Run these scripts to improve query performance

-- 1. Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_matches_category_season 
ON matches(category_id, season_id);

CREATE INDEX IF NOT EXISTS idx_matches_date_status 
ON matches(date, status);

CREATE INDEX IF NOT EXISTS idx_matches_home_team 
ON matches(home_team_id);

CREATE INDEX IF NOT EXISTS idx_matches_away_team 
ON matches(away_team_id);

CREATE INDEX IF NOT EXISTS idx_matches_matchweek 
ON matches(matchweek) WHERE matchweek IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_matches_created_at 
ON matches(created_at);

-- 2. Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_matches_category_season_status 
ON matches(category_id, season_id, status);

CREATE INDEX IF NOT EXISTS idx_matches_category_season_date 
ON matches(category_id, season_id, date);

-- Note: Cannot use subqueries in index predicates, so we'll create simpler indexes
-- and handle own club filtering in the application layer or with views

-- Index for home team matches (will be filtered by application)
CREATE INDEX IF NOT EXISTS idx_matches_home_team_category_season 
ON matches(home_team_id, category_id, season_id);

-- Index for away team matches (will be filtered by application)
CREATE INDEX IF NOT EXISTS idx_matches_away_team_category_season 
ON matches(away_team_id, category_id, season_id);

-- 3. Create indexes for team and club queries
CREATE INDEX IF NOT EXISTS idx_club_category_teams_team_id 
ON club_category_teams(team_id);

CREATE INDEX IF NOT EXISTS idx_club_category_teams_club_category 
ON club_category_teams(club_category_id);

CREATE INDEX IF NOT EXISTS idx_club_categories_club_id 
ON club_categories(club_id);

CREATE INDEX IF NOT EXISTS idx_clubs_is_own_club 
ON clubs(is_own_club) WHERE is_own_club = true;

-- 4. Create indexes for category and season queries
CREATE INDEX IF NOT EXISTS idx_categories_slug 
ON categories(slug);

CREATE INDEX IF NOT EXISTS idx_seasons_is_active 
ON seasons(is_active) WHERE is_active = true;

-- 5. Create partial indexes for specific use cases
CREATE INDEX IF NOT EXISTS idx_matches_upcoming 
ON matches(date, time, category_id, season_id) 
WHERE status = 'upcoming';

CREATE INDEX IF NOT EXISTS idx_matches_completed 
ON matches(date, category_id, season_id) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_matches_recent 
ON matches(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- 6. Create indexes for foreign key relationships
CREATE INDEX IF NOT EXISTS idx_matches_category_fk 
ON matches(category_id);

CREATE INDEX IF NOT EXISTS idx_matches_season_fk 
ON matches(season_id);

-- 7. Analyze tables to update statistics
ANALYZE matches;
ANALYZE club_category_teams;
ANALYZE club_categories;
ANALYZE clubs;
ANALYZE categories;
ANALYZE seasons;

-- 8. Create materialized view for frequently accessed match statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS match_stats AS
SELECT 
  m.category_id,
  m.season_id,
  COUNT(*) as total_matches,
  COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_matches,
  COUNT(CASE WHEN m.status = 'upcoming' THEN 1 END) as upcoming_matches,
  AVG(CASE WHEN m.status = 'completed' THEN m.home_score + m.away_score END) as avg_goals_per_match,
  MIN(m.date) as first_match_date,
  MAX(m.date) as last_match_date
FROM matches m
GROUP BY m.category_id, m.season_id;

-- 8b. Create materialized view for own club matches (more efficient than subquery indexes)
CREATE MATERIALIZED VIEW IF NOT EXISTS own_club_matches AS
SELECT 
  m.*,
  hc.is_own_club as home_is_own_club,
  ac.is_own_club as away_is_own_club,
  hc.name as home_club_name,
  hc.short_name as home_club_short_name,
  hc.logo_url as home_club_logo_url,
  ac.name as away_club_name,
  ac.short_name as away_club_short_name,
  ac.logo_url as away_club_logo_url,
  hcct.team_suffix as home_team_suffix,
  acct.team_suffix as away_team_suffix
FROM matches m
LEFT JOIN club_category_teams hcct ON m.home_team_id = hcct.id
LEFT JOIN club_categories hcc ON hcct.club_category_id = hcc.id
LEFT JOIN clubs hc ON hcc.club_id = hc.id
LEFT JOIN club_category_teams acct ON m.away_team_id = acct.id
LEFT JOIN club_categories acc ON acct.club_category_id = acc.id
LEFT JOIN clubs ac ON acc.club_id = ac.id
WHERE hc.is_own_club = true OR ac.is_own_club = true;

-- Create indexes on materialized views
CREATE INDEX IF NOT EXISTS idx_match_stats_category_season 
ON match_stats(category_id, season_id);

CREATE INDEX IF NOT EXISTS idx_own_club_matches_category_season 
ON own_club_matches(category_id, season_id);

CREATE INDEX IF NOT EXISTS idx_own_club_matches_date 
ON own_club_matches(date);

CREATE INDEX IF NOT EXISTS idx_own_club_matches_status 
ON own_club_matches(status);

-- 9. Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_match_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW match_stats;
  REFRESH MATERIALIZED VIEW own_club_matches;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to automatically refresh materialized view
CREATE OR REPLACE FUNCTION trigger_refresh_match_stats()
RETURNS trigger AS $$
BEGIN
  PERFORM refresh_match_stats();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for match table changes
DROP TRIGGER IF EXISTS refresh_match_stats_on_insert ON matches;
CREATE TRIGGER refresh_match_stats_on_insert
  AFTER INSERT ON matches
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_match_stats();

DROP TRIGGER IF EXISTS refresh_match_stats_on_update ON matches;
CREATE TRIGGER refresh_match_stats_on_update
  AFTER UPDATE ON matches
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_match_stats();

DROP TRIGGER IF EXISTS refresh_match_stats_on_delete ON matches;
CREATE TRIGGER refresh_match_stats_on_delete
  AFTER DELETE ON matches
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_match_stats();

-- 11. Create view for optimized match queries with team details
CREATE OR REPLACE VIEW matches_with_teams_optimized AS
SELECT 
  m.id,
  m.date,
  m.time,
  m.venue,
  m.competition,
  m.status,
  m.home_score,
  m.away_score,
  m.home_score_halftime,
  m.away_score_halftime,
  m.matchweek,
  m.match_number,
  m.category_id,
  m.season_id,
  m.home_team_id,
  m.away_team_id,
  m.created_at,
  m.updated_at,
  hcct.id as home_team_club_category_id,
  hcct.team_suffix as home_team_suffix,
  hc.id as home_club_id,
  hc.name as home_club_name,
  hc.short_name as home_club_short_name,
  hc.logo_url as home_club_logo_url,
  hc.is_own_club as home_club_is_own_club,
  acct.id as away_team_club_category_id,
  acct.team_suffix as away_team_suffix,
  ac.id as away_club_id,
  ac.name as away_club_name,
  ac.short_name as away_club_short_name,
  ac.logo_url as away_club_logo_url,
  ac.is_own_club as away_club_is_own_club
FROM matches m
LEFT JOIN club_category_teams hcct ON m.home_team_id = hcct.id
LEFT JOIN club_categories hcc ON hcct.club_category_id = hcc.id
LEFT JOIN clubs hc ON hcc.club_id = hc.id
LEFT JOIN club_category_teams acct ON m.away_team_id = acct.id
LEFT JOIN club_categories acc ON acct.club_category_id = acc.id
LEFT JOIN clubs ac ON acc.club_id = ac.id;

-- 12. Note: Cannot create indexes on views, but the underlying table indexes will help
-- The view will benefit from the indexes already created on the matches table

-- 13. Create function to get match statistics efficiently
CREATE OR REPLACE FUNCTION get_match_stats(
  p_category_id UUID,
  p_season_id UUID
)
RETURNS TABLE(
  total_matches BIGINT,
  completed_matches BIGINT,
  upcoming_matches BIGINT,
  avg_goals_per_match NUMERIC,
  first_match_date DATE,
  last_match_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.total_matches,
    ms.completed_matches,
    ms.upcoming_matches,
    ms.avg_goals_per_match,
    ms.first_match_date,
    ms.last_match_date
  FROM match_stats ms
  WHERE ms.category_id = p_category_id 
    AND ms.season_id = p_season_id;
END;
$$ LANGUAGE plpgsql;

-- 14. Create function to get own club matches efficiently
CREATE OR REPLACE FUNCTION get_own_club_matches(
  p_category_id UUID,
  p_season_id UUID,
  p_limit INTEGER DEFAULT NULL,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  match_id UUID,
  match_date DATE,
  match_time TIME,
  venue TEXT,
  status TEXT,
  home_score INTEGER,
  away_score INTEGER,
  home_score_halftime INTEGER,
  away_score_halftime INTEGER,
  matchweek INTEGER,
  match_number INTEGER,
  home_team_id UUID,
  away_team_id UUID,
  home_team_suffix TEXT,
  away_team_suffix TEXT,
  home_club_name TEXT,
  away_club_name TEXT,
  home_club_short_name TEXT,
  away_club_short_name TEXT,
  home_club_logo_url TEXT,
  away_club_logo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as match_id,
    m.date as match_date,
    m.time as match_time,
    m.venue,
    m.status,
    m.home_score,
    m.away_score,
    m.home_score_halftime,
    m.away_score_halftime,
    m.matchweek,
    m.match_number,
    m.home_team_id,
    m.away_team_id,
    hcct.team_suffix as home_team_suffix,
    acct.team_suffix as away_team_suffix,
    hc.name as home_club_name,
    ac.name as away_club_name,
    hc.short_name as home_club_short_name,
    ac.short_name as away_club_short_name,
    hc.logo_url as home_club_logo_url,
    ac.logo_url as away_club_logo_url
  FROM matches m
  JOIN club_category_teams hcct ON m.home_team_id = hcct.id
  JOIN club_categories hcc ON hcct.club_category_id = hcc.id
  JOIN clubs hc ON hcc.club_id = hc.id
  JOIN club_category_teams acct ON m.away_team_id = acct.id
  JOIN club_categories acc ON acct.club_category_id = acc.id
  JOIN clubs ac ON acc.club_id = ac.id
  WHERE m.category_id = p_category_id 
    AND m.season_id = p_season_id
    AND (hc.is_own_club = true OR ac.is_own_club = true)
  ORDER BY m.date ASC, m.time ASC
  LIMIT COALESCE(p_limit, 1000)
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 15. Grant necessary permissions
GRANT SELECT ON matches_with_teams_optimized TO authenticated;
GRANT SELECT ON match_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_match_stats(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_own_club_matches(UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_match_stats() TO authenticated;

-- 16. Create comments for documentation
COMMENT ON MATERIALIZED VIEW match_stats IS 'Precomputed statistics for matches by category and season';
COMMENT ON VIEW matches_with_teams_optimized IS 'Optimized view for match queries with team and club details';
COMMENT ON FUNCTION get_match_stats(UUID, UUID) IS 'Get match statistics for a specific category and season';
COMMENT ON FUNCTION get_own_club_matches(UUID, UUID, INTEGER, INTEGER) IS 'Get matches involving own club teams with pagination';
COMMENT ON FUNCTION refresh_match_stats() IS 'Refresh the match statistics materialized view';
