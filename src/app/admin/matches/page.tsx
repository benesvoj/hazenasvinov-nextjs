'use client';

import React, {useState, useEffect, useCallback} from 'react';

import {Alert, Select, SelectItem, Tabs, Tab, Card, CardBody, useDisclosure} from '@heroui/react';

import {useQueryClient} from '@tanstack/react-query';

import {useMatchesSeasonal} from '@/hooks/shared/queries/useMatchQueries';

import {translations} from '@/lib/translations';

import {autoRecalculateStandings} from '@/utils/autoStandingsRecalculation';
import {refreshMaterializedViewWithCallback} from '@/utils/refreshMaterializedView';
import {testMaterializedViewRefresh} from '@/utils/testMaterializedView';

import {getCategoryInfo} from '@/helpers/getCategoryInfo';

import {DeleteConfirmationModal, showToast, AdminContainer, LoadingSpinner} from '@/components';
import {matchStatusesKeys} from '@/constants';
import {ActionTypes} from '@/enums';
import {
  useSeasons,
  useFilteredTeams,
  useStandings,
  useCategories,
  useFetchMembers,
  useTeams,
  useExcelImport,
  useTeamDisplayLogic,
} from '@/hooks';
import {Match, AddMatchFormData, EditMatchFormData} from '@/types';
import {calculateStandings, generateInitialStandings, createClient} from '@/utils';

import {
  AddMatchModal,
  AddResultModal,
  EditMatchModal,
  BulkUpdateMatchweekModal,
  ExcelImportModal,
  MatchActionsModal,
  MatchProcessWizardModal,
  LineupManagerModal,
  StandingsTable,
  CategoryMatches,
} from './components';

