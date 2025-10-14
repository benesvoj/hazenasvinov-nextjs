import {useQuery} from '@tanstack/react-query';

import {
  getUpcomingBettingMatches,
  getBettingMatchById,
  getUpcomingMatchesByDate,
  BettingMatchOptions,
} from '@/services';
import {MatchBettingData} from '@/types';

/**
 * Hook to fetch upcoming matches for betting
 */
export function useUpcomingBettingMatches(
  options: BettingMatchOptions = {},
  enabled: boolean = true
) {
  return useQuery<MatchBettingData[]>({
    queryKey: ['betting', 'matches', 'upcoming', options],
    queryFn: async () => {
      const {matches, error} = await getUpcomingBettingMatches(options);
      if (error) {
        throw new Error(error);
      }
      return matches;
    },
    enabled, // Only fetch if enabled is true
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

/**
 * Hook to fetch a single match by ID
 */
export function useBettingMatch(matchId: string | null) {
  return useQuery<MatchBettingData | null>({
    queryKey: ['betting', 'match', matchId],
    queryFn: async () => {
      if (!matchId) return null;
      return getBettingMatchById(matchId);
    },
    enabled: !!matchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch upcoming matches grouped by date
 */
export function useUpcomingMatchesByDate(options: BettingMatchOptions = {}) {
  return useQuery<{[date: string]: MatchBettingData[]}>({
    queryKey: ['betting', 'matches', 'byDate', options],
    queryFn: async () => {
      return getUpcomingMatchesByDate(options);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}
