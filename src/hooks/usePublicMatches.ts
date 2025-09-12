import {useState, useEffect, useCallback} from 'react';
import {Match} from '@/types';
import {createMatchQuery} from '@/utils';
import {useSeasons} from '@/hooks';

interface PublicMatchesResult {
  matches: {
    autumn: Match[];
    spring: Match[];
  };
  loading: boolean;
  error: string | null;
  debugInfo?: any;
}

export function usePublicMatches(categoryId?: string): PublicMatchesResult {
  const [matches, setMatches] = useState<{autumn: Match[]; spring: Match[]}>({
    autumn: [],
    spring: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get active season for suffix logic
  const {activeSeason, loading: seasonLoading, error: seasonError} = useSeasons();

  console.log('I got this season from useSeasons hook', activeSeason);
  console.log('I got this error from useSeasons hook', seasonError);

  const fetchMatches = useCallback(async () => {
    // Don't fetch if we don't have an active season yet
    if (!activeSeason?.id) {
      console.log('I HAVE No active season');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the new query builder for public matches
      const query = createMatchQuery({
        categoryId: categoryId && categoryId !== 'all' ? categoryId : undefined,
        seasonId: activeSeason.id, // Required for suffix logic
        includeTeamDetails: true,
        includeCategory: true,
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
      console.log('I have matches');
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setMatches({autumn: [], spring: []});
    } finally {
      setLoading(false);
    }
  }, [categoryId, activeSeason?.id]);

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
