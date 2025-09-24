'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  useDisclosure,
  Tabs,
  Tab,
  ButtonGroup,
} from '@heroui/react';
import {UserGroupIcon, PlusIcon, TrashIcon, PencilIcon} from '@heroicons/react/24/outline';
import {PlusCircleIcon} from '@heroicons/react/24/solid';
import {useLineupData, useLineupManager, useTeamClubId} from '@/hooks';
import {
  LineupFormData,
  LineupPlayerFormData,
  LineupCoachFormData,
  LineupSummary,
  LineupManagerProps,
  LineupManagerRef,
} from '@/types';
import {
  Heading,
  DeleteConfirmationModal,
  showToast,
  LoadingSpinner,
  UnifiedCard,
  ButtonWithTooltip,
  UnifiedTable,
} from '@/components';
import {
  LineupPlayerSelectionModal,
  LineupPlayerEditModal,
  LineupCoachSelectionModal,
  LineupCoachEditModal,
} from './';
import {LineupCoachRoles, LINEUP_COACH_ROLES_OPTIONS} from '@/constants';
import {classifyLineupError} from '@/helpers';
import {LineupErrorType, MemberFunction, PlayerPosition, TeamTypes} from '@/enums';
import {translations} from '@/lib/translations';

const playersColumns = [
  {key: 'name', label: 'Hráč', allowsSorting: true},
  {key: 'position', label: 'Pozice', allowsSorting: true},
  {key: 'jersey_number', label: 'Dres', allowsSorting: true, align: 'center' as const},
  {key: 'goals', label: 'Góly', allowsSorting: true, align: 'center' as const},
  {key: 'yellow_cards', label: 'ŽK', allowsSorting: true, align: 'center' as const},
  {key: 'red_cards_5min', label: 'ČK5', allowsSorting: true, align: 'center' as const},
  {key: 'red_cards_10min', label: 'ČK10', allowsSorting: true, align: 'center' as const},
  {key: 'red_cards_personal', label: 'ČKOT', allowsSorting: true, align: 'center' as const},
  {key: 'actions', label: 'Akce', align: 'center' as const},
];
const coachesColumns = [
  {key: 'name', label: 'Trenér'},
  {key: 'role', label: 'Funkce'},
  {key: 'actions', label: 'Akce', align: 'center' as const},
];

