'use client';

import {useEffect, useMemo, useState} from 'react';

import {useQuery} from '@tanstack/react-query';

import {translations} from '@/lib/translations';

import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';
import {useOptimizedOwnClubMatches, useStandings, useSupabaseClient} from '@/hooks';
import {Match} from '@/types';

interface MatchRefereeInfo {
  order: number;
  name: string;
  surname: string;
}

export function useCoachMatchesPageLogic() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [resultFlowMatch, setResultFlowMatch] = useState<Match | null>(null);
  const [isResultFlowOpen, setIsResultFlowOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const {availableCategories, selectedCategory, setSelectedCategory, isLoading, activeSeason} =
    useCoachCategory();
  const {standings, loading: standingsLoading, fetchStandings} = useStandings();
  const supabase = useSupabaseClient();

  const t = translations.matches.tabs;

  const selectedCategoryData = availableCategories.find((cat) => cat.id === selectedCategory);

  const {
    allMatches,
    loading: matchesLoading,
    refetch: refetchMatches,
  } = useOptimizedOwnClubMatches(
    selectedCategoryData?.id || undefined,
    activeSeason?.id || undefined
  );

  useEffect(() => {
    if (selectedCategoryData?.id && activeSeason?.id) {
      fetchStandings(selectedCategoryData.id, activeSeason.id);
    }
  }, [selectedCategoryData?.id, activeSeason?.id, fetchStandings]);

  const upcomingMatches = useMemo(() => {
    const now = new Date();
    return allMatches.filter((match) => match.status === 'upcoming' && new Date(match.date) >= now);
  }, [allMatches]);

  const recentResults = useMemo(() => {
    const now = new Date();
    return allMatches
      .filter((match) => match.status === 'completed' && new Date(match.date) <= now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allMatches]);

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

  const categoryStandings = useMemo(() => {
    if (!selectedCategoryData?.id) return [];
    return standings.filter((standing) => standing.category_id === selectedCategoryData.id);
  }, [standings, selectedCategoryData?.id]);

  const handleMatchSelect = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleCloseStrategy = () => {
    setSelectedMatch(null);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSelectedMatch(null);
  };

  const handleStartResultFlow = (match: Match) => {
    setResultFlowMatch(match);
    setIsResultFlowOpen(true);
  };

  const handleCloseResultFlow = () => {
    setIsResultFlowOpen(false);
    setResultFlowMatch(null);
  };

  const handleResultSaved = () => {
    refetchMatches();
  };

  const loading = matchesLoading || standingsLoading;
  const isReady = !!(selectedCategoryData && activeSeason);

  return {
    // Data
    upcomingMatches,
    recentResults,
    categoryStandings,
    availableCategories,
    selectedCategory,
    selectedCategoryData,
    activeSeason,

    // State
    selectedMatch,
    resultFlowMatch,
    isResultFlowOpen,
    activeTab,
    loading,
    isReady,
    isLoading,

    // Referees
    refereesByMatchId,

    // Handlers
    handleMatchSelect,
    handleCloseStrategy,
    handleTabChange,
    handleStartResultFlow,
    handleCloseResultFlow,
    handleResultSaved,
    setSelectedCategory,

    // Translations
    t,
  };
}
