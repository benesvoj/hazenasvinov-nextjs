'use client';
import {useState, useEffect, useCallback} from 'react';

import {getMatchesWithTeamsOptimized} from '@/services/optimizedMatchQueries';

import {useSeasons} from '@/hooks';
import {Match} from '@/types';

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

  const fetchMatches = useCallback(async () => {
    // Don't fetch if we don't have an active season yet
    if (!activeSeason?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use optimized query for public matches
      const result = await getMatchesWithTeamsOptimized({
        categoryId: categoryId && categoryId !== 'all' ? categoryId : undefined,
        seasonId: activeSeason.id,
        includeTeamDetails: true,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Split matches into autumn and spring seasons
      const autumn: Match[] = [];
      const spring: Match[] = [];

      result.data.forEach((match: Match) => {
        const month = new Date(match.date).getMonth() + 1; // 1-12
        if (month >= 9 || month <= 2) {
          // September (9) to February (2)
          autumn.push(match);
        } else if (month >= 3 && month <= 5) {
          // March (3) to May (5)
          spring.push(match);
        }
      });

      setMatches({
        autumn,
        spring,
      });
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
