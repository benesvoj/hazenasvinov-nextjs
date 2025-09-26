'use client';

import React, {useState, useEffect, forwardRef, useImperativeHandle} from 'react';
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
import {
  LineupManagerProps,
  LineupManagerRef,
  LineupSummary,
  LineupPlayerFormData,
  LineupCoachFormData,
} from '@/types';
import {
  Heading,
  DeleteConfirmationModal,
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
import {getLineupCoachRoleOptions, PlayerPosition, TeamTypes} from '@/enums';
import {translations} from '@/lib/translations';
import {useLineupDataManager} from './lineupManager/hooks/useLineupDataManager';

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
    {
      matchId,
      homeTeamId,
      awayTeamId,
      homeTeamName,
      awayTeamName,
      members,
      categoryId,
      onClose,
      onMemberCreated,
    },
    ref
  ) => {
    const t = translations.lineupManager;

    // Use the data manager hook
    const {
      // Form data
      homeFormData,
      awayFormData,
      selectedTeam,
      setSelectedTeam,

      // Current team data
      currentTeamId,
      currentTeamName,
      currentFormData,
      setCurrentFormData,

      // Club information
      currentTeamClubId,
      clubIdLoading,
      clubIdError,

      // Filtered members
      filteredMembers,
      availableCoaches,

      // Validation
      validationError,
      setValidationError,

      // CRUD operations
      handleLoadLineup,
      handleSaveLineup,
      handleDeleteLineup,

      // Player operations
      handleAddPlayer,
      handlePlayerSelected,
      handleEditPlayer,
      handlePlayerEditSave,
      handleDeletePlayer,
      confirmDeletePlayer,

      // Coach operations
      handleAddCoach,
      handleCoachSelected,
      handleEditCoach,
      handleCoachEditSave,
      handleDeleteCoach,

      // Utility functions
      getMemberName,
      calculateLocalSummary,

      // Modal states
      editingPlayerIndex,
      setEditingPlayerIndex,
      deletingPlayerIndex,
      setDeletingPlayerIndex,
      editingCoachIndex,
      setEditingCoachIndex,

      // Loading and error states
      loading,
      error,
    } = useLineupDataManager({
      matchId,
      homeTeamId,
      awayTeamId,
      homeTeamName,
      awayTeamName,
      members,
      categoryId,
      onClose,
      onMemberCreated,
    });

    // Modal states
    const [isPlayerEditModalOpen, setIsPlayerEditModalOpen] = useState(false);
    const [isCoachSelectionModalOpen, setIsCoachSelectionModalOpen] = useState(false);
    const [isCoachEditModalOpen, setIsCoachEditModalOpen] = useState(false);

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

    // Expose saveLineup function to parent component
    useImperativeHandle(ref, () => ({
      saveLineup: async () => {
        await handleSaveLineup(selectedTeam === TeamTypes.HOME);
      },
    }));

    // Enhanced handlers that include modal management
    const handleAddPlayerWithModal = () => {
      handleAddPlayer();
      onPlayerSelectionModalOpen();
    };

    const handleEditPlayerWithModal = React.useCallback(
      (index: number) => {
        handleEditPlayer(index);
        setIsPlayerEditModalOpen(true);
      },
      [handleEditPlayer]
    );

    const handleDeletePlayerWithModal = React.useCallback(
      (index: number) => {
        handleDeletePlayer(index);
        onDeletePlayerModalOpen();
      },
      [handleDeletePlayer, onDeletePlayerModalOpen]
    );

    const handleAddCoachWithModal = () => {
      handleAddCoach();
      setIsCoachSelectionModalOpen(true);
    };

    const handleEditCoachWithModal = React.useCallback(
      (index: number) => {
        handleEditCoach(index);
        setIsCoachEditModalOpen(true);
      },
      [handleEditCoach]
    );

    const handleModalClose = () => {
      setEditingPlayerIndex(null);
      onPlayerSelectionModalClose();
    };

    const handlePlayerEditClose = () => {
      setIsPlayerEditModalOpen(false);
      setEditingPlayerIndex(null);
    };

    const handleCoachEditClose = () => {
      setIsCoachEditModalOpen(false);
      setEditingCoachIndex(null);
    };

    const handleCoachSelectionClose = () => {
      setIsCoachSelectionModalOpen(false);
      setEditingCoachIndex(null);
    };

    const confirmDeletePlayerWithModal = () => {
      confirmDeletePlayer();
      onDeletePlayerModalClose();
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
            return player.position === PlayerPosition.GOALKEEPER ? t.goalkeeper : t.player;
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
                  onPress={() => handleEditPlayerWithModal(playerIndex)}
                  isIconOnly
                  aria-label="Upravit hráče"
                  startContent={<PencilIcon className="w-4 h-4" />}
                />
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => handleDeletePlayerWithModal(playerIndex)}
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
        handleEditPlayerWithModal,
        handleDeletePlayerWithModal,
        t,
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
              getLineupCoachRoleOptions().find((role) => role.value === coach.role)?.label ||
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
                  onPress={() => handleEditCoachWithModal(coachIndex)}
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
      [currentFormData.coaches, getMemberName, handleEditCoachWithModal, handleDeleteCoach, t]
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
            {getLineupSummaryDisplay(calculateLocalSummary(homeFormData), homeTeamName)}
          </UnifiedCard>
          <UnifiedCard
            onPress={() => setSelectedTeam(TeamTypes.AWAY)}
            title={t.awayTeam}
            titleSize={4}
            isSelected={selectedTeam === TeamTypes.AWAY}
          >
            {getLineupSummaryDisplay(calculateLocalSummary(awayFormData), awayTeamName)}
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
                    onPress={handleAddPlayerWithModal}
                  >
                    {t.addPlayer}
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<PlusCircleIcon className="w-4 h-4" />}
                    onPress={handleAddCoachWithModal}
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
                  onPress={handleAddPlayerWithModal}
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
          onMemberCreated={onMemberCreated}
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
          coaches={availableCoaches}
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
          onConfirm={confirmDeletePlayerWithModal}
          title="Odebrat hráče"
          message="Opravdu chcete odebrat tohoto hráče ze sestavy? Tato akce je nevratná."
        />
      </div>
    );
  }
);

LineupManager.displayName = 'LineupManager';

export default LineupManager;
