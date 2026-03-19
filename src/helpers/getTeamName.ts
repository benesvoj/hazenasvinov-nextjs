import {TournamentMatch} from '@/types';

export function getTeamName(team: TournamentMatch['home_team']): string {
  const club = team.club_category?.club;
  return `${club?.short_name || club?.name || ''} ${team.team_suffix || ''}`.trim();
}
