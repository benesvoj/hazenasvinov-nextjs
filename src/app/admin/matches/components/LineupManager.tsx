'use client';

import React, {useState, useEffect, forwardRef, useImperativeHandle} from 'react';
import {Card, CardBody, CardHeader, useDisclosure} from '@heroui/react';
import {UserGroupIcon} from '@heroicons/react/24/outline';
import {LineupManagerProps, LineupManagerRef} from '@/types';
import {Heading, DeleteConfirmationModal, LoadingSpinner} from '@/components';
import {
  LineupPlayerSelectionModal,
  LineupPlayerEditModal,
  LineupCoachSelectionModal,
  LineupCoachEditModal,
} from './';
import {TeamTypes} from '@/enums';
import {translations} from '@/lib/translations';
import {useLineupDataManager} from './lineupManager/hooks/useLineupDataManager';
import {
  TeamSelector,
  PlayersTable,
  CoachesTable,
  LineupActions,
  LineupEmptyState,
  LineupTabs,
} from './lineupManager/components';

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

    return (
      <div className="space-y-6">
        <TeamSelector
          selectedTeam={selectedTeam}
          onTeamSelect={setSelectedTeam}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          homeFormData={homeFormData}
          awayFormData={awayFormData}
          calculateLocalSummary={calculateLocalSummary}
          t={t}
        />

        {/* Lineup Management */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-blue-500" />
              <Heading size={3}>
                {t.lineup}: {currentTeamName}
              </Heading>
            </div>
            <LineupActions
              hasPlayersOrCoaches={
                currentFormData.players.length > 0 || currentFormData.coaches.length > 0
              }
              onAddPlayer={handleAddPlayerWithModal}
              onAddCoach={handleAddCoachWithModal}
              onDeleteLineup={onDeleteModalOpen}
              t={t}
            />
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner label={t.loading} />
              </div>
            ) : currentFormData.players.length === 0 && currentFormData.coaches.length === 0 ? (
              <LineupEmptyState onAddPlayer={handleAddPlayerWithModal} t={t} />
            ) : (
              <LineupTabs
                players={currentFormData.players}
                coaches={currentFormData.coaches}
                onEditPlayer={handleEditPlayerWithModal}
                onDeletePlayer={handleDeletePlayerWithModal}
                onEditCoach={handleEditCoachWithModal}
                onDeleteCoach={handleDeleteCoach}
                getMemberName={getMemberName}
                t={t}
              />
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