export default function MatchesAdminPage() {
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Use existing hooks instead of custom state and fetch functions
  const {categories, loading: categoriesLoading, fetchCategories} = useCategories();
  const {members, loading: membersLoading, fetchMembers} = useFetchMembers();
  const {teams, loading: allTeamsLoading, fetchTeams} = useTeams();

  // Modal states
  const {
    isOpen: isAddMatchOpen,
    onOpen: onAddMatchOpen,
    onClose: onAddMatchClose,
  } = useDisclosure();
  const {
    isOpen: isAddResultOpen,
    onOpen: onAddResultOpen,
    onClose: onAddResultClose,
  } = useDisclosure();
  const {
    isOpen: isEditMatchOpen,
    onOpen: onEditMatchOpen,
    onClose: onEditMatchClose,
  } = useDisclosure();
  const {
    isOpen: isBulkUpdateOpen,
    onOpen: onBulkUpdateOpen,
    onClose: onBulkUpdateClose,
  } = useDisclosure();
  const {
    isOpen: isLineupModalOpen,
    onOpen: onLineupModalOpen,
    onClose: onLineupModalClose,
  } = useDisclosure();
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
  const {
    teamCounts,
    loading: teamCountsLoading,
    fetchTeamCounts,
  } = useTeamDisplayLogic(selectedCategory);

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
  const {
    activeSeason,
    sortedSeasons,
    loading: seasonsLoading,
    error: seasonsError,
    fetchAllSeasons,
  } = useSeasons();

  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const queryClient = useQueryClient();

  // Use the matches hook - pass category code instead of ID, and show ALL matches (admin mode)
  const selectedCategoryId = categories.find((cat) => cat.id === selectedCategory)?.id || '';
  const {
    data: seasonalMatchesData,
    isLoading: matchesLoading,
    error: matchesError,
  } = useMatchesSeasonal({
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
  const {
    filteredTeams,
    loading: teamsLoading,
    error: teamsError,
    fetchFilteredTeams,
    clearTeams,
  } = useFilteredTeams(selectedCategory, selectedSeason);

  // Use the standings hook
  const {
    standings,
    loading: standingsLoading,
    error: standingsError,
    fetchStandings,
    clearStandings,
  } = useStandings();

  // Derive loading state from all async operations
  const loading =
    categoriesLoading ||
    seasonsLoading ||
    allTeamsLoading ||
    membersLoading ||
    categories.length === 0 ||
    members.length === 0;

  // Set active season as default when seasons are loaded
  useEffect(() => {
    if (sortedSeasons.length > 0 && !selectedSeason && activeSeason) {
      setSelectedSeason(activeSeason.id);
    }
  }, [sortedSeasons, selectedSeason, activeSeason]);

  // Teams are now automatically fetched when selectedCategory or selectedSeason changes
  // No need for manual useEffect since useFilteredTeams handles this internally

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchAllSeasons();
    fetchTeams();
    fetchMembers();
  }, [fetchCategories, fetchAllSeasons, fetchTeams, fetchMembers]);

  // Set first category as default when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
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
      fetchStandings(selectedCategory, selectedSeason);
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

      if (existingStandings.length === 0) {
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

      onAddMatchClose();
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
          showToast.success('Výsledek zápasu byl uložen a tabulka byla automaticky přepočítána!');
        } else if (standingsResult.success && !standingsResult.recalculated) {
          showToast.success('Výsledek zápasu byl úspěšně uložen!');
        } else {
          showToast.warning('Výsledek zápasu byl uložen, ale nepodařilo se přepočítat tabulku');
        }
      } catch (standingsError) {
        showToast.warning('Výsledek zápasu byl uložen, ale nepodařilo se přepočítat tabulku');
      }

      onAddResultClose();
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
    if (match.category_id && selectedSeason && filteredTeams.length === 0) {
      fetchFilteredTeams(match.category_id, selectedSeason);
    }

    onEditMatchOpen();
  };

  // Update match
  const handleUpdateMatch = async () => {
    if (isSeasonClosed()) {
      setError('Nelze upravit zápas v uzavřené sezóně');
      return;
    }

    if (!selectedMatch) return;

    try {
      // Validate required fields
      if (!editData.date || !editData.time || !editData.venue) {
        setError('Prosím vyplňte všechna povinná pole');
        return;
      }

      // Validate teams are different
      if (editData.home_team_id === editData.away_team_id) {
        setError('Domácí a hostující tým musí být různé');
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

      // Only update scores if they are provided
      if (editData.home_score && editData.away_score) {
        updateData.home_score = editData.home_score;
        updateData.away_score = editData.away_score;
      }
      if (editData.home_score_halftime && editData.away_score_halftime) {
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
            showToast.success('Zápas byl upraven a tabulka byla automaticky přepočítána!');
          } else if (standingsResult.success && !standingsResult.recalculated) {
            showToast.success('Zápas byl úspěšně upraven!');
          } else {
            showToast.warning('Zápas byl upraven, ale nepodařilo se přepočítat tabulku');
          }
        } catch (standingsError) {
          showToast.warning('Zápas byl upraven, ale nepodařilo se přepočítat tabulku');
        }
      }

      onEditMatchClose();
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

        if (matchesToUpdate.length === 0) {
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

        if (matchesToUpdate.length === 0) {
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
      onBulkUpdateClose();
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

  // Helper function to generate matchweek options based on category
  const getMatchweekOptions = (categoryId?: string) => {
    const options = [];
    // Add "No matchweek" option
    options.push({value: '', label: 'Bez kola'});

    const maxMatchweeks = 20; // Default to 20 matchweeks since column doesn't exist

    // Add matchweek numbers based on category setting
    for (let i = 1; i <= maxMatchweeks; i++) {
      options.push({value: i.toString(), label: `${i}. kolo`});
    }
    return options;
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
          showToast.success(
            `Import dokončen! Úspěšně importováno ${result.success} zápasů.${
              result.failed > 0 ? ` ${result.failed} zápasů selhalo.` : ''
            }`
          );
        }

        if (result.errors.length > 0) {
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
    [
      selectedSeason,
      importMatches,
      fetchStandings,
      selectedCategory,
      queryClient,
      selectedCategoryId,
    ]
  );

  const generateStandingsLabel =
    standings.filter((s) => s.category_id === selectedCategory && s.season_id === selectedSeason)
      .length === 0
      ? translations.matches.actions.generateStandings
      : translations.matches.actions.recalculateStandings;

  return (
    <AdminContainer
      actions={[
        {
          label: translations.matches.actions.addMatch,
          onClick: onAddMatchOpen,
          variant: 'solid',
          buttonType: ActionTypes.CREATE,
          isDisabled: isSeasonClosed(),
        },
        {
          label: translations.matches.actions.bulkUpdateMatchweek,
          onClick: onBulkUpdateOpen,
          variant: 'solid',
          buttonType: ActionTypes.UPDATE,
          isDisabled: isSeasonClosed(),
        },
        {
          label: generateStandingsLabel,
          onClick: handleStandingsAction,
          variant: 'solid',
          buttonType: ActionTypes.UPDATE,
          isDisabled: isSeasonClosed(),
        },
        {
          label: translations.matches.actions.import,
          onClick: onExcelImportOpen,
          variant: 'solid',
          buttonType: ActionTypes.UPDATE,
          isDisabled: isSeasonClosed(),
        },
        {
          label: translations.matches.actions.deleteAllMatches,
          onClick: onDeleteAllConfirmOpen,
          variant: 'solid',
          buttonType: ActionTypes.DELETE,
          isDisabled: isSeasonClosed() || !selectedSeason,
        },
        {
          label: translations.matches.actions.testMaterializedViewRefresh,
          onClick: testMaterializedViewRefresh,
          variant: 'solid',
          buttonType: ActionTypes.UPDATE,
          isDisabled: isSeasonClosed(),
        },
      ]}
      filters={
        <div className="w-full">
          {sortedSeasons.length === 0 ? (
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
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-4">
                          {category.name} - {getCategoryInfo(category.id, categories).competition}
                        </h3>

                        {/* Show loading or no category message */}
                        {!selectedCategoryId && (
                          <div className="text-center py-8 text-gray-500">
                            {categories.length === 0
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
                              onAddResultOpen();
                            }}
                            onEditMatch={handleEditMatch}
                            onLineupModalOpen={(match) => {
                              setSelectedMatch(match);
                              onLineupModalOpen();
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
                        <StandingsTable
                          standings={standings}
                          categoryId={category.id}
                          categoryName={category.name}
                          isSeasonClosed={isSeasonClosed()}
                          onGenerateStandings={handleStandingsAction}
                          hasStandings={
                            standings.filter((standing) => standing.category_id === category.id)
                              .length > 0
                          }
                        />
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
        isOpen={isAddMatchOpen}
        onClose={onAddMatchClose}
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
        isOpen={isAddResultOpen}
        onClose={onAddResultClose}
        selectedMatch={selectedMatch}
        resultData={resultData}
        onResultDataChange={setResultData}
        onUpdateResult={handleUpdateResult}
        isSeasonClosed={isSeasonClosed()}
      />

      {/* Edit Match Modal */}
      <EditMatchModal
        isOpen={isEditMatchOpen}
        onClose={onEditMatchClose}
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
        isOpen={isBulkUpdateOpen}
        onClose={onBulkUpdateClose}
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
        isOpen={isLineupModalOpen}
        onClose={onLineupModalClose}
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
        onAddResult={onAddResultOpen}
        onEditMatch={handleEditMatch}
        onLineupModalOpen={onLineupModalOpen}
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

{
  /* //   <div className="lg:hidden">
        //     <MobileActionsMenu */
}
{
  /* //       actions={[ */
}
{
  /* //         {
        //           key: 'add-match',
        //           label: translations.matches.actions.addMatch,
        //           description: translations.matches.actions.addMatchDescription,
        //           color: 'primary',
        //           variant: 'flat',
        //           icon: <PlusIcon className="w-4 h-4" />,
        //           onClick: onAddMatchOpen,
                //   isDisabled: isSeasonClosed(), */
}
{
  /* // },
                // { */
}
{
  /* //   key: 'bulk-update',
                //   label: translations.matches.actions.bulkUpdateMatchweek,
                //   description: translations.matches.actions.bulkUpdateMatchweekDescription,
                //   color: 'warning',
                //   variant: 'flat',
                //   icon: <ArrowPathIcon className="w-4 h-4" />,
                //   onClick: onBulkUpdateOpen,
                //   isDisabled: isSeasonClosed(),
                // },
                // { */
}
{
  /* //   key: 'generate-standings',
                //   label:
                //     standings.filter((s) => s.season_id === selectedSeason).length === 0
                //       ? translations.matches.actions.generateStandings
                //       : translations.matches.actions.recalculateStandings,
                //   description:
                //     standings.filter((s) => s.season_id === selectedSeason).length === 0
        //               ? translations.matches.actions.generateStandingsDescription
        //               : translations.matches.actions.recalculateStandingsDescription,
        //           color: 'success',
        //           variant: 'flat',
        //           onClick: handleStandingsAction,
        //           isDisabled: isSeasonClosed(),
        //         }, */
}
{
  /* //         {
        //           key: 'excel-import',
        //           label: translations.matches.actions.import,
        //           description: translations.matches.actions.importDescription,
        //           color: 'secondary',
        //           variant: 'flat',
        //           icon: <DocumentArrowUpIcon className="w-4 h-4" />,
        //           onClick: onExcelImportOpen,
        //         }, */
}
{
  /* //         {
        //           key: 'delete-all-matches',
        //           label: translations.matches.actions.deleteAllMatches,
        //           description: translations.matches.actions.deleteAllMatchesDescription,
        //           color: 'danger',
        //           variant: 'flat',
        //           icon: <TrashIcon className="w-4 h-4" />,
        //           onClick: onDeleteAllConfirmOpen,
        //           isDisabled: isSeasonClosed() || !selectedSeason,
        //         },
        //       ]}
        //       description="Vyberte akci, kterou chcete provést se zápasy"
        //       triggerColor="primary"
        //       triggerVariant="light"
        //       className="w-auto"
        //     />
        //   </div> */
}
