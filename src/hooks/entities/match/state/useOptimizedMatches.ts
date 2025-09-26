/**
 * Performance-optimized React hooks for match queries with memoization
 */

import {useState, useEffect, useCallback, useMemo} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
  getMatchesBasicOptimized,
  getMatchesWithTeamsOptimized,
  getMatchesSeasonalOptimized,
  getOwnClubMatchesOptimized,
  preloadMatchData,
  invalidateMatchCache,
} from '@/services/optimizedMatchQueries';
import {cacheKeys} from '@/lib/performanceCache';
import type {
  MatchQueryOptions,
  MatchQueryResult,
  SeasonalMatchQueryResult,
} from '@/services/matchQueries';

// Memoized query options to prevent unnecessary re-renders
const createQueryOptions = (options: MatchQueryOptions) =>
  JSON.stringify(options, Object.keys(options).sort());

// Helper hook to create stable query options
function useStableQueryOptions(options: MatchQueryOptions) {
  return useMemo(() => createQueryOptions(options), [options]);
}

/**
 * Optimized hook for basic match queries
 */
export function useOptimizedMatchesBasic(options: MatchQueryOptions = {}) {
  const stableOptions = useStableQueryOptions(options);
  const queryKey = useMemo(() => ['matches', 'basic', stableOptions], [stableOptions]);

  const query = useQuery({
    queryKey,
    queryFn: () => getMatchesBasicOptimized(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    matches: query.data?.data || [],
    loading: query.isLoading,
    error: query.error?.message || query.data?.error || null,
    count: query.data?.count || 0,
    refetch: query.refetch,
  };
}

/**
 * Optimized hook for match queries with team details
 */
export function useOptimizedMatchesWithTeams(options: MatchQueryOptions = {}) {
  const stableOptions = useStableQueryOptions(options);
  const queryKey = useMemo(() => ['matches', 'withTeams', stableOptions], [stableOptions]);

  const query = useQuery({
    queryKey,
    queryFn: () => getMatchesWithTeamsOptimized(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    matches: query.data?.data || [],
    loading: query.isLoading,
    error: query.error?.message || query.data?.error || null,
    count: query.data?.count || 0,
    refetch: query.refetch,
  };
}

/**
 * Optimized hook for seasonal match queries
 */
export function useOptimizedMatchesSeasonal(
  categoryId: string,
  seasonId: string,
  options: Omit<MatchQueryOptions, 'categoryId' | 'seasonId'> = {}
) {
  const stableOptions = useStableQueryOptions(options);
  const queryKey = useMemo(
    () => ['matches', 'seasonal', categoryId, seasonId, stableOptions],
    [categoryId, seasonId, stableOptions]
  );

  const query = useQuery({
    queryKey,
    queryFn: () => getMatchesSeasonalOptimized(categoryId, seasonId, options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!(categoryId && seasonId),
  });

  return {
    autumn: query.data?.autumn || [],
    spring: query.data?.spring || [],
    loading: query.isLoading,
    error: query.error?.message || query.data?.error || null,
    refetch: query.refetch,
  };
}

/**
 * Optimized hook for own club matches
 */
export function useOptimizedOwnClubMatches(
  categoryId?: string,
  seasonId?: string,
  options: Omit<MatchQueryOptions, 'categoryId' | 'seasonId'> = {}
) {
  const stableOptions = useStableQueryOptions(options);
  const queryKey = useMemo(
    () => ['matches', 'ownClub', categoryId, seasonId, stableOptions],
    [categoryId, seasonId, stableOptions]
  );

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!categoryId || !seasonId) {
        throw new Error('categoryId and seasonId are required');
      }
      return getOwnClubMatchesOptimized(categoryId, seasonId, options);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!(categoryId && seasonId),
  });

  // Memoized combined matches to prevent unnecessary re-renders
  const allMatches = useMemo(() => {
    if (!query.data) return [];
    return [...(query.data.autumn || []), ...(query.data.spring || [])];
  }, [query.data]);

  // Memoized upcoming matches
  const upcomingMatches = useMemo(() => {
    const now = new Date();
    return allMatches.filter((match) => match.status === 'upcoming' && new Date(match.date) >= now);
  }, [allMatches]);

  // Memoized recent results
  const recentResults = useMemo(() => {
    const now = new Date();
    return allMatches
      .filter((match) => match.status === 'completed' && new Date(match.date) <= now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Limit to 10 most recent
  }, [allMatches]);

  return {
    autumn: query.data?.autumn || [],
    spring: query.data?.spring || [],
    allMatches,
    upcomingMatches,
    recentResults,
    loading: query.isLoading,
    error: query.error?.message || query.data?.error || null,
    refetch: query.refetch,
  };
}

/**
 * Optimized hook for match data with preloading
 */
export function useOptimizedMatchDataWithPreload(
  categoryId: string,
  seasonId: string,
  options: Omit<MatchQueryOptions, 'categoryId' | 'seasonId'> = {}
) {
  const queryClient = useQueryClient();

  // Preload data when category or season changes
  useEffect(() => {
    if (categoryId && seasonId) {
      preloadMatchData(categoryId, seasonId);
    }
  }, [categoryId, seasonId]);

  // Get seasonal matches
  const seasonalQuery = useOptimizedMatchesSeasonal(categoryId, seasonId, options);

  // Get own club matches
  const ownClubQuery = useOptimizedOwnClubMatches(categoryId, seasonId, options);

  // Memoized combined data
  const combinedData = useMemo(() => {
    return {
      seasonal: {
        autumn: seasonalQuery.autumn,
        spring: seasonalQuery.spring,
        loading: seasonalQuery.loading,
        error: seasonalQuery.error,
      },
      ownClub: {
        autumn: ownClubQuery.autumn,
        spring: ownClubQuery.spring,
        allMatches: ownClubQuery.allMatches,
        upcomingMatches: ownClubQuery.upcomingMatches,
        recentResults: ownClubQuery.recentResults,
        loading: ownClubQuery.loading,
        error: ownClubQuery.error,
      },
    };
  }, [seasonalQuery, ownClubQuery]);

  // Invalidate cache function
  const invalidateCache = useCallback(() => {
    invalidateMatchCache(categoryId, seasonId);
    queryClient.invalidateQueries({
      queryKey: ['matches', 'seasonal', categoryId, seasonId],
    });
    queryClient.invalidateQueries({
      queryKey: ['matches', 'ownClub', categoryId, seasonId],
    });
  }, [categoryId, seasonId, queryClient]);

  return {
    ...combinedData,
    invalidateCache,
  };
}

/**
 * Hook for match data with lazy loading and pagination
 */
export function useOptimizedMatchesWithPagination(
  options: MatchQueryOptions & {pageSize?: number} = {}
) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = options.pageSize || 20;

  const paginatedOptions = useMemo(
    () => ({
      ...options,
      limit: pageSize,
      offset: currentPage * pageSize,
    }),
    [options, pageSize, currentPage]
  );

  const query = useOptimizedMatchesWithTeams(paginatedOptions);

  const totalPages = useMemo(() => {
    if (!query.count) return 0;
    return Math.ceil(query.count / pageSize);
  }, [query.count, pageSize]);

  const hasNextPage = currentPage < totalPages - 1;
  const hasPreviousPage = currentPage > 0;

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 0 && page < totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  return {
    ...query,
    pagination: {
      currentPage,
      totalPages,
      pageSize,
      hasNextPage,
      hasPreviousPage,
      nextPage,
      previousPage,
      goToPage,
    },
  };
}

/**
 * Hook for match statistics and analytics
 */
export function useOptimizedMatchStats(categoryId: string, seasonId: string) {
  const {autumn, spring, loading, error} = useOptimizedMatchesSeasonal(categoryId, seasonId, {
    includeTeamDetails: true,
  });

  const stats = useMemo(() => {
    if (loading || error) return null;

    const allMatches = [...autumn, ...spring];
    const completedMatches = allMatches.filter((m) => m.status === 'completed');
    const upcomingMatches = allMatches.filter((m) => m.status === 'upcoming');

    return {
      total: allMatches.length,
      completed: completedMatches.length,
      upcoming: upcomingMatches.length,
      completionRate:
        allMatches.length > 0 ? (completedMatches.length / allMatches.length) * 100 : 0,
      averageGoalsPerMatch:
        completedMatches.length > 0
          ? completedMatches.reduce(
              (sum, match) => sum + (match.home_score || 0) + (match.away_score || 0),
              0
            ) / completedMatches.length
          : 0,
    };
  }, [autumn, spring, loading, error]);

  return {
    stats,
    loading,
    error,
  };
}
