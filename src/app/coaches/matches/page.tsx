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
} from './components';
import CoachMatchResultFlow from './components/CoachMatchResultFlow';
import {Alert} from '@heroui/react';

export default function CoachesMatchesPage() {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [assignedCategoryIds, setAssignedCategoryIds] = useState<string[]>([]);
  const [resultFlowMatch, setResultFlowMatch] = useState<any>(null);
  const [isResultFlowOpen, setIsResultFlowOpen] = useState(false);

  const {activeSeason, fetchActiveSeason} = useSeasons();
  const {categories, fetchCategories} = useCategories();
  const {standings, loading: standingsLoading, fetchStandings} = useStandings();

  // Try to get user roles, but handle case where UserProvider is not available
  let getCurrentUserCategories: (() => Promise<string[]>) | null = null;
  try {
    const userRoles = useUserRoles();
    getCurrentUserCategories = userRoles.getCurrentUserCategories;
  } catch (error) {
    // UserProvider not available
  }

  // Filter categories based on assigned categories
  const availableCategories = categories.filter((cat) => assignedCategoryIds.includes(cat.id));
  const selectedCategoryData = availableCategories[0]; // Use first available category

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

  // Debug: Log all matches to see their status
  useEffect(() => {
    if (allMatches.length > 0) {
      console.log(
        'All matches:',
        allMatches.map((m) => ({
          id: m.id,
          status: m.status,
          date: m.date,
          home_score: m.home_score,
          away_score: m.away_score,
          home_team: m.home_team?.name,
          away_team: m.away_team?.name,
        }))
      );
    }
  }, [allMatches]);

  // Fetch data on mount
  useEffect(() => {
    fetchActiveSeason();
    fetchCategories();
  }, [fetchActiveSeason, fetchCategories]);

  // Fetch assigned categories if available
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
    const upcoming = allMatches
      .filter((match) => match.status === 'upcoming' && new Date(match.date) >= now)
      .slice(0, 3);

    console.log(
      'Upcoming matches:',
      upcoming.map((m) => ({id: m.id, status: m.status, date: m.date}))
    );
    return upcoming;
  }, [allMatches]);

  const recentResults = useMemo(() => {
    const now = new Date();
    const recent = allMatches
      .filter((match) => match.status === 'completed' && new Date(match.date) <= now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    console.log(
      'Recent results:',
      recent.map((m) => ({
        id: m.id,
        status: m.status,
        date: m.date,
        home_score: m.home_score,
        away_score: m.away_score,
      }))
    );
    return recent;
  }, [allMatches]);

  // Filter standings by selected category
  const categoryStandings = useMemo(() => {
    if (!selectedCategoryData?.id) return [];
    return standings.filter((standing) => standing.category_id === selectedCategoryData.id);
  }, [standings, selectedCategoryData?.id]);

  const handleMatchSelect = (match: any) => {
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
    console.log('Refreshing matches data after result saved');
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column - Matches and Standings */}
          <div className="xl:col-span-1 space-y-6 order-2 xl:order-1">
            {/* Upcoming Matches */}
            <UpcomingMatchesCard
              upcomingMatches={upcomingMatches}
              loading={loading}
              onMatchSelect={handleMatchSelect}
              selectedMatchId={selectedMatch?.id}
              onStartResultFlow={handleStartResultFlow}
            />

            {/* Recent Results */}
            <RecentResultsCard
              recentResults={recentResults}
              loading={loading}
              onMatchSelect={handleMatchSelect}
              selectedMatchId={selectedMatch?.id}
            />

            {/* Standings */}
            <StandingsCard standings={categoryStandings} loading={standingsLoading} />
          </div>

          {/* Right column - Strategy Zone */}
          <div className="xl:col-span-2 order-1 xl:order-2">
            <StrategyPreparationZone selectedMatch={selectedMatch} onClose={handleCloseStrategy} />
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
