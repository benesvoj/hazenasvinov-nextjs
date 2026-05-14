'use client';

import {useCallback, useEffect, useState} from 'react';

import {useMatchesSeasonal} from '@/hooks/shared/queries/useMatchQueries';

import {translations} from '@/lib/translations';

import {hasItems, isEmpty} from '@/utils/arrayHelper';

import {showToast} from '@/components';
import {MatchStatus} from '@/enums';
import {
  useExcelImport,
  useFetchMembers,
  useFilteredTeams,
  useMatchMutations,
  useTeamDisplayLogic,
  useTeams,
} from '@/hooks';
import {AddMatchFormData, EditMatchFormData, Match} from '@/types';
import {
  buildMatchInsertData,
  buildMatchUpdateData,
  isNilOrZero,
  validateAddMatchForm,
  validateEditMatchForm,
  validateResultData,
  validateSeasonNotClosed,
} from '@/utils';

import {isSeasonClosedHelper} from '../helpers/isSeasonClosedHelper';

import {useMatchesFilters} from './useMatchesFilters';
import {useMatchesModals} from './useMatchesModals';
import {useMatchesStandings} from './useMatchesStandings';

const INITIAL_FORM_DATA: AddMatchFormData = {
  date: '',
  time: '',
  home_team_id: '',
  away_team_id: '',
  venue: '',
  category_id: '',
  season_id: '',
  matchweek: undefined,
  match_number: undefined,
  video_ids: [],
};

const INITIAL_EDIT_DATA: EditMatchFormData = {
  date: '',
  time: '',
  home_team_id: '',
  away_team_id: '',
  venue: '',
  home_score: 0,
  away_score: 0,
  home_score_halftime: 0,
  away_score_halftime: 0,
  status: MatchStatus.COMPLETED,
  matchweek: 0,
  match_number: 0,
  category_id: '',
  video_ids: [],
};

const INITIAL_RESULT_DATA = {
  home_score: 0,
  away_score: 0,
  home_score_halftime: 0,
  away_score_halftime: 0,
};

const INITIAL_BULK_DATA = {
  categoryId: '',
  matchweek: '',
  action: 'set' as 'set' | 'remove',
};

