import {useState, useEffect} from 'react';
import {Match} from '@/types';
import {createMatchQuery} from '@/utils';
import {createClient} from '@/utils/supabase/client';

interface SeasonalMatches {
  autumn: Match[];
  spring: Match[];
}

/**
 * Hook to fetch matches from the user's own club
 *
 * @param categoryId - Optional category ID to filter matches by specific category
 * @param seasonId - Optional season ID to filter matches by specific season
 * @returns {Object} Object containing:
 *   - matches: Seasonal object with autumn and spring matches
 *   - loading: Loading state
 *   - error: Error state
 *   - debugInfo: Debug information for troubleshooting
 */
export function useOwnClubMatches(categoryId?: string, seasonId?: string) {
  const [matches, setMatches] = useState<SeasonalMatches>({autumn: [], spring: []});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOwnClubMatches = async () => {
      // Don't fetch matches if we don't have a category ID
      if (!categoryId) {
        setMatches({autumn: [], spring: []});
        setLoading(false);
        return;
      }

      // Don't fetch matches if we don't have a season ID
      if (!seasonId) {
        setMatches({autumn: [], spring: []});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use the new query builder for own club matches with seasonal split
        const query = createMatchQuery({
          categoryId,
          seasonId,
          ownClubOnly: true,
          includeTeamDetails: true,
          includeCategory: true,
        });

        // Execute query with seasonal split
        const result = await query.executeSeasonal();

        if (result.error) {
          console.error('useOwnClubMatches - Query error:', result.error);
          throw new Error(result.error);
        }

        setMatches({autumn: result.autumn, spring: result.spring});
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Unknown error occurred'));
        setMatches({autumn: [], spring: []});
      } finally {
        setLoading(false);
      }
    };

    fetchOwnClubMatches();
  }, [categoryId, seasonId]); // Refetch when categoryId or seasonId changes

  // If there's no seasonId, we can't fetch matches
  const finalError = error;

  return {
    matches,
    loading,
    error: finalError,
  };
}
