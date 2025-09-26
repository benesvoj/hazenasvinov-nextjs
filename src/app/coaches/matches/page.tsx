'use client';

import React, {useState, useEffect, useMemo} from 'react';
import {LoadingSpinner, PageContainer} from '@/components';
import {
  useSeasons,
  useCategories,
  useStandings,
  useUserRoles,
  useOptimizedOwnClubMatches,
} from '@/hooks';
import {
  UpcomingMatchesCard,
  RecentResultsCard,
  StandingsCard,
  StrategyPreparationZone,
  RecentMatchDetails,
  MatchStatisticsZone,
} from './components';
import CoachMatchResultFlow from './components/CoachMatchResultFlow';
import {Tab, Tabs} from '@heroui/react';
import {ChartBarIcon} from '@heroicons/react/24/outline';
import {Match} from '@/types';
import {translations} from '@/lib/translations';

export default function CoachesMatchesPage() {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [assignedCategoryIds, setAssignedCategoryIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [resultFlowMatch, setResultFlowMatch] = useState<any>(null);
  const [isResultFlowOpen, setIsResultFlowOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const {activeSeason, fetchActiveSeason} = useSeasons();
  const {categories, fetchCategories} = useCategories();
  const {standings, loading: standingsLoading, fetchStandings} = useStandings();

  const t = translations.coaches.matches.tabs;

  // Try to get user roles, but handle case where UserProvider is not available
  let getCurrentUserCategories: (() => Promise<string[]>) | null = null;
  try {
    const userRoles = useUserRoles();
    getCurrentUserCategories = userRoles.getCurrentUserCategories;
  } catch (error) {
    // UserProvider not available
  }

  // Filter category based on assigned category
  const availableCategories = categories.filter((cat) => assignedCategoryIds.includes(cat.id));

  // Auto-select first category if none selected and only one available
  useEffect(() => {
    if (availableCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(availableCategories[0].id);
    }
  }, [availableCategories, selectedCategory]);

  const selectedCategoryData = availableCategories.find((cat) => cat.id === selectedCategory);

  // Get matches for the selected category
  const {
    allMatches,
    loading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = useOptimizedOwnClubMatches(
    selectedCategoryData?.id || undefined,
    activeSeason?.id || undefined
  );

  // Fetch data on mount
  useEffect(() => {
    fetchActiveSeason();
    fetchCategories();
  }, [fetchActiveSeason, fetchCategories]);

  // Fetch assigned category if available
  useEffect(() => {
    if (getCurrentUserCategories) {
      getCurrentUserCategories().then(setAssignedCategoryIds);
    }
  }, [getCurrentUserCategories]);

  // Fetch standings when category or season changes
  useEffect(() => {
    if (selectedCategoryData?.id && activeSeason?.id) {
      fetchStandings(selectedCategoryData.id, activeSeason.id);
    }
  }, [selectedCategoryData?.id, activeSeason?.id, fetchStandings]);

  // Process matches
  const upcomingMatches = useMemo(() => {
    const now = new Date();
    const upcoming = allMatches.filter(
      (match) => match.status === 'upcoming' && new Date(match.date) >= now
    );
    return upcoming;
  }, [allMatches]);

  const recentResults = useMemo(() => {
    const now = new Date();
    const recent = allMatches
      .filter((match) => match.status === 'completed' && new Date(match.date) <= now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return recent;
  }, [allMatches]);

  // Filter standings by selected category
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

  const handleStartResultFlow = (match: any) => {
    setResultFlowMatch(match);
    setIsResultFlowOpen(true);
  };

  const handleCloseResultFlow = () => {
    setIsResultFlowOpen(false);
    setResultFlowMatch(null);
  };

  const handleResultSaved = () => {
    // Refresh matches data
    refetchMatches();
  };

  const loading = matchesLoading || standingsLoading;

  if (!selectedCategoryData || !activeSeason) {
    return (
      <PageContainer>
        <div className="text-center py-8">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer isUnderConstruction>
      <div className="space-y-6">
        {/* Category Selection */}
        {availableCategories.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="overflow-x-auto">
              <Tabs
                selectedKey={selectedCategory}
                onSelectionChange={(key) => {
                  setSelectedCategory(key as string);
                  setSelectedMatch(null); // Clear selected match when switching category
                }}
                className="w-full min-w-max"
              >
                {availableCategories.map((category) => (
                  <Tab key={category.id} title={category.name} />
                ))}
              </Tabs>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left column - Matches and Standings */}
          <div className="xl:col-span-2 order-2 xl:order-1">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => {
                setActiveTab(key as string);
                setSelectedMatch(null); // Clear selected match when switching tabs
              }}
            >
              <Tab key="upcoming" title={t.upcoming}>
                <UpcomingMatchesCard
                  upcomingMatches={upcomingMatches}
                  loading={loading}
                  onMatchSelect={handleMatchSelect}
                  selectedMatchId={selectedMatch?.id}
                  onStartResultFlow={handleStartResultFlow}
                />
              </Tab>
              <Tab key="recent" title={t.recent}>
                <RecentResultsCard
                  recentResults={recentResults}
                  loading={loading}
                  onMatchSelect={handleMatchSelect}
                  selectedMatchId={selectedMatch?.id}
                />
              </Tab>
              <Tab key="standings" title={t.standings}>
                <StandingsCard standings={categoryStandings} loading={standingsLoading} />
              </Tab>
              <Tab key="statistics" title={t.statistics}>
                <div className="text-center py-8 text-gray-500">
                  <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Statistiky zápasů</p>
                  <p className="text-sm">Statistiky jsou zobrazeny v pravém sloupci</p>
                </div>
              </Tab>
            </Tabs>
          </div>

          {/* Right column - Dynamic content based on active tab */}
          <div className="xl:col-span-3 order-1 xl:order-2">
            {activeTab === 'upcoming' ? (
              // Strategy Zone for upcoming matches
              selectedMatch && selectedMatch.status === 'upcoming' ? (
                <StrategyPreparationZone
                  selectedMatch={selectedMatch}
                  onClose={handleCloseStrategy}
                />
              ) : selectedMatch ? (
                <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium mb-2">Zápas již byl odehrán</p>
                    <p className="text-sm">
                      Strategie a příprava jsou dostupné pouze pro nadcházející zápasy.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium mb-2">Vyberte zápas</p>
                    <p className="text-sm">
                      Klikněte na zápas v seznamu vlevo pro zobrazení strategie a přípravy.
                    </p>
                  </div>
                </div>
              )
            ) : activeTab === 'recent' ? (
              // Match Details for recent matches
              selectedMatch ? (
                <RecentMatchDetails selectedMatch={selectedMatch} onClose={handleCloseStrategy} />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium mb-2">Vyberte zápas</p>
                    <p className="text-sm">
                      Klikněte na zápas v seznamu vlevo pro zobrazení detailů a statistik.
                    </p>
                  </div>
                </div>
              )
            ) : activeTab === 'standings' ? (
              // Standings info
              <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p className="text-lg font-medium mb-2">Tabulka</p>
                  <p className="text-sm">Tabulka je zobrazena v levém sloupci.</p>
                </div>
              </div>
            ) : activeTab === 'statistics' ? (
              // Statistics Zone
              <MatchStatisticsZone
                categoryId={selectedCategoryData.id}
                seasonId={activeSeason.id}
              />
            ) : null}
          </div>
        </div>

        {/* Match Result Flow Modal */}
        <CoachMatchResultFlow
          isOpen={isResultFlowOpen}
          onClose={handleCloseResultFlow}
          match={resultFlowMatch}
          onResultSaved={handleResultSaved}
        />
      </div>
    </PageContainer>
  );
}
