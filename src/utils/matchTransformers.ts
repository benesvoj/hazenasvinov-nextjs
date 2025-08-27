export function transformMatchData(
    matches: any[], 
    teamCounts: Map<string, number>
  ) {
    return matches.map((match: any) => {
      const homeTeam = match.home_team;
      const awayTeam = match.away_team;
  
      const getDisplayName = (team: any) => {
        if (!team?.club_category?.club) return 'Neznámý tým';
        
        const clubName = team.club_category.club.name;
        const teamSuffix = team.team_suffix || 'A';
        const clubId = team.club_category.club.id;
        const teamCount = teamCounts.get(clubId) || 0;
        
        return teamCount > 1 ? `${clubName} ${teamSuffix}` : clubName;
      };
  
      return {
        ...match,
        home_team: {
          ...homeTeam,
          club_id: homeTeam?.club_category?.club?.id || null,
          club_name: homeTeam?.club_category?.club?.name || 'Neznámý klub',
          team_suffix: homeTeam?.team_suffix || 'A',
          display_name: getDisplayName(homeTeam),
          short_name: homeTeam?.club_category?.club?.short_name || null
        },
        away_team: {
          ...awayTeam,
          club_id: awayTeam?.club_category?.club?.id || null,
          club_name: awayTeam?.club_category?.club?.name || 'Neznámý klub',
          team_suffix: awayTeam?.team_suffix || 'A',
          display_name: getDisplayName(awayTeam),
          short_name: awayTeam?.club_category?.club?.short_name || null
        }
      };
    });
  }