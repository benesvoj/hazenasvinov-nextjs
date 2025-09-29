import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';

import {queryKeys, createMatchQueryKey} from '@/lib/queryKeys';

import {createMatchQuery, MatchQueries} from '@/utils/matchQueryBuilder';

import {Match} from '@/types';

/**
 * Cached hook for fetching matches with teams
 */
export function useMatchesWithTeams(filters: {
  categoryId?: string;
  seasonId?: string;
  ownClubOnly?: boolean;
  status?: 'upcoming' | 'completed' | 'cancelled';
  matchweek?: number;
  dateFrom?: string;
  dateTo?: string;
  includeTeamDetails?: boolean;
  includeCategory?: boolean;
  includeSeason?: boolean;
}) {
  const queryKey = createMatchQueryKey(filters);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const query = createMatchQuery(filters);
      return await query.execute();
    },
    enabled: !!(filters.categoryId || filters.seasonId),
  });
}

/**
 * Cached hook for fetching matches with seasonal split
 */
export function useMatchesSeasonal(filters: {
  categoryId?: string;
  seasonId?: string;
  ownClubOnly?: boolean;
  includeTeamDetails?: boolean;
  includeCategory?: boolean;
  includeSeason?: boolean;
}) {
  const queryKey = queryKeys.matches.seasonal(filters.categoryId, filters.seasonId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const query = createMatchQuery(filters);
      return await query.executeSeasonal();
    },
    enabled: !!(filters.categoryId || filters.seasonId),
  });
}

/**
 * Cached hook for fetching a single match by ID
 */
export function useMatchById(
  matchId: string,
  options: {
    includeTeamDetails?: boolean;
    includeCategory?: boolean;
    includeSeason?: boolean;
  } = {}
) {
  const queryKey = queryKeys.matches.detail(matchId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const query = createMatchQuery(options);
      const result = await query.getById(matchId);
      return result.data[0] || null;
    },
    enabled: !!matchId,
  });
}

/**
 * Cached hook for fetching own club matches
 */
export function useOwnClubMatches(categoryId?: string, seasonId?: string) {
  const queryKey = queryKeys.matches.ownClub(categoryId, seasonId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const query = MatchQueries.ownClub(categoryId, seasonId);
      return await query.execute();
    },
    enabled: !!(categoryId || seasonId),
  });
}

/**
 * Cached hook for fetching public matches
 */
export function usePublicMatches(categoryId?: string) {
  const queryKey = queryKeys.matches.public(categoryId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const query = MatchQueries.public(categoryId);
      return await query.executeSeasonal();
    },
    enabled: true, // Public matches are always enabled
  });
}

/**
 * Cached hook for fetching upcoming matches
 */
export function useUpcomingMatches(categoryId?: string, seasonId?: string) {
  const queryKey = queryKeys.matches.upcoming(categoryId, seasonId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const query = MatchQueries.upcoming(categoryId, seasonId);
      return await query.execute();
    },
    enabled: !!(categoryId || seasonId),
  });
}

/**
 * Cached hook for fetching completed matches
 */
export function useCompletedMatches(categoryId?: string, seasonId?: string) {
  const queryKey = queryKeys.matches.completed(categoryId, seasonId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const query = MatchQueries.completed(categoryId, seasonId);
      return await query.execute();
    },
    enabled: !!(categoryId || seasonId),
  });
}

/**
 * Cached hook for fetching matches by matchweek
 */
export function useMatchesByMatchweek(matchweek: number, categoryId?: string, seasonId?: string) {
  const queryKey = queryKeys.matches.byMatchweek(matchweek, categoryId, seasonId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const query = MatchQueries.byMatchweek(matchweek, categoryId, seasonId);
      return await query.execute();
    },
    enabled: !!(categoryId || seasonId),
  });
}

/**
 * Cached hook for fetching matches by date range
 */
export function useMatchesByDateRange(
  from: string,
  to: string,
  categoryId?: string,
  seasonId?: string
) {
  const queryKey = queryKeys.matches.byDateRange(from, to, categoryId, seasonId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const query = MatchQueries.byDateRange(from, to, categoryId, seasonId);
      return await query.execute();
    },
    enabled: !!(from && to),
  });
}

/**
 * Mutation hook for creating a new match
 */
export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchData: any) => {
      // This would call your API endpoint for creating matches
      // For now, we'll just return the data
      return matchData;
    },
    onSuccess: () => {
      // Invalidate all match queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.matches.all,
      });
    },
  });
}

/**
 * Mutation hook for updating a match
 */
export function useUpdateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({matchId, data}: {matchId: string; data: any}) => {
      // This would call your API endpoint for updating matches
      // For now, we'll just return the data
      return {matchId, data};
    },
    onSuccess: (_, {matchId}) => {
      // Invalidate specific match and all match lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.matches.detail(matchId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.matches.all,
      });
    },
  });
}

/**
 * Mutation hook for deleting a match
 */
export function useDeleteMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      // This would call your API endpoint for deleting matches
      // For now, we'll just return the matchId
      return matchId;
    },
    onSuccess: (matchId) => {
      // Remove the specific match from cache
      queryClient.removeQueries({
        queryKey: queryKeys.matches.detail(matchId),
      });
      // Invalidate all match lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.matches.all,
      });
    },
  });
}

/**
 * Hook for optimistic match updates
 */
export function useOptimisticMatchUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({matchId, data}: {matchId: string; data: any}) => {
      // This would call your API endpoint for updating matches
      return {matchId, data};
    },
    onMutate: async ({matchId, data}) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.matches.detail(matchId),
      });

      // Snapshot the previous value
      const previousMatch = queryClient.getQueryData(queryKeys.matches.detail(matchId));

      // Optimistically update the match
      queryClient.setQueryData(queryKeys.matches.detail(matchId), (old: any) => ({
        ...old,
        ...data,
      }));

      // Return a context object with the snapshotted value
      return {previousMatch};
    },
    onError: (err, {matchId}, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMatch) {
        queryClient.setQueryData(queryKeys.matches.detail(matchId), context.previousMatch);
      }
    },
    onSettled: (_, __, {matchId}) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.matches.detail(matchId),
      });
    },
  });
}
