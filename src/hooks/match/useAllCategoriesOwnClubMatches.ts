import {useState, useEffect, useCallback, useMemo} from 'react';
import {Match} from '@/types';
import {getMatchesWithTeamsOptimized} from '@/services/optimizedMatchQueries';
import {useSeasons} from '@/hooks';

interface AllCategoriesOwnClubMatchesResult {
  matches: Match[];
  loading: boolean;
  error: string | null;
}

export function useAllCategoriesOwnClubMatches(): AllCategoriesOwnClubMatchesResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get active season for suffix logic
  const {activeSeason, loading: seasonLoading, error: seasonError} = useSeasons();

  const fetchMatches = useCallback(async () => {
    // Don't fetch if we don't have an active season yet
    if (!activeSeason?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use optimized query for all category (no categoryId = all category)
      const result = await getMatchesWithTeamsOptimized({
        seasonId: activeSeason.id,
        includeTeamDetails: true,
        ownClubOnly: true, // Only get own club matches
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Filter for completed matches and sort by date (most recent first)
      const completedMatches = result.data
        .filter((match: Match) => match.status === 'completed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10); // Limit to 10 most recent

      setMatches(completedMatches);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [activeSeason?.id]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Update loading state based on season loading
  const isLoading = loading || seasonLoading;

  return {
    matches,
    loading: isLoading,
    error,
  };
}
