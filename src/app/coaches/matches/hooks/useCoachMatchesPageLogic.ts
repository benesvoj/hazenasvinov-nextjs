'use client';

import {useEffect, useMemo, useState} from 'react';

import {translations} from '@/lib/translations';

import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';
import {
  useFetchSeasons,
  useOptimizedOwnClubMatches,
  useSeasonFiltering,
  useStandings,
} from '@/hooks';
import {Match} from '@/types';

export function useCoachMatchesPageLogic() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [resultFlowMatch, setResultFlowMatch] = useState<Match | null>(null);
  const [isResultFlowOpen, setIsResultFlowOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const {availableCategories, selectedCategory, setSelectedCategory, isLoading} =
    useCoachCategory();
  const {data: seasons, refetch: fetchActiveSeason} = useFetchSeasons();
  const {activeSeason} = useSeasonFiltering({seasons: seasons || []});
  const {standings, loading: standingsLoading, fetchStandings} = useStandings();

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
    fetchActiveSeason();
  }, [fetchActiveSeason]);

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

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
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
