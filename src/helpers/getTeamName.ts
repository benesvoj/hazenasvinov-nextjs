import {TournamentMatch} from '@/types';

/**
 * Renders a tournament team as "<club> <suffix>".
 *
 * `team` is optional-chained even though the type says it is always there:
 * TournamentEmbed hit missing teams in practice, and its local copy guarded
 * against them. Folding the four copies into one keeps the safer behaviour
 * rather than the stricter one — a missing team renders as an empty string
 * instead of throwing inside a render.
 */
export function getTeamName(team?: TournamentMatch['home_team'] | null): string {
  const club = team?.club_category?.club;
  return `${club?.short_name || club?.name || ''} ${team?.team_suffix || ''}`.trim();
}
