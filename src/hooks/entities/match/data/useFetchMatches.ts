'use client';
import {useState, useEffect} from 'react';

import {Match} from '@/types';
import {createMatchQuery} from '@/utils';

export interface SeasonalMatches {
  autumn: Match[];
  spring: Match[];
}

export interface UseFetchMatchesOptions {
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
 * Hook to fetch matches for a specific category and season
 *
 * @param categoryId - The category id (UUID)
 * @param seasonId - Optional season ID. If not provided, uses active season
 * @param options - Configuration options for filtering and data inclusion
 *
 * @example
 * // Public page - show only own club matches for active season
 * const { matches, loading, error } = useFetchMatches('men');
 *
 * // Admin page - show all matches for specific season
 * const { matches, loading, error } = useFetchMatches('men', 'season-id', { ownClubOnly: false });
 *
 * // Custom filtering
 * const { matches, loading, error } = useFetchMatches('men', 'season-id', {
 *   ownClubOnly: true,
 *   includeTeamDetails: true
 * });
 */
export function useFetchMatches(
  categoryId: string,
  seasonId?: string,
  options: UseFetchMatchesOptions = {}
) {
  const {
    ownClubOnly = true, // Default to own club only for backward compatibility
    includeTeamDetails = true,
    includeStandings = false,
  } = options;

  const [matches, setMatches] = useState<SeasonalMatches>({autumn: [], spring: []});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!categoryId) {
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use the new query builder
        const query = createMatchQuery({
          categoryId,
          seasonId,
          ownClubOnly,
          includeTeamDetails,
        });

        // Execute query with seasonal split
        const result = await query.executeSeasonal();

        if (result.error) {
          throw new Error(result.error);
        }

        setMatches({
          autumn: result.autumn,
          spring: result.spring,
        });

        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Unknown error occurred'));
        setMatches({autumn: [], spring: []});
        setDebugInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [categoryId, seasonId, ownClubOnly, includeTeamDetails, includeStandings, refreshTrigger]);

  // Function to manually refresh matches
  const refreshMatches = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return {
    matches,
    loading,
    error,
    debugInfo,
    refreshMatches,
  };
}
