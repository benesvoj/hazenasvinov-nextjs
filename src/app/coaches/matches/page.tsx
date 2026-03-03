'use client';

import React, {useEffect, useMemo, useState} from 'react';

import {Tab, Tabs} from '@heroui/react';

import {ChartBarIcon} from '@heroicons/react/24/outline';

import UnifiedStandingTable from '@/components/shared/standing-table/UnifiedStandingTable';

import {translations} from '@/lib/translations/index';

import {useCoachCategory} from '@/app/coaches/components/CoachCategoryContext';

import {Choice, LoadingSpinner, PageContainer, Show, UnifiedCard} from '@/components';
import {
  useFetchSeasons,
  useOptimizedOwnClubMatches,
  useSeasonFiltering,
  useStandings,
} from '@/hooks';
import {Match} from '@/types';
import {hasMoreThanOne} from '@/utils';

import {
  MatchStatisticsZone,
  RecentMatchDetails,
  RecentResultsCard,
  StrategyPreparationZone,
  UpcomingMatchesCard,
} from './components';
import CoachMatchResultFlow from './components/CoachMatchResultFlow';

export default function CoachesMatchesPage() {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [resultFlowMatch, setResultFlowMatch] = useState<any>(null);
  const [isResultFlowOpen, setIsResultFlowOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const {availableCategories, selectedCategory, setSelectedCategory, isLoading} =
    useCoachCategory();
  const {data: seasons, refetch: fetchActiveSeason} = useFetchSeasons();
  const {activeSeason} = useSeasonFiltering({seasons: seasons || []});

  const {standings, loading: standingsLoading, fetchStandings} = useStandings();

  const t = translations.matches.tabs;

  //TODO probably for removing - we should be able to rely solely on CoachCategoryContext for categories data
  const selectedCategoryData = availableCategories.find((cat) => cat.id === selectedCategory);

  // Get matches for the selected category
  const {
    allMatches,
    loading: matchesLoading,
    refetch: refetchMatches,
  } = useOptimizedOwnClubMatches(
    selectedCategoryData?.id || undefined,
    activeSeason?.id || undefined
  );

  // Fetch data on mount
  useEffect(() => {
    fetchActiveSeason();
  }, [fetchActiveSeason]);

  // Fetch standings when category or season changes
  useEffect(() => {
    if (selectedCategoryData?.id && activeSeason?.id) {
      fetchStandings(selectedCategoryData.id, activeSeason.id);
    }
  }, [selectedCategoryData?.id, activeSeason?.id, fetchStandings]);

  // Process matches
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

  // Filter standings by selected category
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
        <Show when={hasMoreThanOne(availableCategories)}>
          <UnifiedCard padding={'none'}>
            <Choice
              value={selectedCategory}
              onChange={(id) => setSelectedCategory(id)}
              items={availableCategories.map((c) => ({key: c.id, label: c.name}))}
              label={translations.members.table.columns.category}
              size="sm"
              className={'md:w-1/4'}
              isLoading={isLoading}
              disallowEmptySelection={true}
            />
          </UnifiedCard>
        </Show>
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
                <UnifiedStandingTable standings={categoryStandings} loading={standingsLoading} />
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
