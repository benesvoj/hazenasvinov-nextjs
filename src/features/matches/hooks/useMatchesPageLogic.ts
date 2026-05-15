'use client';

import {useEffect, useMemo} from 'react';

import {useQuery} from '@tanstack/react-query';

import {useMatchMutations, useSupabaseClient, useTeamDisplayLogic} from '@/hooks';

import {isSeasonClosedHelper} from '../helpers/isSeasonClosedHelper';

import {useMatchesBulkActions} from './useMatchesBulkActions';
import {useMatchesCrudActions} from './useMatchesCrudActions';
import {useMatchesData} from './useMatchesData';
import {useMatchesFilters} from './useMatchesFilters';
import {useMatchesModals} from './useMatchesModals';
import {useMatchesStandings} from './useMatchesStandings';

export function useMatchesPageLogic() {
  const filters = useMatchesFilters();
  const {selectedCategory, selectedSeasonId, categories, sortedSeasons, setSelectedCategory} =
    filters;

  const modals = useMatchesModals();
  const {modal, deleteConfirm, matchActions} = modals;

  const isSeasonClosed = isSeasonClosedHelper(sortedSeasons, selectedSeasonId);

  const standingsApi = useMatchesStandings(selectedCategory, selectedSeasonId);
  const {error, setError, refresh: refreshStandings} = standingsApi;

  const selectedCategoryId = categories.find((cat) => cat.id === selectedCategory)?.id || '';

  const {
    members,
    membersLoading,
    teams,
    allTeamsLoading,
    matches,
    seasonalMatches,
    matchesError,
    expandedMatchweeks,
    toggleMatchweek,
    isMatchweekExpanded,
  } = useMatchesData({selectedCategoryId, selectedSeasonId});

  const {fetchTeamCounts} = useTeamDisplayLogic(selectedCategory);

  const {
    createMatch,
    updateMatch,
    updateMatchResult,
    deleteMatch: deleteMatchFn,
    deleteAllMatchesBySeason,
    bulkUpdateMatchweek,
  } = useMatchMutations({
    selectedCategory,
    selectedSeason: selectedSeasonId,
    onStandingsRefresh: refreshStandings,
  });

  const {
    selectedMatch,
    setSelectedMatch,
    formData,
    setFormData,
    editData,
    setEditData,
    resultData,
    setResultData,
    filteredTeams,
    handleAddMatch,
    handleUpdateResult,
    handleEditMatch,
    handleUpdateMatch,
    handleDeleteMatch,
  } = useMatchesCrudActions({
    isSeasonClosed,
    selectedCategory,
    selectedSeasonId,
    categories,
    modal,
    deleteConfirm,
    setError,
    createMatch,
    updateMatch,
    updateMatchResult,
    deleteMatchFn,
  });

  const {
    bulkUpdateData,
    setBulkUpdateData,
    handleBulkUpdateMatchweek,
    handleDeleteAllMatches,
    handleExcelImport,
  } = useMatchesBulkActions({
    isSeasonClosed,
    selectedSeasonId,
    matches,
    modal,
    setError,
    setSelectedCategory,
    refreshStandings,
    bulkUpdateMatchweekFn: bulkUpdateMatchweek,
    deleteAllMatchesBySeasonFn: deleteAllMatchesBySeason,
  });

  const supabase = useSupabaseClient();

  const allMatchIds = useMemo(
    () => matches.map((m) => m.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matches.map((m) => m.id).join(',')]
  );

  const {
    data: refereesByMatchId = new Map<string, {order: number; name: string; surname: string}[]>(),
  } = useQuery({
    queryKey: ['match-referees', allMatchIds],
    queryFn: async () => {
      if (!allMatchIds.length)
        return new Map<string, {order: number; name: string; surname: string}[]>();

      const {data, error} = await supabase
        .from('match_referees')
        .select('match_id, order, referee:referees(name, surname)')
        .in('match_id', allMatchIds)
        .order('order');

      if (error || !data)
        return new Map<string, {order: number; name: string; surname: string}[]>();

      const map = new Map<string, {order: number; name: string; surname: string}[]>();
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

  const loading =
    filters.categoriesLoading ||
    filters.seasonsLoading ||
    allTeamsLoading ||
    membersLoading ||
    !categories.length ||
    !members.length;

  useEffect(() => {
    fetchTeamCounts();
  }, [selectedCategory, fetchTeamCounts]);

  useEffect(() => {
    if (selectedCategory && selectedSeasonId) {
      refreshStandings();
    }
  }, [selectedCategory, selectedSeasonId, refreshStandings]);

  return {
    selectedMatch,
    setSelectedMatch,
    formData,
    setFormData,
    editData,
    setEditData,
    resultData,
    setResultData,
    bulkUpdateData,
    setBulkUpdateData,
    expandedMatchweeks,
    loading,
    isSeasonClosed,

    filters,

    modal,
    deleteConfirm,
    matchActions,

    categories,
    sortedSeasons,
    members,
    teams,
    filteredTeams,
    matches,
    seasonalMatches,
    selectedCategoryId,
    matchesError,

    standingsApi,

    refereesByMatchId,

    toggleMatchweek,
    isMatchweekExpanded,

    handleAddMatch,
    handleUpdateResult,
    handleEditMatch,
    handleUpdateMatch,
    handleDeleteMatch,
    handleDeleteAllMatches,
    handleBulkUpdateMatchweek,
    handleExcelImport,
  };
}
