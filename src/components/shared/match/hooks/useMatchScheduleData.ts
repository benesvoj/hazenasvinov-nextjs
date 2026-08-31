// @barrel-ignore
'use client';

import {useEffect, useMemo, useRef, useState} from 'react';

import {useQuery} from '@tanstack/react-query';

import {
  useFetchActiveCategories,
  useFetchSeasons,
  useOptimizedOwnClubMatches,
  useSeasonFiltering,
  useStandings,
  useSupabaseClient,
} from '@/hooks';
import {hasItems} from '@/utils';

interface MatchRefereeInfo {
  order: number;
  name: string;
  surname: string;
}

export interface UseMatchScheduleDataOptions {
  /** When provided, overrides internal category selection and hides the category tabs. */
  selectedCategoryId?: string;
}

export function useMatchScheduleData({selectedCategoryId}: UseMatchScheduleDataOptions = {}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const lastFetchedRef = useRef<{categoryId: string; seasonId: string} | null>(null);
  const [fetchedCategoryId, setFetchedCategoryId] = useState<string | null>(null);

  const {data: seasons, refetch: fetchSeasons} = useFetchSeasons();
  const {activeSeason} = useSeasonFiltering({seasons: seasons || []});
  // Only the categories the club is fielding this season. Fetching every row
  // gave Ženy a tab in a season the club is not entering, and clicking it
  // rendered an empty standings table with nothing to explain why.
  const {data: categories, refetch: fetchCategories} = useFetchActiveCategories();

  const selectedCategoryData = categories.find((cat) => cat.id === selectedCategory);

  const {
    allMatches,
    loading: matchesLoading,
    error: matchesError,
  } = useOptimizedOwnClubMatches(
    selectedCategoryData?.id || undefined,
    activeSeason?.id || undefined
  );

  const {
    standings,
    loading: standingsLoading,
    error: standingsError,
    fetchStandings,
  } = useStandings();

  const supabase = useSupabaseClient();

  const allMatchIds = useMemo(
    () => allMatches.map((m) => m.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allMatches.map((m) => m.id).join(',')]
  );

  const {data: refereesByMatchId = new Map<string, MatchRefereeInfo[]>()} = useQuery({
    queryKey: ['match-referees', allMatchIds],
    queryFn: async () => {
      if (!allMatchIds.length) return new Map<string, MatchRefereeInfo[]>();

      const {data, error} = await supabase
        .from('match_referees')
        .select('match_id, order, referee:referees(name, surname)')
        .in('match_id', allMatchIds)
        .order('order');

      if (error || !data) return new Map<string, MatchRefereeInfo[]>();

      const map = new Map<string, MatchRefereeInfo[]>();
      data.forEach((row: any) => {
        const entry = map.get(row.match_id) ?? [];
        entry.push({
          order: row.order,
          name: row.referee?.name ?? '',
          surname: row.referee?.surname ?? '',
        });
        map.set(row.match_id, entry);
      });
      return map;
    },
    enabled: allMatchIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    fetchSeasons();
    fetchCategories();
  }, [fetchSeasons, fetchCategories]);

  // Sync internal selected category from external override or first available
  useEffect(() => {
    if (selectedCategoryId) {
      setSelectedCategory(selectedCategoryId);
    } else if (hasItems(categories)) {
      if (!selectedCategory || !categories.some((cat) => cat.id === selectedCategory)) {
        setSelectedCategory(categories[0].id);
      }
    }
  }, [categories, selectedCategory, selectedCategoryId]);

  // Fetch standings once per category+season combination
  useEffect(() => {
    if (!hasItems(categories) || !activeSeason || !selectedCategoryData) return;

    const categoryId = selectedCategoryData.id;
    const seasonId = activeSeason.id;
    const last = lastFetchedRef.current;

    if (last?.categoryId === categoryId && last?.seasonId === seasonId) return;

    lastFetchedRef.current = {categoryId, seasonId};
    setFetchedCategoryId(categoryId);
    fetchStandings(categoryId, seasonId);
  }, [
    selectedCategory,
    activeSeason?.id,
    selectedCategoryData?.id,
    activeSeason,
    categories.length,
    fetchStandings,
    selectedCategoryData,
    categories,
  ]);

  const upcomingMatches = useMemo(
    () => allMatches.filter((m) => m.status === 'upcoming').slice(0, 3),
    [allMatches]
  );

  const recentResults = useMemo(
    () =>
      allMatches
        .filter((m) => m.status === 'completed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3),
    [allMatches]
  );

  const categoryStandings = useMemo(() => {
    if (!selectedCategoryData?.id || fetchedCategoryId !== selectedCategoryData.id) return [];
    return standings.filter((s) => s.category_id === selectedCategoryData.id);
  }, [standings, selectedCategoryData?.id, fetchedCategoryId]);

  return {
    // Category selection
    selectedCategory,
    setSelectedCategory,
    categories,
    selectedCategoryData,
    activeSeason,

    // Match data
    allMatches,
    upcomingMatches,
    recentResults,
    matchesLoading,
    matchesError,

    // Standings
    categoryStandings,
    standingsLoading,
    standingsError,

    // Referees
    refereesByMatchId,
  };
}
