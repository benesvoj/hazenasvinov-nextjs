/**
 * Cached version of useFetchMatches using React Query
 * This replaces the original useFetchMatches with caching capabilities
 */

import {useMatchesSeasonal} from '@/hooks/shared/queries/useMatchQueries';

export interface UseCachedMatchesOptions {
  /**
   * Whether to filter matches to only show those where the user's club is playing
   * - `true` (default): Show only own club matches (public pages)
   * - `false`: Show all matches (admin pages)
   */
  ownClubOnly?: boolean;

  /**
   * Whether to include detailed team information
   * - `true` (default): Include team names, logos, club info
   * - `false`: Basic team info only
   */
  includeTeamDetails?: boolean;

  /**
   * Whether to include standings data
   * - `false` (default): No standings data
   * - `true`: Include standings (future feature)
   */
  includeStandings?: boolean;
}

/**
 * Cached hook to fetch matches for a specific category and season
 * This is a drop-in replacement for useFetchMatches with caching
 *
 * @param categoryId - The category id (UUID)
 * @param seasonId - Optional season ID. If not provided, uses active season
 * @param options - Configuration options for filtering and data inclusion
 *
 * @example
 * // Public page - show only own club matches for active season
 * const { data: matches, isLoading, error } = useCachedMatches('men');
 *
 * // Admin page - show all matches for specific season
 * const { data: matches, isLoading, error } = useCachedMatches('men', 'season-id', { ownClubOnly: false });
 */
export function useCachedMatches(
  categoryId: string,
  seasonId?: string,
  options: UseCachedMatchesOptions = {}
) {
  const {ownClubOnly = true, includeTeamDetails = true, includeStandings = false} = options;

  const query = useMatchesSeasonal({
    categoryId,
    seasonId,
    ownClubOnly,
    includeTeamDetails,
    includeCategory: true,
    includeSeason: includeStandings,
  });

  return {
    matches: query.data || {autumn: [], spring: []},
    loading: query.isLoading,
    error: query.error,
    debugInfo: null, // React Query handles this internally
    refreshMatches: query.refetch,
    isRefetching: query.isRefetching,
    isStale: query.isStale,
    isFetching: query.isFetching,
  };
}

/**
 * Cached hook for public matches (no authentication required)
 */
export function useCachedPublicMatches(categoryId?: string) {
  const query = useMatchesSeasonal({
    categoryId,
    includeTeamDetails: true,
    includeCategory: true,
  });

  return {
    matches: query.data || {autumn: [], spring: []},
    loading: query.isLoading,
    error: query.error,
    debugInfo: null,
    refreshMatches: query.refetch,
    isRefetching: query.isRefetching,
    isStale: query.isStale,
    isFetching: query.isFetching,
  };
}

/**
 * Cached hook for own club matches
 */
export function useCachedOwnClubMatches(categoryId?: string, seasonId?: string) {
  const query = useMatchesSeasonal({
    categoryId,
    seasonId,
    ownClubOnly: true,
    includeTeamDetails: true,
    includeCategory: true,
  });

  return {
    matches: query.data || {autumn: [], spring: []},
    loading: query.isLoading,
    error: query.error,
    debugInfo: null,
    refreshMatches: query.refetch,
    isRefetching: query.isRefetching,
    isStale: query.isStale,
    isFetching: query.isFetching,
  };
}