const LineupManager = forwardRef<LineupManagerRef, LineupManagerProps>(
  (
    {matchId, homeTeamId, awayTeamId, homeTeamName, awayTeamName, members, categoryId, onClose},
    ref
  ) => {
    const t = translations.lineupManager;
    // Filter members by category
    const filteredMembers = useMemo(() => {
      if (!categoryId) {
        return members;
      }

      // Try filtering by category_id first (new approach)
      let filtered = members.filter((member) => member.category_id === categoryId);

      // If no members found with category_id, fallback to legacy category code filtering
      if (filtered.length === 0 && categoryId) {
        filtered = members.filter((member) => member.category_id === categoryId);
      }

      // If still no members found, show all members as fallback
      if (filtered.length === 0) {
        return members;
      }

      return filtered;
    }, [members, categoryId]);

    const [selectedTeam, setSelectedTeam] = useState<TeamTypes>(TeamTypes.HOME);
    const [homeFormData, setHomeFormData] = useState<LineupFormData>({
      match_id: matchId,
      team_id: homeTeamId,
      is_home_team: true,
      players: [],
      coaches: [],
    });

    const [awayFormData, setAwayFormData] = useState<LineupFormData>({
      match_id: matchId,
      team_id: awayTeamId,
      is_home_team: false,
      players: [],
      coaches: [],
    });

    // Get the current team ID based on selected team
    const currentTeamId = useMemo(() => {
      return selectedTeam === TeamTypes.HOME ? homeTeamId : awayTeamId;
    }, [selectedTeam, homeTeamId, awayTeamId]);

    // Get club ID for the current team
    const {
      clubId: currentTeamClubId,
      loading: clubIdLoading,
      error: clubIdError,
    } = useTeamClubId(currentTeamId);

    // Get the current form data based on selected team
    const currentFormData = useMemo(() => {
      return selectedTeam === TeamTypes.HOME ? homeFormData : awayFormData;
    }, [selectedTeam, homeFormData, awayFormData]);

    // Get the setter function for current form data
    const setCurrentFormData = useCallback(
      (updater: (prev: LineupFormData) => LineupFormData) => {
        if (selectedTeam === TeamTypes.HOME) {
          setHomeFormData(updater);
        } else {
          setAwayFormData(updater);
        }
      },
      [selectedTeam]
    );
    const [homeLineupSummary, setHomeLineupSummary] = useState<LineupSummary | null>(null);
    const [awayLineupSummary, setAwayLineupSummary] = useState<LineupSummary | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
    const [deletingPlayerIndex, setDeletingPlayerIndex] = useState<number | null>(null);
    const [isPlayerEditModalOpen, setIsPlayerEditModalOpen] = useState(false);
    const [isCoachSelectionModalOpen, setIsCoachSelectionModalOpen] = useState(false);
    const [isCoachEditModalOpen, setIsCoachEditModalOpen] = useState(false);
    const [editingCoachIndex, setEditingCoachIndex] = useState<number | null>(null);

    // Use the lineup manager hook for Supabase operations
    const {getOrCreateLineupId, findLineupId} = useLineupManager();

    const {
      isOpen: isPlayerSelectionModalOpen,
      onOpen: onPlayerSelectionModalOpen,
      onClose: onPlayerSelectionModalClose,
    } = useDisclosure();

    const {
      isOpen: isDeleteModalOpen,
      onOpen: onDeleteModalOpen,
      onClose: onDeleteModalClose,
    } = useDisclosure();

    const {
      isOpen: isDeletePlayerModalOpen,
      onOpen: onDeletePlayerModalOpen,
      onClose: onDeletePlayerModalClose,
    } = useDisclosure();

    const {
      fetchLineup,
      saveLineup,
      deleteLineup,
      getLineupSummary,
      validateLineupData,
      loading,
      error,
    } = useLineupData();

    const currentTeamName = selectedTeam === TeamTypes.HOME ? homeTeamName : awayTeamName;

    // Load lineup data when team changes
    const handleLoadLineup = useCallback(
      async (isHome: boolean) => {
        try {
          const currentTeamId = isHome ? homeTeamId : awayTeamId;
          const lineupData = await fetchLineup(matchId, currentTeamId);

          const updatedFormData = {
            match_id: matchId,
            team_id: currentTeamId,
            is_home_team: isHome,
            players: lineupData.players || [],
            coaches: lineupData.coaches || [],
          };

          if (isHome) {
            setHomeFormData(updatedFormData);
          } else {
            setAwayFormData(updatedFormData);
          }
        } catch (error) {
          console.error('Error loading lineup:', error);
          // Set empty form data if no lineup exists
          const emptyFormData = {
            match_id: matchId,
            team_id: isHome ? homeTeamId : awayTeamId,
            is_home_team: isHome,
            players: [],
            coaches: [],
          };

          if (isHome) {
            setHomeFormData(emptyFormData);
          } else {
            setAwayFormData(emptyFormData);
          }
        }
      },
      [matchId, homeTeamId, awayTeamId, fetchLineup]
    );

    // Load lineup summaries
    const loadLineupSummaries = useCallback(async () => {
      try {
        const homeSummary = await getLineupSummary(matchId, homeTeamId);
        const awaySummary = await getLineupSummary(matchId, awayTeamId);

        setHomeLineupSummary(homeSummary);
        setAwayLineupSummary(awaySummary);
      } catch (error) {
        console.error('Error loading lineup summaries:', error);
      }
    }, [matchId, homeTeamId, awayTeamId, getLineupSummary]);

    // Load lineup data when component mounts or team changes
    useEffect(() => {
      let isMounted = true;

      const loadData = async () => {
        if (isMounted) {
          await handleLoadLineup(selectedTeam === TeamTypes.HOME);
        }
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }, [selectedTeam, handleLoadLineup]);

    // Load lineup summaries when component mounts
    useEffect(() => {
      let isMounted = true;

      const loadSummaries = async () => {
        if (isMounted) {
          await loadLineupSummaries();
        }
      };

      loadSummaries();

      return () => {
        isMounted = false;
      };
    }, [loadLineupSummaries]);

    const handleSaveLineup = async (isHome: boolean) => {
      try {
        const currentTeamId = isHome ? homeTeamId : awayTeamId;

        // Get current form data for debugging
        const formDataToSave = isHome ? homeFormData : awayFormData;

        // Get or create lineup ID using the hook
        const lineupId = await getOrCreateLineupId(matchId, currentTeamId, isHome);

        // Debug: Verify the match exists in database

        await saveLineup(lineupId, {
          ...formDataToSave,
          match_id: matchId,
          team_id: currentTeamId,
          is_home_team: isHome,
        });

        // Refresh summaries
        await loadLineupSummaries();

        // Show success message
        showToast.success('Sestava byla úspěšně uložena!');

        // Close the dialog only on successful save
        if (onClose) {
          onClose();
        }
      } catch (error: unknown) {
        console.error('Error saving lineup:', error);

        // Use robust error classification
        const classifiedError = classifyLineupError(error);

        // Handle validation errors (keep modal open)
        if (classifiedError.type === LineupErrorType.VALIDATION_ERROR) {
          setValidationError(classifiedError.message);
          showToast.warning(
            `⚠️ Pravidla sestavy:\n\n${classifiedError.message}\n\nOpravte chyby a zkuste to znovu.`
          );
          return; // Don't close the modal
        }

        // Handle database errors
        if (classifiedError.type === LineupErrorType.DATABASE_ERROR) {
          showToast.danger(
            `❌ Chyba databáze:\n\n${classifiedError.message}\n\nKontaktujte podporu.`
          );
          return;
        }

        // Handle network errors
        if (classifiedError.type === LineupErrorType.NETWORK_ERROR) {
          showToast.danger(
            `❌ Problém se sítí:\n\n${classifiedError.message}\n\nZkontrolujte připojení a zkuste to znovu.`
          );
          return;
        }

        // Handle unknown errors
        showToast.danger(`❌ Neznámá chyba:\n\n${classifiedError.message}\n\nKontaktujte podporu.`);
      }
    };

    // Expose saveLineup function to parent component
    useImperativeHandle(ref, () => ({
      saveLineup: async () => {
        await handleSaveLineup(selectedTeam === TeamTypes.HOME);
      },
    }));

    const handleDeleteLineup = async () => {
      try {
        const currentTeamId = selectedTeam === TeamTypes.HOME ? homeTeamId : awayTeamId;

        // Find the lineup ID using the hook
        const lineupId = await findLineupId(matchId, currentTeamId);

        if (!lineupId) {
          // If no lineup exists, just reset the form data and show success message
          const emptyFormData = {
            match_id: matchId,
            team_id: currentTeamId,
            is_home_team: selectedTeam === TeamTypes.HOME,
            players: [],
            coaches: [],
          };

          if (selectedTeam === TeamTypes.HOME) {
            setHomeFormData(emptyFormData);
          } else {
            setAwayFormData(emptyFormData);
          }

          await loadLineupSummaries();
          onDeleteModalClose();
          alert('Sestava byla vymazána (neexistovala v databázi)');
          return;
        }

        await deleteLineup(lineupId);

        // Reset form data
        const emptyFormData = {
          match_id: matchId,
          team_id: currentTeamId,
          is_home_team: selectedTeam === TeamTypes.HOME,
          players: [],
          coaches: [],
        };

        if (selectedTeam === TeamTypes.HOME) {
          setHomeFormData(emptyFormData);
        } else {
          setAwayFormData(emptyFormData);
        }

        await loadLineupSummaries();
        onDeleteModalClose();
      } catch (error: unknown) {
        console.error('Error deleting lineup:', error);
        const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
        alert(`Chyba při mazání sestavy: ${errorMessage}`);
      }
    };

    const handleAddPlayer = () => {
      // Clear validation error when user adds players
      if (validationError) {
        setValidationError(null);
      }

      onPlayerSelectionModalOpen();
    };

    const handlePlayerSelected = async (player: LineupPlayerFormData) => {
      if (editingPlayerIndex !== null) {
        // Editing existing player
        setCurrentFormData((prev) => ({
          ...prev,
          players: prev.players.map((p, i) => (i === editingPlayerIndex ? player : p)),
        }));
        setEditingPlayerIndex(null);
      } else {
        // Adding new player
        const updatedFormData = {
          ...currentFormData,
          players: [...currentFormData.players, player],
        };

        setCurrentFormData((prev) => updatedFormData);

        // If this is the first player, create lineup automatically
        if (currentFormData.players.length === 0) {
          try {
            const isHome = selectedTeam === TeamTypes.HOME;
            const currentTeamId = isHome ? homeTeamId : awayTeamId;

            const lineupId = await getOrCreateLineupId(matchId, currentTeamId, isHome);
            await saveLineup(
              lineupId,
              {
                ...updatedFormData,
                match_id: matchId,
                team_id: currentTeamId,
                is_home_team: isHome,
              },
              true
            ); // Skip validation for automatic lineup creation
            showToast.success('Sestava byla automaticky vytvořena');

            // Show validation warnings for incomplete lineup
            const validation = validateLineupData(updatedFormData);
            if (validation.warnings.length > 0) {
              showToast.warning(`Upozornění: ${validation.warnings.join(', ')}`);
            }

            // Show specific warning about goalkeeper requirement
            const goalkeepers = updatedFormData.players.filter((p) => p.position === 'goalkeeper');
            if (goalkeepers.length === 0) {
              showToast.warning('Upozornění: Sestava musí mít alespoň 1 brankáře');
            }
          } catch (error) {
            console.error('Error creating lineup automatically:', error);

            // Check if it's a validation warning that we should show as a warning instead of error
            if (error instanceof Error && error.message.includes('VALIDATION_WARNING')) {
              const warningMessage = error.message.replace('VALIDATION_WARNING: ', '');
              showToast.warning(`Upozornění: ${warningMessage}`);
              // Still show success for lineup creation, just with warning
              showToast.success('Sestava byla vytvořena s upozorněním');
            } else {
              showToast.danger(
                `Chyba při vytváření sestavy: ${error instanceof Error ? error.message : 'Neznámá chyba'}`
              );
            }
          }
        } else {
          // Player added to existing lineup
          showToast.success('Hráč byl přidán do sestavy');

          // Show validation warnings for incomplete lineup
          const validation = validateLineupData(updatedFormData);
          if (validation.warnings.length > 0) {
            showToast.warning(`Upozornění: ${validation.warnings.join(', ')}`);
          }
        }
      }
    };

    const handleEditPlayer = useCallback((index: number) => {
      setEditingPlayerIndex(index);
      setIsPlayerEditModalOpen(true);
    }, []);

    const handleModalClose = () => {
      setEditingPlayerIndex(null);
      onPlayerSelectionModalClose();
    };

    const handlePlayerEditSave = (updatedPlayer: LineupPlayerFormData) => {
      if (editingPlayerIndex !== null) {
        setCurrentFormData((prev) => ({
          ...prev,
          players: prev.players.map((p, i) => (i === editingPlayerIndex ? updatedPlayer : p)),
        }));
        setEditingPlayerIndex(null);
      }
    };

    const handlePlayerEditClose = () => {
      setIsPlayerEditModalOpen(false);
      setEditingPlayerIndex(null);
    };

    const handleDeletePlayer = useCallback(
      (index: number) => {
        setDeletingPlayerIndex(index);
        onDeletePlayerModalOpen();
      },
      [onDeletePlayerModalOpen]
    );

    const confirmDeletePlayer = () => {
      if (deletingPlayerIndex !== null) {
        // Clear validation error when user removes players
        if (validationError) {
          setValidationError(null);
        }

        setCurrentFormData((prev) => ({
          ...prev,
          players: prev.players.filter((_, i) => i !== deletingPlayerIndex),
        }));

        setDeletingPlayerIndex(null);
        onDeletePlayerModalClose();
      }
    };

    const handleAddCoach = () => {
      setIsCoachSelectionModalOpen(true);
    };

    const handleCoachSelected = (coach: {member_id: string; role: string}) => {
      const coachData: LineupCoachFormData = {
        member_id: coach.member_id,
        role: coach.role as LineupCoachRoles,
      };

      if (editingCoachIndex !== null) {
        // Editing existing coach
        setCurrentFormData((prev) => ({
          ...prev,
          coaches: prev.coaches.map((c, i) => (i === editingCoachIndex ? coachData : c)),
        }));
        setEditingCoachIndex(null);
      } else {
        // Adding new coach
        setCurrentFormData((prev) => {
          const newFormData = {
            ...prev,
            coaches: [...prev.coaches, coachData],
          };
          return newFormData;
        });
      }
    };

    const handleEditCoach = useCallback((index: number) => {
      setEditingCoachIndex(index);
      setIsCoachEditModalOpen(true);
    }, []);

    const handleCoachEditSave = (updatedCoach: LineupCoachFormData) => {
      if (editingCoachIndex !== null) {
        setCurrentFormData((prev) => ({
          ...prev,
          coaches: prev.coaches.map((c, i) => (i === editingCoachIndex ? updatedCoach : c)),
        }));
        setEditingCoachIndex(null);
      }
    };

    const handleCoachEditClose = () => {
      setIsCoachEditModalOpen(false);
      setEditingCoachIndex(null);
    };

    const handleCoachSelectionClose = () => {
      setIsCoachSelectionModalOpen(false);
      setEditingCoachIndex(null);
    };

    const handleDeleteCoach = useCallback(
      (index: number) => {
        setCurrentFormData((prev) => ({
          ...prev,
          coaches: prev.coaches.filter((_, i) => i !== index),
        }));
      },
      [setCurrentFormData]
    );

    const getMemberName = useCallback(
      (memberId: string) => {
        const member = filteredMembers.find((m) => m.id === memberId);
        return member ? `${member.surname} ${member.name}` : 'Neznámý člen';
      },
      [filteredMembers]
    );

    const getAvailableCoaches = () => {
      let coaches = filteredMembers.filter((m) => m.functions?.includes(MemberFunction.COACH));

      // If we have club information, filter by the current team's club
      if (currentTeamClubId) {
        coaches = coaches.filter(
          (m) => m.core_club_id === currentTeamClubId || m.current_club_id === currentTeamClubId
        );
      }

      return coaches;
    };

    const getLineupSummaryDisplay = (summary: LineupSummary | null, teamName: string) => {
      if (!summary) {
        return <div className="text-gray-500 text-sm">Žádná sestava</div>;
      }

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{teamName}</span>
          </div>
          <div className="text-xs text-gray-600 space-x-2">
            <span>
              {t.goalkeepers}: {summary.goalkeepers}/2
            </span>
            <span>
              {t.players}: {summary.field_players}/13
            </span>
            <span>
              {t.coaches}: {summary.coaches}/3
            </span>
          </div>
        </div>
      );
    };

    const renderPlayerCell = React.useCallback(
      (player: LineupPlayerFormData, columnKey: React.Key) => {
        const cellValue = player[columnKey as keyof LineupPlayerFormData];

        switch (columnKey) {
          case 'name':
            return getMemberName(player?.member_id || `${t.unknownPlayer}`);
          case 'position':
            return player.position === PlayerPosition.GOALKEEPER ? t.goalkeepers : t.players;
          case 'jersey_number':
            return player.jersey_number || '-';
          case 'goals':
            return player.goals || 0;
          case 'yellow_cards':
            return player.yellow_cards || 0;
          case 'red_cards_5min':
            return player.red_cards_5min || 0;
          case 'red_cards_10min':
            return player.red_cards_10min || 0;
          case 'red_cards_personal':
            return player.red_cards_personal || 0;
          case 'actions':
            const playerIndex = currentFormData.players.findIndex(
              (p) => p.member_id === player.member_id
            );
            return (
              <ButtonGroup>
                <Button
                  size="sm"
                  color="primary"
                  variant="light"
                  onPress={() => handleEditPlayer(playerIndex)}
                  isIconOnly
                  aria-label="Upravit hráče"
                  startContent={<PencilIcon className="w-4 h-4" />}
                />
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => handleDeletePlayer(playerIndex)}
                  isIconOnly
                  aria-label="Odebrat hráče"
                  startContent={<TrashIcon className="w-4 h-4" />}
                />
              </ButtonGroup>
            );
          default:
            return cellValue;
        }
      },
      [
        currentFormData.players,
        getMemberName,
        handleEditPlayer,
        handleDeletePlayer,
        t.goalkeepers,
        t.players,
        t.unknownPlayer,
      ]
    );

    const renderCoachCell = React.useCallback(
      (coach: LineupCoachFormData, columnKey: React.Key) => {
        const cellValue = coach[columnKey as keyof LineupCoachFormData];

        switch (columnKey) {
          case 'name':
            return getMemberName(coach.member_id);
          case 'role':
            return (
              LINEUP_COACH_ROLES_OPTIONS.find((role) => role.value === coach.role)?.label ||
              coach.role
            );
          case 'actions':
            const coachIndex = currentFormData.coaches.findIndex(
              (item) => item.member_id === coach.member_id
            );
            return (
              <ButtonGroup>
                <Button
                  size="sm"
                  color="primary"
                  variant="light"
                  onPress={() => handleEditCoach(coachIndex)}
                  isIconOnly
                  aria-label={t.editCoach}
                  startContent={<PencilIcon className="w-4 h-4" />}
                />
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => handleDeleteCoach(coachIndex)}
                  isIconOnly
                  aria-label={t.deleteCoach}
                  startContent={<TrashIcon className="w-4 h-4" />}
                />
              </ButtonGroup>
            );
          default:
            return cellValue;
        }
      },
      [currentFormData.coaches, getMemberName, handleEditCoach, handleDeleteCoach, t]
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UnifiedCard
            onPress={() => setSelectedTeam(TeamTypes.HOME)}
            title={t.homeTeam}
            titleSize={4}
            isSelected={selectedTeam === TeamTypes.HOME}
          >
            {getLineupSummaryDisplay(homeLineupSummary, homeTeamName)}
          </UnifiedCard>
          <UnifiedCard
            onPress={() => setSelectedTeam(TeamTypes.AWAY)}
            title={t.awayTeam}
            titleSize={4}
            isSelected={selectedTeam === TeamTypes.AWAY}
          >
            {getLineupSummaryDisplay(awayLineupSummary, awayTeamName)}
          </UnifiedCard>
        </div>

        {/* Lineup Management */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-blue-500" />
              <Heading size={3}>
                {t.lineup}: {currentTeamName}
              </Heading>
            </div>
            <div className="flex gap-2">
              {(currentFormData.players.length > 0 || currentFormData.coaches.length > 0) && (
                <>
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<PlusCircleIcon className="w-4 h-4" />}
                    onPress={handleAddPlayer}
                  >
                    {t.addPlayer}
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<PlusCircleIcon className="w-4 h-4" />}
                    onPress={handleAddCoach}
                  >
                    {t.addCoach}
                  </Button>
                  <ButtonWithTooltip
                    tooltip={t.deleteLineup}
                    onPress={onDeleteModalOpen}
                    isIconOnly
                    isDanger
                    ariaLabel="Remove lineup"
                    startContent={<TrashIcon className="w-4 h-4" />}
                  />
                </>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner label={t.loading} />
              </div>
            ) : currentFormData.players.length === 0 && currentFormData.coaches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">{t.noLineup}</p>
                <Button
                  color="primary"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={handleAddPlayer}
                >
                  {t.addPlayer}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Tabs>
                  <Tab key="players" title={`${t.players} (${currentFormData.players.length})`}>
                    <UnifiedTable
                      columns={playersColumns}
                      data={currentFormData.players}
                      ariaLabel={t.listOfPlayers}
                      renderCell={renderPlayerCell}
                      getKey={(player) => player.member_id || ''}
                      isStriped
                    />
                  </Tab>
                  <Tab key="coaches" title={`${t.coaches} (${currentFormData.coaches.length})`}>
                    <UnifiedTable
                      columns={coachesColumns}
                      data={currentFormData.coaches}
                      ariaLabel={t.listOfCoaches}
                      renderCell={renderCoachCell}
                      getKey={(coach) => coach.member_id}
                      isStriped
                    />
                  </Tab>
                </Tabs>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Player Selection Modal */}
        <LineupPlayerSelectionModal
          isOpen={isPlayerSelectionModalOpen}
          onClose={handleModalClose}
          onPlayerSelected={handlePlayerSelected}
          categoryId={categoryId}
          editingPlayerIndex={editingPlayerIndex}
          currentPlayer={
            editingPlayerIndex !== null ? currentFormData.players[editingPlayerIndex] : null
          }
          teamName={currentTeamName}
          clubId={currentTeamClubId || undefined}
          currentLineupPlayers={currentFormData.players}
        />

        {/* Player Edit Modal */}
        <LineupPlayerEditModal
          isOpen={isPlayerEditModalOpen}
          onClose={handlePlayerEditClose}
          onSave={handlePlayerEditSave}
          player={editingPlayerIndex !== null ? currentFormData.players[editingPlayerIndex] : null}
          playerName={
            editingPlayerIndex !== null
              ? getMemberName(currentFormData.players[editingPlayerIndex].member_id || '')
              : undefined
          }
        />

        {/* Coach Selection Modal */}
        <LineupCoachSelectionModal
          isOpen={isCoachSelectionModalOpen}
          onClose={handleCoachSelectionClose}
          onCoachSelected={handleCoachSelected}
          coaches={getAvailableCoaches()}
          editingCoachIndex={editingCoachIndex}
          currentCoach={
            editingCoachIndex !== null ? currentFormData.coaches[editingCoachIndex] : null
          }
        />

        {/* Coach Edit Modal */}
        <LineupCoachEditModal
          isOpen={isCoachEditModalOpen}
          onClose={handleCoachEditClose}
          onSave={handleCoachEditSave}
          coach={editingCoachIndex !== null ? currentFormData.coaches[editingCoachIndex] : null}
          coachIndex={editingCoachIndex || 0}
          coachName={
            editingCoachIndex !== null
              ? getMemberName(currentFormData.coaches[editingCoachIndex].member_id)
              : ''
          }
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={onDeleteModalClose}
          onConfirm={handleDeleteLineup}
          title="Smazat sestavu"
          message={`Opravdu chcete smazat sestavu pro tým ${currentTeamName}? Tato akce je nevratná.`}
        />

        {/* Delete Player Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeletePlayerModalOpen}
          onClose={onDeletePlayerModalClose}
          onConfirm={confirmDeletePlayer}
          title="Odebrat hráče"
          message="Opravdu chcete odebrat tohoto hráče ze sestavy? Tato akce je nevratná."
        />
      </div>
    );
  }
);

LineupManager.displayName = 'LineupManager';

export default LineupManager;
