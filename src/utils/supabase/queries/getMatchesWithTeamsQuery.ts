export function getMatchesWithTeamsQuery() {
    return `
      *,
      home_team:club_category_teams!home_team_id(
        team_suffix,
        club_category:club_categories(
          club:clubs(id, name, short_name, logo_url, is_own_club)
        )
      ),
      away_team:club_category_teams!away_team_id(
        team_suffix,
        club_category:club_categories(
          club:clubs(id, name, short_name, logo_url, is_own_club)
        )
      ),
      category:categories(name),
      season:seasons(name)
    `;
  }