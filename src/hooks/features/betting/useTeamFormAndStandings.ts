import {useQuery} from '@tanstack/react-query';

import {getTeamStats} from '@/services';

interface TeamFormData {
  form: string; // e.g., "WWDLW"
  position?: number;
  points?: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
}

/**
 * Get team form (last 5 matches) and basic stats
 */
async function getTeamForm(teamId: string): Promise<TeamFormData | null> {
  try {
    const stats = await getTeamStats(teamId, 15);

    if (!stats) {
      return null;
    }

    // Calculate points (3 for win, 1 for draw, 0 for loss)
    const points = stats.wins * 2 + stats.draws;

    return {
      form: stats.form, // Already in format "WWDLW"
      points,
      matches_played: stats.matches_played,
      wins: stats.wins,
      draws: stats.draws,
      losses: stats.losses,
    };
  } catch (error) {
    console.error('Error fetching team form:', error);
    return null;
  }
}

/**
 * Hook to get team form and standings data
 * @param teamId Team ID
 * @param enabled Whether to fetch (default: true)
 */
export function useTeamForm(teamId: string, enabled: boolean = true) {
  return useQuery<TeamFormData | null>({
    queryKey: ['team-form', teamId],
    queryFn: () => getTeamForm(teamId),
    enabled: enabled && !!teamId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to get form for both teams in a match
 * @param homeTeamId Home team ID
 * @param awayTeamId Away team ID
 */
export function useMatchTeamsForm(homeTeamId: string, awayTeamId: string) {
  const {data: homeForm, isLoading: homeLoading} = useTeamForm(homeTeamId);
  const {data: awayForm, isLoading: awayLoading} = useTeamForm(awayTeamId);

  return {
    homeForm,
    awayForm,
    isLoading: homeLoading || awayLoading,
  };
}

/**
 * Get standings position from category standings
 * This is a simplified version - you may want to enhance this to fetch actual standings
 */
export async function getTeamStandingsPosition(
  teamId: string,
  categoryId: string,
  seasonId: string
): Promise<{position: number; total: number} | null> {
  // TODO: Implement actual standings fetch from your standings table
  // For now, return null - you can implement this based on your standings data structure
  return null;
}
