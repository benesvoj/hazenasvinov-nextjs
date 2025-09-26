'use client';

import React, {useEffect, forwardRef, useImperativeHandle} from 'react';
import {Card} from '@heroui/react';
import {LineupManagerProps, LineupManagerRef} from '@/types';
import {TeamTypes} from '@/enums';
import {translations} from '@/lib';
import {useLineupDataManager} from './lineupManager/hooks/useLineupDataManager';
import {useLineupModals} from './lineupManager/hooks/useLineupModals';
import {useLineupPerformance} from './lineupManager/hooks/useLineupPerformance';
import {useLineupErrorHandler} from './lineupManager/hooks/useLineupErrorHandler';
import {TeamSelector, LineupErrorBoundary, LineupSkeleton} from './lineupManager/components';
import {LineupHeader, LineupContent, LineupModals} from './lineupManager/components/utils';

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

    // Modal management
    const {
      isPlayerSelectionModalOpen,
      onPlayerSelectionModalOpen,
      onPlayerSelectionModalClose,
      isPlayerEditModalOpen,
      setIsPlayerEditModalOpen,
      isCoachSelectionModalOpen,
      setIsCoachSelectionModalOpen,
      isCoachEditModalOpen,
      setIsCoachEditModalOpen,
      isDeleteModalOpen,
      onDeleteModalOpen,
      onDeleteModalClose,
      isDeletePlayerModalOpen,
      onDeletePlayerModalOpen,
      onDeletePlayerModalClose,
    } = useLineupModals();

    // Performance monitoring
    const {metrics: performanceMetrics} = useLineupPerformance({
      componentName: 'LineupManager',
      logPerformance: process.env.NODE_ENV === 'development',
      threshold: 16,
    });

    // Error handling
    const {handleAsyncOperation, hasErrors} = useLineupErrorHandler({
      maxErrors: 5,
      autoRetry: true,
      retryDelay: 1000,
    });

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
      [handleEditPlayer, setIsPlayerEditModalOpen]
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
      [handleEditCoach, setIsCoachEditModalOpen]
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
      <LineupErrorBoundary>
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
          {loading ? (
            <LineupSkeleton showHeader={true} showTabs={true} playerCount={5} coachCount={2} />
          ) : (
            <Card>
              <LineupHeader
                currentTeamName={currentTeamName}
                hasPlayersOrCoaches={
                  currentFormData.players.length > 0 || currentFormData.coaches.length > 0
                }
                onAddPlayer={handleAddPlayerWithModal}
                onAddCoach={handleAddCoachWithModal}
                onDeleteLineup={onDeleteModalOpen}
                t={t}
              />
              <LineupContent
                loading={loading}
                players={currentFormData.players}
                coaches={currentFormData.coaches}
                onAddPlayer={handleAddPlayerWithModal}
                onEditPlayer={handleEditPlayerWithModal}
                onDeletePlayer={handleDeletePlayerWithModal}
                onEditCoach={handleEditCoachWithModal}
                onDeleteCoach={handleDeleteCoach}
                getMemberName={getMemberName}
                t={t}
              />
            </Card>
          )}

          {/* All Modals */}
          <LineupModals
            // Player modals
            isPlayerSelectionModalOpen={isPlayerSelectionModalOpen}
            onPlayerSelectionModalClose={handleModalClose}
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
            // Player edit modal
            isPlayerEditModalOpen={isPlayerEditModalOpen}
            onPlayerEditClose={handlePlayerEditClose}
            onPlayerEditSave={handlePlayerEditSave}
            playerName={
              editingPlayerIndex !== null
                ? getMemberName(currentFormData.players[editingPlayerIndex].member_id || '')
                : undefined
            }
            // Coach modals
            isCoachSelectionModalOpen={isCoachSelectionModalOpen}
            onCoachSelectionClose={handleCoachSelectionClose}
            onCoachSelected={handleCoachSelected}
            coaches={availableCoaches}
            editingCoachIndex={editingCoachIndex}
            currentCoach={
              editingCoachIndex !== null ? currentFormData.coaches[editingCoachIndex] : null
            }
            // Coach edit modal
            isCoachEditModalOpen={isCoachEditModalOpen}
            onCoachEditClose={handleCoachEditClose}
            onCoachEditSave={handleCoachEditSave}
            coachIndex={editingCoachIndex}
            coachName={
              editingCoachIndex !== null
                ? getMemberName(currentFormData.coaches[editingCoachIndex].member_id)
                : ''
            }
            // Delete modals
            isDeleteModalOpen={isDeleteModalOpen}
            onDeleteModalClose={onDeleteModalClose}
            onDeleteLineup={handleDeleteLineup}
            isDeletePlayerModalOpen={isDeletePlayerModalOpen}
            onDeletePlayerModalClose={onDeletePlayerModalClose}
            onConfirmDeletePlayer={confirmDeletePlayerWithModal}
            currentTeamName={currentTeamName}
            t={t}
          />
        </div>
      </LineupErrorBoundary>
    );
  }
);

LineupManager.displayName = 'LineupManager';

export default LineupManager;
