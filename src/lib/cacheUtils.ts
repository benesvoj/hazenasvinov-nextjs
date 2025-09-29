import {QueryClient} from '@tanstack/react-query';

import {queryKeys, getMatchInvalidationKeys} from './queryKeys';

/**
 * Utility functions for cache invalidation and management
 */

/**
 * Invalidate all match-related queries
 */
export function invalidateAllMatches(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.matches.all,
  });
}

/**
 * Invalidate matches for a specific category
 */
export function invalidateMatchesByCategory(queryClient: QueryClient, categoryId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.matches.byCategory(categoryId),
  });
}

/**
 * Invalidate matches for a specific season
 */
export function invalidateMatchesBySeason(queryClient: QueryClient, seasonId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.matches.bySeason(seasonId),
  });
}

/**
 * Invalidate a specific match
 */
export function invalidateMatch(queryClient: QueryClient, matchId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.matches.detail(matchId),
  });
}

/**
 * Invalidate own club matches
 */
export function invalidateOwnClubMatches(
  queryClient: QueryClient,
  categoryId?: string,
  seasonId?: string
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.matches.ownClub(categoryId, seasonId),
  });
}

/**
 * Invalidate public matches
 */
export function invalidatePublicMatches(queryClient: QueryClient, categoryId?: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.matches.public(categoryId),
  });
}

/**
 * Invalidate seasonal matches
 */
export function invalidateSeasonalMatches(
  queryClient: QueryClient,
  categoryId?: string,
  seasonId?: string
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.matches.seasonal(categoryId, seasonId),
  });
}

/**
 * Prefetch matches for a category and season
 */
export function prefetchMatches(
  queryClient: QueryClient,
  categoryId: string,
  seasonId?: string,
  options: {
    includeTeamDetails?: boolean;
    includeCategory?: boolean;
    includeSeason?: boolean;
  } = {}
) {
  const queryKey = queryKeys.matches.byCategory(categoryId, seasonId);

  return queryClient.prefetchQuery({
    queryKey,
    queryFn: async () => {
      const {createMatchQuery} = await import('@/utils/matchQueryBuilder');
      const query = createMatchQuery({
        categoryId,
        seasonId,
        ...options,
      });
      return await query.execute();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Prefetch seasonal matches
 */
export function prefetchSeasonalMatches(
  queryClient: QueryClient,
  categoryId: string,
  seasonId?: string,
  options: {
    includeTeamDetails?: boolean;
    includeCategory?: boolean;
    includeSeason?: boolean;
  } = {}
) {
  const queryKey = queryKeys.matches.seasonal(categoryId, seasonId);

  return queryClient.prefetchQuery({
    queryKey,
    queryFn: async () => {
      const {createMatchQuery} = await import('@/utils/matchQueryBuilder');
      const query = createMatchQuery({
        categoryId,
        seasonId,
        ...options,
      });
      return await query.executeSeasonal();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Set match data in cache (useful for optimistic updates)
 */
export function setMatchData(queryClient: QueryClient, matchId: string, data: any) {
  return queryClient.setQueryData(queryKeys.matches.detail(matchId), data);
}

/**
 * Get match data from cache
 */
export function getMatchData(queryClient: QueryClient, matchId: string) {
  return queryClient.getQueryData(queryKeys.matches.detail(matchId));
}

/**
 * Remove match from cache
 */
export function removeMatchFromCache(queryClient: QueryClient, matchId: string) {
  return queryClient.removeQueries({
    queryKey: queryKeys.matches.detail(matchId),
  });
}

/**
 * Clear all match cache
 */
export function clearMatchCache(queryClient: QueryClient) {
  return queryClient.removeQueries({
    queryKey: queryKeys.matches.all,
  });
}

/**
 * Get cache statistics
 */
export function getCacheStats(queryClient: QueryClient) {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  const matchQueries = queries.filter((query) => query.queryKey[0] === 'matches');

  return {
    totalQueries: queries.length,
    matchQueries: matchQueries.length,
    cacheSize: JSON.stringify(cache).length,
  };
}
