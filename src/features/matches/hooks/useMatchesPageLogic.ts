'use client';

import {useEffect} from 'react';

import {useMatchMutations, useTeamDisplayLogic} from '@/hooks';

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
