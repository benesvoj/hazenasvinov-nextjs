'use client';

import React, {useCallback, useEffect, useState} from 'react';

import {Alert, Card, CardBody, Select, SelectItem, Tab, Tabs} from '@heroui/react';

import {useQueryClient} from '@tanstack/react-query';
import {isNilOrEmpty} from 'ramda-adjunct';
import {match} from 'ts-pattern';

import {useMatchesSeasonal} from '@/hooks/shared/queries/useMatchQueries';
import {useModals, useModalWithItem} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations/index';

import {hasItems, isEmpty} from '@/utils/arrayHelper';
import {testMaterializedViewRefresh} from '@/utils/testMaterializedView';

import {getCategoryInfo} from '@/helpers/getCategoryInfo';

import {
  AdminContainer,
  DeleteConfirmationModal,
  LoadingSpinner,
  showToast,
  UnifiedStandingTable,
} from '@/components';
import {ActionTypes, MatchStatus} from '@/enums';
import {
  useExcelImport,
  useFetchCategories,
  useFetchMembers,
  useFetchSeasons,
  useFilteredTeams,
  useMatchMutations,
  useSeasonFiltering,
  useStandings,
  useTeamDisplayLogic,
  useTeams,
} from '@/hooks';
import {AddMatchFormData, EditMatchFormData, Match} from '@/types';
import {
  buildMatchInsertData,
  buildMatchUpdateData,
  calculateStandings,
  createClient,
  generateInitialStandings,
  isNilOrZero,
  refreshMaterializedViewWithCallback,
  validateAddMatchForm,
  validateEditMatchForm,
  validateResultData,
  validateSeasonNotClosed,
} from '@/utils';

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
import {isSeasonClosedHelper} from './helpers/isSeasonClosedHelper';

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
  const modal = useModals(
    'addMatch',
    'addResult',
    'editMatch',
    'bulkUpdate',
    'lineup',
    'excelImport',
    'matchProcess',
    'deleteAllConfirm'
  );
  const deleteConfirm = useModalWithItem<Match>();
  const matchActions = useModalWithItem<Match>();

  const {importMatches} = useExcelImport();

  // Use the team display logic hook
  const {fetchTeamCounts} = useTeamDisplayLogic(selectedCategory);

  // Check if matchweek is expanded
  const isMatchweekExpanded = (categoryId: string, matchweek: number) => {
    const key = `${categoryId}-${matchweek}`;
    return expandedMatchweeks.has(key);
  };

  const [formData, setFormData] = useState<AddMatchFormData>(INITIAL_FORM_DATA);

  const [resultData, setResultData] = useState(INITIAL_RESULT_DATA);

  const [editData, setEditData] = useState<EditMatchFormData>(INITIAL_EDIT_DATA);

  const [bulkUpdateData, setBulkUpdateData] = useState({
    categoryId: '',
    matchweek: '',
    action: 'set' as 'set' | 'remove',
  });

  const [expandedMatchweeks, setExpandedMatchweeks] = useState<Set<string>>(new Set());

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

  const supabase = createClient();

  // Use the enhanced seasons hook
  const {data: seasons, loading: seasonsLoading} = useFetchSeasons();
  const {activeSeason, sortedSeasons} = useSeasonFiltering({seasons: seasons || []});

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const queryClient = useQueryClient();

  // Use the matches hook - pass category code instead of ID, and show ALL matches (admin mode)
  const selectedCategoryId = categories.find((cat) => cat.id === selectedCategory)?.id || '';
  const {data: seasonalMatchesData, error: matchesError} = useMatchesSeasonal({
    categoryId: selectedCategoryId,
    seasonId: selectedSeasonId,
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
  const {filteredTeams, fetchFilteredTeams} = useFilteredTeams(selectedCategory, selectedSeasonId);

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
    if (hasItems(sortedSeasons) && !selectedSeasonId && activeSeason) {
      setSelectedSeasonId(activeSeason.id);
    }
  }, [sortedSeasons, selectedSeasonId, activeSeason]);

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
    if (selectedCategory && selectedSeasonId) {
      fetchStandings(selectedCategory, selectedSeasonId);
    }
  }, [fetchStandings, selectedCategory, selectedSeasonId]);

  // Calculate standings
  const handleCalculateStandings = async () => {
    if (
      !selectedCategory ||
      !selectedSeasonId ||
      selectedCategory.trim() === '' ||
      selectedSeasonId.trim() === ''
    ) {
      setError('Vyberte kategorii a sezónu');
      return;
    }

    const result = await calculateStandings(selectedCategory, selectedSeasonId, isSeasonClosed);

    if (result.success) {
      // Refresh standings
      await fetchStandings(selectedCategory, selectedSeasonId);
      setError('');
    } else {
      setError(result.error || 'Chyba při výpočtu tabulky');
    }
  };

  // Smart standings function - generates or recalculates based on current state
  const handleStandingsAction = async () => {
    if (isSeasonClosed) {
      setError('Nelze upravovat tabulku pro uzavřenou sezónu');
      return;
    }

    try {
      // Check if standings already exist for this category/season
      const existingStandings = standings.filter(
        (s) => s.category_id === selectedCategory && s.season_id === selectedSeasonId
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
      !selectedSeasonId ||
      selectedCategory.trim() === '' ||
      selectedSeasonId.trim() === ''
    ) {
      setError('Vyberte kategorii a sezónu');
      return;
    }

    const result = await generateInitialStandings(
      selectedCategory,
      selectedSeasonId,
      isSeasonClosed
    );

    if (result.success) {
      // Refresh standings
      await fetchStandings(selectedCategory, selectedSeasonId);
      setError('');
    } else {
      setError(result.error || 'Chyba při generování počáteční tabulky');
    }
  };

  const isSeasonClosed = isSeasonClosedHelper(sortedSeasons, selectedSeasonId);

  // Match mutations hook - provides CRUD operations with proper error handling and cache invalidation
  const {
    createMatch,
    updateMatch,
    updateMatchResult,
    deleteMatch: deleteMatchMutation,
    deleteAllMatchesBySeason,
  } = useMatchMutations({
    selectedCategory,
    selectedSeason: selectedSeasonId,
    onStandingsRefresh: () => fetchStandings(selectedCategory, selectedSeasonId),
  });

  // Add new match
  const handleAddMatch = async () => {
    // Validate season is not closed
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'přidat zápas');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }

    // Validate form data
    const validation = validateAddMatchForm(formData);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    // Build insert data using the builder utility
    const insertData = buildMatchInsertData(
      formData,
      selectedCategory,
      selectedSeasonId,
      categories
    );

    // Use the hook to create match (handles Supabase call, cache invalidation, materialized view refresh)
    const success = await createMatch(insertData);

    if (success) {
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
    }
  };

  // Update match result
  // Refactored to use validation utilities and useMatchMutations hook
  // See: docs/refactoring/Matches/PHASE5_CODE_ORGANIZATION_PLAN.md
  const handleUpdateResult = async () => {
    // 1. Validate season is not closed
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'aktualizovat výsledek');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }

    // 2. Check if match is selected
    if (!selectedMatch) return;

    // 3. Validate result data using the proper validation utility
    const validation = validateResultData(resultData);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    // 4. Use the hook to update match result
    // (handles Supabase call, cache invalidation, materialized view refresh, standings recalculation, toasts)
    const success = await updateMatchResult(selectedMatch.id, resultData);

    // 5. Clean up UI state on success
    if (success) {
      modal.addResult.onClose();
      setResultData({home_score: 0, away_score: 0, home_score_halftime: 0, away_score_halftime: 0});
      setSelectedMatch(null);
      setError('');
    }
  };

  // Delete match (after confirmation)
  // Refactored to use validation utilities and useMatchMutations hook
  // See: docs/refactoring/Matches/PHASE5_CODE_ORGANIZATION_PLAN.md
  const handleDeleteMatch = async () => {
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
  };

  // Delete all matches (after confirmation)
  // Refactored to use validation utilities and useMatchMutations hook
  // See: docs/refactoring/Matches/PHASE5_CODE_ORGANIZATION_PLAN.md
  const handleDeleteAllMatches = async () => {
    if (isNilOrEmpty(selectedSeasonId)) return;

    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'smazat zápasy');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }

    const success = await deleteAllMatchesBySeason(selectedSeasonId);

    if (success) {
      setError('');
      modal.deleteAllConfirm.onClose();
      setSelectedCategory('');
    }
  };

  // Open edit match modal
  const handleEditMatch = (match: Match) => {
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

    // Ensure filteredTeams is loaded for this category
    if (match.category_id && selectedSeasonId && isEmpty(filteredTeams)) {
      fetchFilteredTeams(match.category_id, selectedSeasonId);
    }

    // Opens modal
    modal.editMatch.onOpen();
  };

  // Update match
  // Refactored to use validation utilities and useMatchMutations hook
  // See: docs/refactoring/Matches/PHASE5_CODE_ORGANIZATION_PLAN.md
  const handleUpdateMatch = async () => {
    // 1. Validate season is not closed
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'aktualizovat zápas');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }

    // 2. Check if match is selected
    if (!selectedMatch) return;

    // 3. Validate form data using the proper validation utility
    const validation = validateEditMatchForm(editData);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    // 4. build update data using builder utility
    const updateData = buildMatchUpdateData(editData);

    // 5. use hook to update match
    // (handles Supabase call, cache invalidation, materialized view refresh, standings recalculation, toasts)
    const success = await updateMatch(selectedMatch.id, updateData, selectedMatch);

    // 6. Clean up UI state on success
    if (success) {
      modal.editMatch.onClose();
      setEditData(INITIAL_EDIT_DATA);
      setSelectedMatch(null);
      setError('');
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
        queryKey: ['matches', 'seasonal', selectedCategoryId, selectedSeasonId],
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
      if (!selectedSeasonId) {
        setError('Vyberte prosím sezónu před importem.');
        return;
      }

      try {
        const result = await importMatches(matches, selectedSeasonId);

        if (result.success > 0) {
          // Invalidate React Query cache to refresh matches list
          await queryClient.invalidateQueries({
            queryKey: ['matches', 'seasonal', selectedCategoryId, selectedSeasonId],
          });
          await queryClient.invalidateQueries({
            queryKey: ['matches'],
          });

          // Refresh data
          await fetchStandings(selectedCategory, selectedSeasonId);
          setError('');

          // Show success message
          showToast.success(translations.matches.toasts.matchSuccessImport);
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

    [
      selectedSeasonId,
      importMatches,
      fetchStandings,
      selectedCategory,
      queryClient,
      selectedCategoryId,
    ]
  );

  const generateStandingsLabel = match(
    isEmpty(
      standings.filter(
        (s) => s.category_id === selectedCategory && s.season_id === selectedSeasonId
      )
    )
  )
    .with(true, () => translations.matches.actions.generateStandings)
    .otherwise(() => translations.matches.actions.recalculateStandings);

  return (
    <AdminContainer
      actions={[
        {
          label: translations.matches.actions.addMatch,
          onClick: modal.addMatch.onOpen,
          variant: 'solid',
          buttonType: ActionTypes.CREATE,
          isDisabled: isSeasonClosed,
          priority: 'primary', // Most important action - always visible
        },
        {
          label: translations.matches.actions.bulkUpdateMatchweek,
          onClick: modal.bulkUpdate.onOpen,
          buttonType: ActionTypes.UPDATE,
          color: 'secondary',
          isDisabled: isSeasonClosed,
          priority: 'secondary', // Less important - hidden under 3 dots menu
        },
        {
          label: generateStandingsLabel,
          onClick: handleStandingsAction,
          buttonType: ActionTypes.UPDATE,
          color: 'secondary',
          isDisabled: isSeasonClosed,
          priority: 'secondary', // Less important - hidden under 3 dots menu
        },
        {
          label: translations.matches.actions.import,
          onClick: modal.excelImport.onOpen,
          buttonType: ActionTypes.UPDATE,
          color: 'secondary',
          isDisabled: isSeasonClosed,
          priority: 'secondary', // Less important - hidden under 3 dots menu
        },
        {
          label: translations.matches.actions.testMaterializedViewRefresh,
          onClick: testMaterializedViewRefresh,
          color: 'secondary',
          buttonType: ActionTypes.UPDATE,
          isDisabled: isSeasonClosed,
          priority: 'secondary', // Less important - hidden under 3 dots menu
        },
        {
          label: translations.matches.actions.deleteAllMatches,
          onClick: modal.deleteAllConfirm.onOpen,
          buttonType: ActionTypes.DELETE,
          color: 'danger',
          isDisabled: isSeasonClosed || !selectedSeasonId,
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
                label={translations.seasons.title}
                placeholder={translations.seasons.selectSeason}
                selectedKeys={selectedSeasonId ? [selectedSeasonId] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setSelectedSeasonId(selectedKey || '');
                }}
                className="w-full"
              >
                {sortedSeasons.map((season) => (
                  <SelectItem key={season.id} textValue={season.name}>
                    {season.name} {season.is_closed ? `(${translations.seasons.closed})` : ''}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}
        </div>
      }
    >
      {/* Season closed warning */}
      {selectedSeasonId && isSeasonClosed && (
        <Alert
          color="warning"
          title={translations.common.alerts.warning}
          description={translations.seasons.alerts.warning.closedSeasonMessage}
        />
      )}

      {error && (
        <Alert color="danger" description={error} title={translations.common.alerts.error} />
      )}

      {selectedSeasonId && (
        <>
          <Card>
            <CardBody>
              {loading ? (
                <div className="text-center py-8">{translations.common.loading}</div>
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
                          <Alert
                            color={'danger'}
                            description={matchesError.message}
                            title={translations.matches.alerts.danger.matchesFetchingErrorTitle}
                          />
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
                            onDeleteClick={(match) => deleteConfirm.openWith(match)}
                            onMatchActionsOpen={(match) => {
                              setSelectedMatch(match);
                              matchActions.openWith(match);
                            }}
                            isSeasonClosed={isSeasonClosed}
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
        selectedSeason={selectedSeasonId}
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
        isSeasonClosed={isSeasonClosed}
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
        isSeasonClosed={isSeasonClosed}
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
        isSeasonClosed={isSeasonClosed}
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
        isOpen={modal.excelImport.isOpen}
        onClose={modal.excelImport.onClose}
        onImport={handleExcelImport}
        categories={categories}
        teams={teams}
        selectedSeason={selectedSeasonId}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={deleteConfirm.closeAndClear}
        onConfirm={handleDeleteMatch}
        title="Potvrdit smazání zápasu"
        message={`
          Opravdu chcete smazat zápas <strong>${
            deleteConfirm.selectedItem?.home_team?.name || 'Domácí tým'
          } vs ${
            deleteConfirm.selectedItem?.away_team?.name || 'Hostující tým'
          }</strong> ze dne ${deleteConfirm.selectedItem?.date}?<br><br>
          <span class="text-sm text-gray-600">Tato akce je nevratná a smaže všechny související údaje o zápasu.</span>
        `}
      />

      {/* Match Actions Modal */}
      <MatchActionsModal
        isOpen={matchActions.isOpen}
        onClose={matchActions.onClose}
        match={selectedMatch}
        onAddResult={modal.addResult.onOpen}
        onEditMatch={handleEditMatch}
        onLineupModalOpen={modal.lineup.onOpen}
        onDeleteClick={() => deleteConfirm.openWith(selectedMatch!)}
        onMatchProcessOpen={modal.matchProcess.onOpen}
        isSeasonClosed={isSeasonClosed}
      />

      {/* Match Process Wizard Modal */}
      <MatchProcessWizardModal
        isOpen={modal.matchProcess.isOpen}
        onClose={modal.matchProcess.onClose}
        match={selectedMatch}
      />

      {/* Delete All Matches Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={modal.deleteAllConfirm.isOpen}
        onClose={modal.deleteAllConfirm.onClose}
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
                  sortedSeasons.find((s) => s.id === selectedSeasonId)?.name || 'Neznámá sezóna'
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