export function useMatchesPageLogic() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [formData, setFormData] = useState<AddMatchFormData>(INITIAL_FORM_DATA);
  const [editData, setEditData] = useState<EditMatchFormData>(INITIAL_EDIT_DATA);
  const [resultData, setResultData] = useState(INITIAL_RESULT_DATA);
  const [bulkUpdateData, setBulkUpdateData] = useState(INITIAL_BULK_DATA);
  const [expandedMatchweeks, setExpandedMatchweeks] = useState<Set<string>>(new Set());

  // Filters (season, category)
  const filters = useMatchesFilters();
  const {selectedCategory, selectedSeasonId, categories, sortedSeasons} = filters;

  // Modals
  const modals = useMatchesModals();
  const {modal, deleteConfirm, matchActions} = modals;

  // Data fetching
  const {data: members, loading: membersLoading, refetch: fetchMembers} = useFetchMembers();
  const {teams, loading: allTeamsLoading, fetchTeams} = useTeams();
  const {fetchTeamCounts} = useTeamDisplayLogic(selectedCategory);
  const {filteredTeams, fetchFilteredTeams} = useFilteredTeams(selectedCategory, selectedSeasonId);
  const {importMatches} = useExcelImport();

  const isSeasonClosed = isSeasonClosedHelper(sortedSeasons, selectedSeasonId);

  // Standings
  const standingsApi = useMatchesStandings(selectedCategory, selectedSeasonId);
  const {error: standingsError, setError, refresh: refreshStandings} = standingsApi;

  // Matches data
  const selectedCategoryId = categories.find((cat) => cat.id === selectedCategory)?.id || '';
  const {data: seasonalMatchesData, error: matchesError} = useMatchesSeasonal({
    categoryId: selectedCategoryId,
    seasonId: selectedSeasonId,
    ownClubOnly: false,
    includeTeamDetails: true,
    includeCategory: true,
    includeSeason: true,
    leagueOnly: true,
  });

  const seasonalMatches = seasonalMatchesData || {autumn: [], spring: []};
  const matches: Match[] = selectedCategoryId
    ? [...(seasonalMatches.autumn || []), ...(seasonalMatches.spring || [])]
    : [];

  // Mutations
  const {
    createMatch,
    updateMatch,
    updateMatchResult,
    deleteMatch: deleteMatchMutation,
    deleteAllMatchesBySeason,
    bulkUpdateMatchweek,
  } = useMatchMutations({
    selectedCategory,
    selectedSeason: selectedSeasonId,
    onStandingsRefresh: refreshStandings,
  });

  const loading =
    filters.categoriesLoading ||
    filters.seasonsLoading ||
    allTeamsLoading ||
    membersLoading ||
    isEmpty(categories) ||
    isEmpty(members);

  useEffect(() => {
    fetchTeams();
    fetchMembers();
  }, [fetchTeams, fetchMembers]);

  useEffect(() => {
    if (selectedCategory) {
      fetchTeamCounts();
    }
  }, [selectedCategory, fetchTeamCounts]);

  useEffect(() => {
    if (selectedCategory && selectedSeasonId) {
      refreshStandings();
    }
  }, [selectedCategory, selectedSeasonId, refreshStandings]);

  // Matchweek expansion
  const toggleMatchweek = useCallback((categoryId: string, matchweek: number) => {
    const key = `${categoryId}-${matchweek}`;
    setExpandedMatchweeks((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const isMatchweekExpanded = useCallback(
    (categoryId: string, matchweek: number) => expandedMatchweeks.has(`${categoryId}-${matchweek}`),
    [expandedMatchweeks]
  );

  // Handlers
  const handleAddMatch = useCallback(async () => {
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'přidat zápas');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }

    const validation = validateAddMatchForm(formData);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    const insertData = buildMatchInsertData(
      formData,
      selectedCategory,
      selectedSeasonId,
      categories
    );
    const success = await createMatch(insertData);

    if (success) {
      modal.addMatch.onClose();
      setFormData(INITIAL_FORM_DATA);
      setError('');
    }
  }, [
    isSeasonClosed,
    formData,
    selectedCategory,
    selectedSeasonId,
    categories,
    createMatch,
    modal,
    setError,
  ]);

  const handleUpdateResult = useCallback(async () => {
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'aktualizovat výsledek');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }
    if (!selectedMatch) return;

    const validation = validateResultData(resultData);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    const success = await updateMatchResult(selectedMatch.id, resultData);
    if (success) {
      modal.addResult.onClose();
      setResultData(INITIAL_RESULT_DATA);
      setSelectedMatch(null);
      setError('');
    }
  }, [isSeasonClosed, selectedMatch, resultData, updateMatchResult, modal, setError]);

  const handleEditMatch = useCallback(
    (match: Match) => {
      if (!match) return;
      setSelectedMatch(match);
      setEditData({
        date: match.date,
        time: match.time,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        venue: match.venue,
        home_score: match.home_score ?? 0,
        away_score: match.away_score ?? 0,
        home_score_halftime: match.home_score_halftime ?? 0,
        away_score_halftime: match.away_score_halftime ?? 0,
        status: match.status,
        matchweek: isNilOrZero(match.matchweek) ? 0 : match.matchweek,
        match_number: match.match_number ? match.match_number : 0,
        category_id: match.category_id,
      });
      if (match.category_id && selectedSeasonId && isEmpty(filteredTeams)) {
        fetchFilteredTeams(match.category_id, selectedSeasonId);
      }
      modal.editMatch.onOpen();
    },
    [selectedSeasonId, filteredTeams, fetchFilteredTeams, modal]
  );

  const handleUpdateMatch = useCallback(async () => {
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'aktualizovat zápas');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }
    if (!selectedMatch) return;

    const validation = validateEditMatchForm(editData);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    const updateData = buildMatchUpdateData(editData);
    const success = await updateMatch(selectedMatch.id, updateData, selectedMatch);
    if (success) {
      modal.editMatch.onClose();
      setEditData(INITIAL_EDIT_DATA);
      setSelectedMatch(null);
      setError('');
    }
  }, [isSeasonClosed, selectedMatch, editData, updateMatch, modal, setError]);

  const handleDeleteMatch = useCallback(async () => {
    if (!deleteConfirm.selectedItem) return;
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'smazat zápas');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }

    const success = await deleteMatchMutation(deleteConfirm.selectedItem.id);
    if (success) {
      setError('');
      deleteConfirm.closeAndClear();
    }
  }, [deleteConfirm, isSeasonClosed, deleteMatchMutation, setError]);

  const handleDeleteAllMatches = useCallback(async () => {
    if (!selectedSeasonId) return;
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'smazat zápasy');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }

    const success = await deleteAllMatchesBySeason(selectedSeasonId);
    if (success) {
      setError('');
      modal.deleteAllConfirm.onClose();
      filters.setSelectedCategory('');
    }
  }, [selectedSeasonId, isSeasonClosed, deleteAllMatchesBySeason, modal, filters, setError]);

  const handleBulkUpdateMatchweek = useCallback(async () => {
    if (!bulkUpdateData.categoryId) {
      setError('Prosím vyberte kategorii');
      return;
    }
    if (bulkUpdateData.action === 'set' && !bulkUpdateData.matchweek) {
      setError('Prosím vyberte kolo pro nastavení');
      return;
    }

    const success = await bulkUpdateMatchweek(bulkUpdateData, matches);
    if (success) {
      setError('');
      modal.bulkUpdate.onClose();
      setBulkUpdateData(INITIAL_BULK_DATA);
    } else {
      setError('Chyba při hromadné aktualizaci');
    }
  }, [bulkUpdateData, matches, bulkUpdateMatchweek, modal, setError]);

  const handleExcelImport = useCallback(
    async (importedMatches: any[]) => {
      if (!selectedSeasonId) {
        setError('Vyberte prosím sezónu před importem.');
        return;
      }

      try {
        const result = await importMatches(importedMatches, selectedSeasonId);
        if (result.success > 0) {
          await refreshStandings();
          setError('');
          showToast.success(translations.matches.toasts.matchSuccessImport);
        }
        if (hasItems(result.errors)) {
          setError(
            `Import dokončen s chybami. Úspěšně: ${result.success}, Selhalo: ${result.failed}. Zkontrolujte konzoli pro detaily.`
          );
        }
      } catch (err) {
        setError(`Import selhal: ${err instanceof Error ? err.message : 'Neznámá chyba'}`);
      }
    },
    [selectedSeasonId, importMatches, refreshStandings, setError]
  );

  return {
    // State
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

    // Filters
    filters,

    // Modals
    modal,
    deleteConfirm,
    matchActions,

    // Data
    categories,
    sortedSeasons,
    members,
    teams,
    filteredTeams,
    matches,
    seasonalMatches,
    selectedCategoryId,
    matchesError,

    // Standings
    standingsApi,

    // Matchweek helpers
    toggleMatchweek,
    isMatchweekExpanded,

    // Handlers
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
