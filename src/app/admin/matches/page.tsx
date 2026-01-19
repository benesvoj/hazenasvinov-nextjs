'use client';

import React, {useCallback, useEffect, useState} from 'react';

import {Alert, Card, CardBody, Select, SelectItem, Tab, Tabs, useDisclosure} from '@heroui/react';

import {useQueryClient} from '@tanstack/react-query';

import {useMatchesSeasonal} from '@/hooks/shared/queries/useMatchQueries';
import {useModals} from '@/hooks/useModals';

import {translations} from '@/lib/translations';

import {hasItems, isEmpty} from '@/utils/arrayHelper';
import {autoRecalculateStandings} from '@/utils/autoStandingsRecalculation';
import {refreshMaterializedViewWithCallback} from '@/utils/refreshMaterializedView';
import {testMaterializedViewRefresh} from '@/utils/testMaterializedView';

import {getCategoryInfo} from '@/helpers/getCategoryInfo';

import {
  AdminContainer,
  DeleteConfirmationModal,
  LoadingSpinner,
  showToast,
  UnifiedStandingTable,
} from '@/components';
import {matchStatusesKeys} from '@/constants';
import {ActionTypes} from '@/enums';
import {
  useExcelImport,
  useFetchCategories,
  useFetchMembers,
  useFetchSeasons,
  useFilteredTeams,
  useSeasonFiltering,
  useStandings,
  useTeamDisplayLogic,
  useTeams,
} from '@/hooks';
import {AddMatchFormData, EditMatchFormData, Match} from '@/types';
import {calculateStandings, createClient, generateInitialStandings} from '@/utils';

import {
  AddMatchModal,
  AddResultModal,
  BulkUpdateMatchweekModal,
  CategoryMatches,
  EditMatchModal,
  ExcelImportModal,
  LineupManagerModal,
  MatchActionsModal,
  MatchProcessWizardModal,
} from './components';
import {getMatchweekOptions} from './helpers/getMatchweekOptions';

