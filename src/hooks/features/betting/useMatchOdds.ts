import React from 'react';

import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';

import {getOddsForMatch, generateAndSaveOdds, updateMatchOdds, lockOdds, hasOdds} from '@/services';
import {MatchOdds, OddsGenerationInput} from '@/types';

/**
 * Hook to get odds for a match
 * @param matchId Match ID
 * @param enabled Whether to fetch (default: true)
 * @returns Query result with odds
 */
export function useMatchOdds(matchId: string, enabled: boolean = true) {
  return useQuery<MatchOdds | null>({
    queryKey: ['match-odds', matchId],
    queryFn: () => getOddsForMatch(matchId),
    enabled: enabled && !!matchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });
}

/**
 * Hook to check if match has odds
 * @param matchId Match ID
 * @returns Query result with boolean
 */
export function useHasOdds(matchId: string) {
  return useQuery<boolean>({
    queryKey: ['has-odds', matchId],
    queryFn: () => hasOdds(matchId),
    enabled: !!matchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to generate odds for a match
 * @returns Mutation for generating odds
 */
export function useGenerateOdds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OddsGenerationInput) => generateAndSaveOdds(input),
    onSuccess: (success, input) => {
      if (success) {
        // Invalidate queries to refetch odds
        queryClient.invalidateQueries({queryKey: ['match-odds', input.match_id]});
        queryClient.invalidateQueries({queryKey: ['has-odds', input.match_id]});
      }
    },
  });
}

/**
 * Hook to update odds for a match
 * @returns Mutation for updating odds
 */
export function useUpdateOdds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      homeTeamId,
      awayTeamId,
      margin,
    }: {
      matchId: string;
      homeTeamId: string;
      awayTeamId: string;
      margin?: number;
    }) => updateMatchOdds(matchId, homeTeamId, awayTeamId, margin),
    onSuccess: (success, variables) => {
      if (success) {
        queryClient.invalidateQueries({queryKey: ['match-odds', variables.matchId]});
        queryClient.invalidateQueries({queryKey: ['has-odds', variables.matchId]});
      }
    },
  });
}

/**
 * Hook to lock odds for a match
 * @returns Mutation for locking odds
 */
export function useLockOdds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => lockOdds(matchId),
    onSuccess: (success, matchId) => {
      if (success) {
        queryClient.invalidateQueries({queryKey: ['match-odds', matchId]});
      }
    },
  });
}

/**
 * Hook to get odds with fallback generation
 * Automatically generates odds if they don't exist
 * @param matchId Match ID
 * @param homeTeamId Home team ID
 * @param awayTeamId Away team ID
 * @param autoGenerate Whether to auto-generate if missing (default: false)
 * @returns Query result with odds
 */
export function useMatchOddsWithFallback(
  matchId: string,
  homeTeamId: string,
  awayTeamId: string,
  autoGenerate: boolean = false
) {
  const {data: hasOddsData, isLoading: checkingOdds} = useHasOdds(matchId);
  const {data: odds, isLoading: loadingOdds} = useMatchOdds(matchId, !!hasOddsData);
  const generateMutation = useGenerateOdds();

  // Auto-generate odds if they don't exist and autoGenerate is true
  React.useEffect(() => {
    if (autoGenerate && hasOddsData === false && !generateMutation.isPending) {
      generateMutation.mutate({
        match_id: matchId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        bookmaker_margin: 0.05,
      });
    }
  }, [autoGenerate, hasOddsData, matchId, homeTeamId, awayTeamId, generateMutation]);

  return {
    odds,
    isLoading: checkingOdds || loadingOdds || generateMutation.isPending,
    isGenerating: generateMutation.isPending,
    hasOdds: hasOddsData,
    error: generateMutation.error,
  };
}
