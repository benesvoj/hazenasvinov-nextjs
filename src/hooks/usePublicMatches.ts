import {useState, useEffect, useCallback} from 'react';
import {Match} from '@/types';
import {createMatchQuery} from '@/utils';

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
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new query builder for public matches
      const query = createMatchQuery({
        categoryId: categoryId && categoryId !== 'all' ? categoryId : undefined,
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

      setDebugInfo({
        category: categoryId,
        totalMatches: result.autumn.length + result.spring.length,
        autumnCount: result.autumn.length,
        springCount: result.spring.length,
      });

      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setMatches({autumn: [], spring: []});
      setDebugInfo(null);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    loading,
    error,
    debugInfo,
  };
}