export default function MatchesAdminPage() {
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Use existing hooks instead of custom state and fetch functions
  const {
    data: categories,
    loading: categoriesLoading,
    refetch: fetchCategories,
  } = useFetchCategories();
  const {data: members, loading: membersLoading, refetch: fetchMembers} = useFetchMembers();
  const {teams, loading: allTeamsLoading, fetchTeams} = useTeams();

  // Modal states
  const modal = useModals('addMatch', 'addResult', 'editMatch', 'bulkUpdate', 'lineup');

  const {
    isOpen: isExcelImportOpen,
    onOpen: onExcelImportOpen,
    onClose: onExcelImportClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onClose: onDeleteConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteAllConfirmOpen,
    onOpen: onDeleteAllConfirmOpen,
    onClose: onDeleteAllConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isMatchActionsOpen,
    onOpen: onMatchActionsOpen,
    onClose: onMatchActionsClose,
  } = useDisclosure();
  const {
    isOpen: isMatchProcessOpen,
    onOpen: onMatchProcessOpen,
    onClose: onMatchProcessClose,
  } = useDisclosure();
  const {importMatches} = useExcelImport();

  // TODO: move into admin translations
  const t = translations.matches;

  // Use the team display logic hook
  const {fetchTeamCounts} = useTeamDisplayLogic(selectedCategory);

  // Reset matchToDelete when confirmation modal closes
  const handleDeleteConfirmClose = () => {
    onDeleteConfirmClose();
    setMatchToDelete(null);
  };

  // Toggle matchweek expansion
  const toggleMatchweek = (categoryId: string, matchweek: number) => {
    const key = `${categoryId}-${matchweek}`;
    setExpandedMatchweeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Check if matchweek is expanded
  const isMatchweekExpanded = (categoryId: string, matchweek: number) => {
    const key = `${categoryId}-${matchweek}`;
    return expandedMatchweeks.has(key);
  };

  const [formData, setFormData] = useState<AddMatchFormData>({
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
  });

  const [resultData, setResultData] = useState({
    home_score: 0,
    away_score: 0,
    home_score_halftime: 0,
    away_score_halftime: 0,
  });

  const [editData, setEditData] = useState<EditMatchFormData>({
    date: '',
    time: '',
    home_team_id: '',
    away_team_id: '',
    venue: '',
    home_score: 0,
    away_score: 0,
    home_score_halftime: 0,
    away_score_halftime: 0,
    status: 'completed' as 'upcoming' | 'completed',
    matchweek: '',
    match_number: 0,
    category_id: '',
    video_ids: [],
  });

  const [bulkUpdateData, setBulkUpdateData] = useState({
    categoryId: '',
    matchweek: '',
    action: 'set' as 'set' | 'remove',
  });

  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [expandedMatchweeks, setExpandedMatchweeks] = useState<Set<string>>(new Set());

  const supabase = createClient();

  // Use the enhanced seasons hook
  const {data: seasons, loading: seasonsLoading} = useFetchSeasons();
  const {activeSeason, sortedSeasons} = useSeasonFiltering({seasons: seasons || []});

  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const queryClient = useQueryClient();

  // Use the matches hook - pass category code instead of ID, and show ALL matches (admin mode)
  const selectedCategoryId = categories.find((cat) => cat.id === selectedCategory)?.id || '';
  const {data: seasonalMatchesData, error: matchesError} = useMatchesSeasonal({
    categoryId: selectedCategoryId,
    seasonId: selectedSeason,
    ownClubOnly: false,
    includeTeamDetails: true,
    includeCategory: true,
    includeSeason: true,
  });

  // Extract matches from the data structure
  const seasonalMatches = seasonalMatchesData || {autumn: [], spring: []};

  // Create a flat array of all matches for components that expect Match[]
  const matches = selectedCategoryId
    ? [...(seasonalMatches.autumn || []), ...(seasonalMatches.spring || [])]
    : [];

  // Use the filtered teams hook
  const {filteredTeams, fetchFilteredTeams} = useFilteredTeams(selectedCategory, selectedSeason);

  // Use the standings hook
  const {standings, fetchStandings, loading: standingsLoading} = useStandings();

  // Derive loading state from all async operations
  const loading =
    categoriesLoading ||
    seasonsLoading ||
    allTeamsLoading ||
    membersLoading ||
    isEmpty(categories) ||
    isEmpty(members);

  // Set active season as default when seasons are loaded
  useEffect(() => {
    if (hasItems(sortedSeasons) && !selectedSeason && activeSeason) {
      setSelectedSeason(activeSeason.id);
    }
  }, [sortedSeasons, selectedSeason, activeSeason]);

  // Teams are now automatically fetched when selectedCategory or selectedSeason changes
  // No need for manual useEffect since useFilteredTeams handles this internally

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchTeams();
    fetchMembers();
  }, [fetchCategories, fetchTeams, fetchMembers]);

  // Set first category as default when categories are loaded
  useEffect(() => {
    if (hasItems(categories) && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  // Fetch team counts when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchTeamCounts();
    }
  }, [selectedCategory, fetchTeamCounts]);

  // Fetch standings when filters change (matches are automatically fetched by useFetchMatches hook)
  useEffect(() => {
    if (selectedCategory && selectedSeason) {
      fetchStandings(selectedCategory, selectedSeason);
    }
  }, [fetchStandings, selectedCategory, selectedSeason]);

  // Calculate standings
  const handleCalculateStandings = async () => {
    if (
      !selectedCategory ||
      !selectedSeason ||
      selectedCategory.trim() === '' ||
      selectedSeason.trim() === ''
    ) {
      setError('Vyberte kategorii a sezónu');
      return;
    }

    const result = await calculateStandings(selectedCategory, selectedSeason, isSeasonClosed);

    if (result.success) {
      // Refresh standings
      await fetchStandings(selectedCategory, selectedSeason);
      setError('');
    } else {
      setError(result.error || 'Chyba při výpočtu tabulky');
    }
  };

  // Smart standings function - generates or recalculates based on current state
  const handleStandingsAction = async () => {
    if (isSeasonClosed()) {
      setError('Nelze upravovat tabulku pro uzavřenou sezónu');
      return;
    }

    try {
      // Check if standings already exist for this category/season
      const existingStandings = standings.filter(
        (s) => s.category_id === selectedCategory && s.season_id === selectedSeason
      );

      if (isEmpty(existingStandings)) {
        // No standings exist - generate initial ones
        await handleGenerateInitialStandings();
      } else {
        // Standings exist - recalculate them
        await handleCalculateStandings();
      }
    } catch (error) {
      console.error('Error in standings action:', error);
    }
  };

  // Generate initial standings for teams without any matches
  const handleGenerateInitialStandings = async () => {
    if (
      !selectedCategory ||
      !selectedSeason ||
      selectedCategory.trim() === '' ||
      selectedSeason.trim() === ''
    ) {
      setError('Vyberte kategorii a sezónu');
      return;
    }

    const result = await generateInitialStandings(selectedCategory, selectedSeason, isSeasonClosed);

    if (result.success) {
      // Refresh standings
      await fetchStandings(selectedCategory, selectedSeason);
      setError('');
    } else {
      setError(result.error || 'Chyba při generování počáteční tabulky');
    }
  };

  // Check if selected season is closed
  const isSeasonClosed = () => {
    const season = sortedSeasons.find((s) => s.id === selectedSeason);
    return season?.is_closed || false;
  };

  // Add new match
  const handleAddMatch = async () => {
    if (isSeasonClosed()) {
      setError('Nelze přidat zápas do uzavřené sezóny');
      return;
    }

    try {
      if (
        !formData.date ||
        !formData.time ||
        !formData.home_team_id ||
        !formData.away_team_id ||
        !formData.venue
      ) {
        setError('Prosím vyplňte všechna povinná pole');
        return;
      }

      const insertData: any = {
        category_id: selectedCategory,
        season_id: selectedSeason,
        date: formData.date,
        time: formData.time,
        home_team_id: formData.home_team_id,
        away_team_id: formData.away_team_id,
        venue: formData.venue,
        competition: getCategoryInfo(selectedCategory, categories).competition,
        is_home: true,
        status: matchStatusesKeys[0],
      };

      // Handle matchweek - allow setting to null if empty, or use the value
      if (formData.matchweek === undefined || formData.matchweek === '0') {
        insertData.matchweek = null;
      } else {
        insertData.matchweek = formData.matchweek;
      }

      // Handle match_number - only add if provided
      if (formData.match_number && formData.match_number > 0) {
        insertData.match_number = formData.match_number;
      }

      const {error} = await supabase.from('matches').insert(insertData);

      if (error) throw error;

      // Refresh materialized view to ensure it has the latest data
      await refreshMaterializedViewWithCallback('admin match insert');

      // Invalidate React Query cache to refresh matches list
      await queryClient.invalidateQueries({
        queryKey: ['matches', 'seasonal', selectedCategoryId, selectedSeason],
      });
      await queryClient.invalidateQueries({
        queryKey: ['matches'],
      });

      modal.addMatch.onClose();

      setFormData({
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
      });
      setError('');
    } catch (error) {
      setError('Chyba při přidávání zápasu');
      console.error('Error adding match:', error);
    }
  };

  // Update match result
  const handleUpdateResult = async () => {
    if (isSeasonClosed()) {
      setError('Nelze upravit výsledek v uzavřené sezóně');
      return;
    }

    if (!selectedMatch) return;

    try {
      if (
        resultData.home_score === null ||
        resultData.away_score === null ||
        resultData.home_score === undefined ||
        resultData.away_score === undefined
      ) {
        setError('Prosím vyplňte oba skóre');
        return;
      }

      const {error} = await supabase
        .from('matches')
        .update({
          home_score: resultData.home_score,
          away_score: resultData.away_score,
          home_score_halftime: resultData.home_score_halftime,
          away_score_halftime: resultData.away_score_halftime,
          status: matchStatusesKeys[1],
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedMatch.id);

      if (error) throw error;

      // Refresh materialized view to ensure it has the latest data
      await refreshMaterializedViewWithCallback('admin result update');

      // Automatically recalculate standings for this match's category and season
      try {
        const standingsResult = await autoRecalculateStandings(selectedMatch.id);

        if (standingsResult.success && standingsResult.recalculated) {
          // Refresh standings to show updated data
          if (selectedCategory && selectedSeason) {
            await fetchStandings(selectedCategory, selectedSeason);
          }
          showToast.success(t.toasts.matchWithResultWasSaved);
        } else if (standingsResult.success && !standingsResult.recalculated) {
          showToast.success(t.toasts.matchResultWasSaved);
        } else {
          showToast.warning(t.toasts.matchResultSavedWithoutUpdateStandingTable);
        }
      } catch (standingsError) {
        showToast.warning(t.toasts.matchResultSavedWithoutUpdateStandingTable);
      }

      modal.addResult.onClose();
      setResultData({home_score: 0, away_score: 0, home_score_halftime: 0, away_score_halftime: 0});
      setSelectedMatch(null);

      // Invalidate React Query cache to refresh matches list
      await queryClient.invalidateQueries({
        queryKey: ['matches', 'seasonal', selectedCategoryId, selectedSeason],
      });
      await queryClient.invalidateQueries({
        queryKey: ['matches'],
      });

      setError('');
    } catch (error) {
      setError('Chyba při aktualizaci výsledku');
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (match: Match) => {
    setMatchToDelete(match);
    onDeleteConfirmOpen();
  };

  // Delete match (after confirmation)
  const handleDeleteMatch = async () => {
    if (!matchToDelete) return;

    if (isSeasonClosed()) {
      setError('Nelze smazat zápas z uzavřené sezóny');
      return;
    }

    try {
      const {error} = await supabase.from('matches').delete().eq('id', matchToDelete.id);

      if (error) throw error;

      // Refresh materialized view to ensure it has the latest data
      await refreshMaterializedViewWithCallback('admin match delete');

      // Invalidate React Query cache to refresh matches list
      await queryClient.invalidateQueries({
        queryKey: ['matches', 'seasonal', selectedCategoryId, selectedSeason],
      });
      await queryClient.invalidateQueries({
        queryKey: ['matches'],
      });

      setError('');
      handleDeleteConfirmClose();
    } catch (error) {
      setError('Chyba při mazání zápasu');
    }
  };

  // Delete all matches (after confirmation)
  const handleDeleteAllMatches = async () => {
    if (isSeasonClosed()) {
      setError('Nelze smazat zápasy z uzavřené sezóny');
      return;
    }

    try {
      // Delete all matches for the selected season
      const {error} = await supabase.from('matches').delete().eq('season_id', selectedSeason);

      if (error) throw error;

      // Invalidate React Query cache to refresh matches list
      await queryClient.invalidateQueries({
        queryKey: ['matches', 'seasonal', selectedCategoryId, selectedSeason],
      });
      await queryClient.invalidateQueries({
        queryKey: ['matches'],
      });

      setError('');
      onDeleteAllConfirmClose();
      setSelectedCategory('');
    } catch (error) {
      setError('Chyba při mazání všech zápasů');
    }
  };

  // Open edit match modal
  const handleEditMatch = (match: Match) => {
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
      matchweek: match.matchweek ? match.matchweek.toString() : '',
      match_number: match.match_number ? match.match_number : 0,
      category_id: match.category_id,
    });

    // Ensure filteredTeams is loaded for this category
    if (match.category_id && selectedSeason && isEmpty(filteredTeams)) {
      fetchFilteredTeams(match.category_id, selectedSeason);
    }

    modal.editMatch.onOpen();
  };

  // Update match
  const handleUpdateMatch = async () => {
    if (isSeasonClosed()) {
      setError(t.toasts.matchNotSavedClosedSeason);
      showToast.warning(t.toasts.matchNotSavedClosedSeason);
      return;
    }

    if (!selectedMatch) {
      showToast.danger(t.toasts.noMatchSelected);
      return;
    }

    try {
      // Validate required fields
      if (!editData.date || !editData.time || !editData.venue) {
        setError(t.toasts.mandatoryFieldsMissing);
        showToast.danger(t.toasts.mandatoryFieldsMissing);
        return;
      }

      // Validate team selection
      if (!editData.home_team_id || !editData.away_team_id) {
        setError(t.toasts.selectBothTeams);
        showToast.danger(t.toasts.selectBothTeams);
        return;
      }

      // Validate teams are different
      if (editData.home_team_id === editData.away_team_id) {
        setError(t.toasts.selectDifferentTeams);
        showToast.danger(t.toasts.selectDifferentTeams);
        return;
      }

      // Result is now computed from scores when needed, no need to store it

      const updateData: any = {
        date: editData.date,
        time: editData.time,
        home_team_id: editData.home_team_id,
        away_team_id: editData.away_team_id,
        venue: editData.venue,
        status: editData.status,
      };

      // Handle matchweek - allow setting to null if empty, or parse the value
      if (editData.matchweek === '') {
        updateData.matchweek = null;
      } else if (editData.matchweek) {
        updateData.matchweek = parseInt(editData.matchweek);
      }

      // Handle match_number - only add if provided
      if (editData.match_number && editData.match_number) {
        updateData.match_number = editData.match_number;
      } else {
        updateData.match_number = 0;
      }

      // Only update scores if they are provided (check for null/undefined, not falsiness since 0 is valid)
      if (
        editData.home_score !== null &&
        editData.home_score !== undefined &&
        editData.away_score !== null &&
        editData.away_score !== undefined
      ) {
        updateData.home_score = editData.home_score;
        updateData.away_score = editData.away_score;
      }
      if (
        editData.home_score_halftime !== null &&
        editData.home_score_halftime !== undefined &&
        editData.away_score_halftime !== null &&
        editData.away_score_halftime !== undefined
      ) {
        updateData.home_score_halftime = editData.home_score_halftime;
        updateData.away_score_halftime = editData.away_score_halftime;
      }

      const {error} = await supabase.from('matches').update(updateData).eq('id', selectedMatch.id);

      if (error) {
        throw error;
      }

      // Refresh materialized view to ensure it has the latest data
      await refreshMaterializedViewWithCallback('admin match update');

      // Check if scores were updated and trigger standings recalculation
      const scoresWereUpdated =
        editData.home_score !== selectedMatch.home_score ||
        editData.away_score !== selectedMatch.away_score ||
        editData.home_score_halftime !== selectedMatch.home_score_halftime ||
        editData.away_score_halftime !== selectedMatch.away_score_halftime;

      if (scoresWereUpdated) {
        try {
          const standingsResult = await autoRecalculateStandings(selectedMatch.id);

          if (standingsResult.success && standingsResult.recalculated) {
            // Refresh standings to show updated data
            if (selectedCategory && selectedSeason) {
              await fetchStandings(selectedCategory, selectedSeason);
            }
            showToast.success(t.toasts.matchSavedWithUpdateStandingTable);
          } else if (standingsResult.success && !standingsResult.recalculated) {
            showToast.success(t.toasts.matchSavedSuccessfully);
          } else {
            showToast.warning(t.toasts.matchSavedWithoutUpdateStandingTable);
          }
        } catch (standingsError) {
          showToast.warning(t.toasts.matchSavedWithoutUpdateStandingTable);
        }
      } else {
        // Scores weren't updated, just show success
        showToast.warning(t.toasts.matchSavedWithoutUpdatedScore);
      }

      modal.editMatch.onClose();
      setEditData({
        date: '',
        time: '',
        home_team_id: '',
        away_team_id: '',
        venue: '',
        home_score: 0,
        away_score: 0,
        home_score_halftime: 0,
        away_score_halftime: 0,
        status: 'completed',
        matchweek: '',
        match_number: 0,
        category_id: '',
        video_ids: [],
      });
      setSelectedMatch(null);

      // Invalidate React Query cache to refresh matches list
      await queryClient.invalidateQueries({
        queryKey: ['matches', 'seasonal', selectedCategoryId, selectedSeason],
      });
      await queryClient.invalidateQueries({
        queryKey: ['matches'],
      });

      setError('');
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        setError(`Chyba při aktualizaci zápasu: ${error.message}`);
      } else {
        setError('Chyba při aktualizaci zápasu');
      }
    }
  };

  // Bulk update matchweek for matches
  const handleBulkUpdateMatchweek = async () => {
    if (!bulkUpdateData.categoryId) {
      setError('Prosím vyberte kategorii');
      return;
    }

    if (bulkUpdateData.action === 'set' && !bulkUpdateData.matchweek) {
      setError('Prosím vyberte kolo pro nastavení');
      return;
    }

    try {
      let matchesToUpdate: Match[];
      let updateData: any;

      // Get all matches from the hook
      const allMatches = [...(seasonalMatches.autumn || []), ...(seasonalMatches.spring || [])];

      if (bulkUpdateData.action === 'set') {
        // Find matches without matchweek for the selected category
        matchesToUpdate = allMatches.filter(
          (match) => match.category_id === bulkUpdateData.categoryId && !match.matchweek
        );

        if (isEmpty(matchesToUpdate)) {
          setError('Nebyly nalezeny žádné zápasy bez kola pro vybranou kategorii');
          return;
        }

        const matchweekNumber = parseInt(bulkUpdateData.matchweek);
        updateData = {matchweek: matchweekNumber};
      } else {
        // Find matches with matchweek for the selected category
        matchesToUpdate = allMatches.filter(
          (match) =>
            match.category_id === bulkUpdateData.categoryId &&
            match.matchweek !== null &&
            match.matchweek !== undefined
        );

        if (isEmpty(matchesToUpdate)) {
          setError('Nebyly nalezeny žádné zápasy s kolem pro vybranou kategorii');
          return;
        }

        updateData = {matchweek: null};
      }

      // Update all matches in bulk
      const {error} = await supabase
        .from('matches')
        .update(updateData)
        .in(
          'id',
          matchesToUpdate.map((match) => match.id)
        );

      if (error) {
        throw error;
      }

      // Refresh materialized view to ensure it has the latest data
      await refreshMaterializedViewWithCallback('admin bulk update');

      // Invalidate React Query cache to refresh matches list
      await queryClient.invalidateQueries({
        queryKey: ['matches', 'seasonal', selectedCategoryId, selectedSeason],
      });
      await queryClient.invalidateQueries({
        queryKey: ['matches'],
      });

      setError('');
      modal.bulkUpdate.onClose();
      setBulkUpdateData({categoryId: '', matchweek: '', action: 'set'});
    } catch (error) {
      console.error('Full error details:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        setError(`Chyba při hromadné aktualizaci: ${error.message}`);
      } else {
        setError('Chyba při hromadné aktualizaci');
      }
    }
  };

  const handleExcelImport = useCallback(
    async (matches: any[]) => {
      if (!selectedSeason) {
        setError('Vyberte prosím sezónu před importem.');
        return;
      }

      try {
        const result = await importMatches(matches, selectedSeason);

        if (result.success > 0) {
          // Invalidate React Query cache to refresh matches list
          await queryClient.invalidateQueries({
            queryKey: ['matches', 'seasonal', selectedCategoryId, selectedSeason],
          });
          await queryClient.invalidateQueries({
            queryKey: ['matches'],
          });

          // Refresh data
          await fetchStandings(selectedCategory, selectedSeason);
          setError('');

          // Show success message
          showToast.success(t.toasts.matchSuccessImport);
        }

        if (hasItems(result.errors)) {
          console.error('Import errors:', result.errors);
          setError(
            `Import dokončen s chybami. Úspěšně: ${result.success}, Selhalo: ${result.failed}. Zkontrolujte konzoli pro detaily.`
          );
        }
      } catch (error) {
        console.error('Excel import error:', error);
        setError(`Import selhal: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
      }
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      selectedSeason,
      importMatches,
      fetchStandings,
      selectedCategory,
      queryClient,
      selectedCategoryId,
    ]
  );

  const generateStandingsLabel = isEmpty(
    standings.filter((s) => s.category_id === selectedCategory && s.season_id === selectedSeason)
  )
    ? translations.matches.actions.generateStandings
    : translations.matches.actions.recalculateStandings;

  return (
    <AdminContainer
      actions={[
        {
          label: translations.matches.actions.addMatch,
          onClick: modal.addMatch.onOpen,
          variant: 'solid',
          buttonType: ActionTypes.CREATE,
          isDisabled: isSeasonClosed(),
          priority: 'primary', // Most important action - always visible
        },
        {
          label: translations.matches.actions.bulkUpdateMatchweek,
          onClick: modal.bulkUpdate.onOpen,
          buttonType: ActionTypes.UPDATE,
          color: 'secondary',
          isDisabled: isSeasonClosed(),
          priority: 'secondary', // Less important - hidden under 3 dots menu
        },
        {
          label: generateStandingsLabel,
          onClick: handleStandingsAction,
          buttonType: ActionTypes.UPDATE,
          color: 'secondary',
          isDisabled: isSeasonClosed(),
          priority: 'secondary', // Less important - hidden under 3 dots menu
        },
        {
          label: translations.matches.actions.import,
          onClick: onExcelImportOpen,
          buttonType: ActionTypes.UPDATE,
          color: 'secondary',
          isDisabled: isSeasonClosed(),
          priority: 'secondary', // Less important - hidden under 3 dots menu
        },
        {
          label: translations.matches.actions.testMaterializedViewRefresh,
          onClick: testMaterializedViewRefresh,
          color: 'secondary',
          buttonType: ActionTypes.UPDATE,
          isDisabled: isSeasonClosed(),
          priority: 'secondary', // Less important - hidden under 3 dots menu
        },
        {
          label: translations.matches.actions.deleteAllMatches,
          onClick: onDeleteAllConfirmOpen,
          buttonType: ActionTypes.DELETE,
          color: 'danger',
          isDisabled: isSeasonClosed() || !selectedSeason,
          priority: 'secondary', // Less important - hidden under 3 dots menu
        },
      ]}
      filters={
        <div className="w-full">
          {isEmpty(sortedSeasons) ? (
            <div className="w-full flex justify-center items-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2">
              <Select
                label={translations.season.title}
                placeholder={translations.season.selectSeason}
                selectedKeys={selectedSeason ? [selectedSeason] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setSelectedSeason(selectedKey || '');
                }}
                className="w-full"
              >
                {sortedSeasons.map((season) => (
                  <SelectItem key={season.id} textValue={season.name}>
                    {season.name} {season.is_closed ? `(${translations.season.closed})` : ''}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}
        </div>
      }
    >
      {/* Season closed warning */}
      {selectedSeason && isSeasonClosed() && (
        <Alert color="warning">
          <strong>Upozornění:</strong> Tato sezóna je uzavřená. Nelze přidávat ani upravovat zápasy.
        </Alert>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {selectedSeason && (
        <>
          <Card>
            <CardBody>
              {loading ? (
                <div className="text-center py-8">{translations.loading}</div>
              ) : (
                <Tabs
                  aria-label="Categories"
                  selectedKey={selectedCategory}
                  onSelectionChange={(key) => {
                    setSelectedCategory(key as string);
                  }}
                >
                  {categories.map((category) => (
                    <Tab key={category.id} title={category.name}>
                      <div className="mt-4 space-y-4">
                        <h3 className="text-lg font-semibold mb-4">
                          {category.name} - {getCategoryInfo(category.id, categories).competition}
                        </h3>

                        {/* Show loading or no category message */}
                        {!selectedCategoryId && (
                          <div className="text-center py-8 text-gray-500">
                            {isEmpty(categories)
                              ? 'Načítání kategorií...'
                              : 'Vyberte kategorii pro zobrazení zápasů'}
                          </div>
                        )}

                        {/* Show error if matches hook failed */}
                        {selectedCategoryId && matchesError && (
                          <div className="text-center py-8 text-red-500">
                            Chyba při načítání zápasů: {matchesError.message}
                          </div>
                        )}

                        {/* Matches for this category grouped by matchweek */}
                        {selectedCategoryId && !matchesError && (
                          <CategoryMatches
                            matches={matches}
                            category={category}
                            expandedMatchweeks={expandedMatchweeks}
                            toggleMatchweek={toggleMatchweek}
                            isMatchweekExpanded={isMatchweekExpanded}
                            onAddResult={(match) => {
                              setSelectedMatch(match);
                              modal.addResult.onOpen();
                            }}
                            onEditMatch={handleEditMatch}
                            onLineupModalOpen={(match) => {
                              setSelectedMatch(match);
                              modal.lineup.onOpen();
                            }}
                            onDeleteClick={handleDeleteClick}
                            onMatchActionsOpen={(match) => {
                              setSelectedMatch(match);
                              onMatchActionsOpen();
                            }}
                            isSeasonClosed={isSeasonClosed()}
                          />
                        )}

                        {/* Standings for this category */}
                        <UnifiedStandingTable standings={standings} loading={standingsLoading} />
                      </div>
                    </Tab>
                  ))}
                </Tabs>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* Add Match Modal */}
      <AddMatchModal
        isOpen={modal.addMatch.isOpen}
        onClose={modal.addMatch.onClose}
        onAddMatch={handleAddMatch}
        formData={formData}
        setFormData={setFormData}
        filteredTeams={filteredTeams}
        selectedCategory={selectedCategory}
        selectedSeason={selectedSeason}
        getMatchweekOptions={getMatchweekOptions}
      />

      {/* Add Result Modal */}
      <AddResultModal
        isOpen={modal.addResult.isOpen}
        onClose={modal.addResult.onClose}
        selectedMatch={selectedMatch}
        resultData={resultData}
        onResultDataChange={setResultData}
        onUpdateResult={handleUpdateResult}
        isSeasonClosed={isSeasonClosed()}
      />

      {/* Edit Match Modal */}
      <EditMatchModal
        isOpen={modal.editMatch.isOpen}
        onClose={modal.editMatch.onClose}
        selectedMatch={selectedMatch}
        editData={editData}
        onEditDataChange={setEditData}
        onUpdateMatch={handleUpdateMatch}
        teams={filteredTeams}
        getMatchweekOptions={getMatchweekOptions}
        isSeasonClosed={isSeasonClosed()}
      />

      {/* Bulk Update Matchweek Modal */}
      <BulkUpdateMatchweekModal
        isOpen={modal.bulkUpdate.isOpen}
        onClose={modal.bulkUpdate.onClose}
        bulkUpdateData={bulkUpdateData}
        onBulkUpdateDataChange={setBulkUpdateData}
        onBulkUpdate={handleBulkUpdateMatchweek}
        categories={categories}
        matches={matches}
        getMatchweekOptions={getMatchweekOptions}
        isSeasonClosed={isSeasonClosed()}
      />

      {/* Lineup Management Modal */}
      <LineupManagerModal
        isOpen={modal.lineup.isOpen}
        onClose={modal.lineup.onClose}
        selectedMatch={selectedMatch}
        members={members}
        onMemberCreated={fetchMembers}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={onExcelImportClose}
        onImport={handleExcelImport}
        categories={categories}
        teams={teams}
        selectedSeason={selectedSeason}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDeleteMatch}
        title="Potvrdit smazání zápasu"
        message={`
          Opravdu chcete smazat zápas <strong>${
            matchToDelete?.home_team?.name || 'Domácí tým'
          } vs ${
            matchToDelete?.away_team?.name || 'Hostující tým'
          }</strong> ze dne ${matchToDelete?.date}?<br><br>
          <span class="text-sm text-gray-600">Tato akce je nevratná a smaže všechny související údaje o zápasu.</span>
        `}
      />

      {/* Match Actions Modal */}
      <MatchActionsModal
        isOpen={isMatchActionsOpen}
        onClose={onMatchActionsClose}
        match={selectedMatch}
        onAddResult={modal.addResult.onOpen}
        onEditMatch={handleEditMatch}
        onLineupModalOpen={modal.lineup.onOpen}
        onDeleteClick={handleDeleteClick}
        onMatchProcessOpen={onMatchProcessOpen}
        isSeasonClosed={isSeasonClosed}
      />

      {/* Match Process Wizard Modal */}
      <MatchProcessWizardModal
        isOpen={isMatchProcessOpen}
        onClose={onMatchProcessClose}
        match={selectedMatch}
      />

      {/* Delete All Matches Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteAllConfirmOpen}
        onClose={onDeleteAllConfirmClose}
        onConfirm={handleDeleteAllMatches}
        title="Potvrdit smazání všech zápasů"
        message={`
          <div class="space-y-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-center space-x-2">
                <span class="font-semibold text-red-800">⚠️ Varování!</span>
              </div>
              <p class="text-red-700 mt-2">
                Tato akce smaže <strong>VŠECHNY</strong> zápasy pro vybranou sezónu.
              </div>
            
            <div class="space-y-2">
              <p>
                Opravdu chcete smazat všechny zápasy pro sezónu <strong>${
                  sortedSeasons.find((s) => s.id === selectedSeason)?.name || 'Neznámá sezóna'
                }</strong>?
              </p>
              <p class="text-sm text-gray-600">
                Tato akce je <strong>nevratná</strong> a smaže:
              </p>
              <ul class="text-sm text-gray-600 list-disc list-inside ml-4 space-y-1">
                <li>Všechny zápasy v této sezóně</li>
                <li>Všechny výsledky a skóre</li>
                <li>Všechny sestavy a lineupy</li>
                <li>Všechny související údaje</li>
              </ul>
              <p class="text-sm text-gray-600 mt-2">
                <strong>Počet zápasů k smazání:</strong> ${
                  [...(seasonalMatches.autumn || []), ...(seasonalMatches.spring || [])].length
                }
              </p>
            </div>
          </div>
        `}
      />
    </AdminContainer>
  );
}
