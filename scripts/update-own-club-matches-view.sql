-- Update the own_club_matches materialized view to include category and season information
-- This script should be run after the initial database optimization

-- Drop the existing materialized view
DROP MATERIALIZED VIEW IF EXISTS own_club_matches;

-- Recreate the materialized view with category and season information
CREATE MATERIALIZED VIEW own_club_matches AS
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
  -- Category information
  c.id as category_id_full,
  c.name as category_name,
  c.description as category_description,
  c.slug as category_slug,
  -- Season information
  s.id as season_id_full,
  s.name as season_name,
  s.start_date as season_start_date,
  s.end_date as season_end_date,
  -- Home team information
  hc.is_own_club as home_is_own_club,
  hc.name as home_club_name,
  hc.short_name as home_club_short_name,
  hc.logo_url as home_club_logo_url,
  hcct.team_suffix as home_team_suffix,
  -- Away team information
  ac.is_own_club as away_is_own_club,
  ac.name as away_club_name,
  ac.short_name as away_club_short_name,
  ac.logo_url as away_club_logo_url,
  acct.team_suffix as away_team_suffix
FROM matches m
LEFT JOIN categories c ON m.category_id = c.id
LEFT JOIN seasons s ON m.season_id = s.id
LEFT JOIN club_category_teams hcct ON m.home_team_id = hcct.id
LEFT JOIN club_categories hcc ON hcct.club_category_id = hcc.id
LEFT JOIN clubs hc ON hcc.club_id = hc.id
LEFT JOIN club_category_teams acct ON m.away_team_id = acct.id
LEFT JOIN club_categories acc ON acct.club_category_id = acc.id
LEFT JOIN clubs ac ON acc.club_id = ac.id
WHERE (hc.is_own_club = true OR ac.is_own_club = true);

-- Create indexes for the updated materialized view
CREATE INDEX IF NOT EXISTS idx_own_club_matches_category_season 
ON own_club_matches(category_id, season_id);

CREATE INDEX IF NOT EXISTS idx_own_club_matches_date 
ON own_club_matches(date);

CREATE INDEX IF NOT EXISTS idx_own_club_matches_status 
ON own_club_matches(status);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW own_club_matches;

-- Grant permissions
GRANT SELECT ON own_club_matches TO authenticated;

-- Add comment
COMMENT ON MATERIALIZED VIEW own_club_matches IS 'Matches involving own club teams with category and season information';
