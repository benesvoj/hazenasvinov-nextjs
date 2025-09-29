import React from 'react';

import {DeleteConfirmationModal} from '@/components';

import {
  LineupPlayerSelectionModal,
  LineupPlayerEditModal,
  LineupCoachSelectionModal,
  LineupCoachEditModal,
} from '../../../';

interface LineupModalsProps {
  // Player modals
  isPlayerSelectionModalOpen: boolean;
  onPlayerSelectionModalClose: () => void;
  onPlayerSelected: (player: any) => Promise<void>;
  categoryId?: string;
  editingPlayerIndex: number | null;
  currentPlayer: any;
  teamName: string;
  clubId?: string;
  currentLineupPlayers: any[];
  onMemberCreated?: () => void;

  // Player edit modal
  isPlayerEditModalOpen: boolean;
  onPlayerEditClose: () => void;
  onPlayerEditSave: (player: any) => void;
  playerName?: string;

  // Coach modals
  isCoachSelectionModalOpen: boolean;
  onCoachSelectionClose: () => void;
  onCoachSelected: (coach: any) => void;
  coaches: any[];
  editingCoachIndex: number | null;
  currentCoach: any;

  // Coach edit modal
  isCoachEditModalOpen: boolean;
  onCoachEditClose: () => void;
  onCoachEditSave: (coach: any) => void;
  coachIndex: number | null;
  coachName: string;

  // Delete modals
  isDeleteModalOpen: boolean;
  onDeleteModalClose: () => void;
  onDeleteLineup: () => void;
  isDeletePlayerModalOpen: boolean;
  onDeletePlayerModalClose: () => void;
  onConfirmDeletePlayer: () => void;
  currentTeamName: string;
  t: any;
}

const LineupModals: React.FC<LineupModalsProps> = ({
  // Player modals
  isPlayerSelectionModalOpen,
  onPlayerSelectionModalClose,
  onPlayerSelected,
  categoryId,
  editingPlayerIndex,
  currentPlayer,
  teamName,
  clubId,
  currentLineupPlayers,
  onMemberCreated,

  // Player edit modal
  isPlayerEditModalOpen,
  onPlayerEditClose,
  onPlayerEditSave,
  playerName,

  // Coach modals
  isCoachSelectionModalOpen,
  onCoachSelectionClose,
  onCoachSelected,
  coaches,
  editingCoachIndex,
  currentCoach,

  // Coach edit modal
  isCoachEditModalOpen,
  onCoachEditClose,
  onCoachEditSave,
  coachIndex,
  coachName,

  // Delete modals
  isDeleteModalOpen,
  onDeleteModalClose,
  onDeleteLineup,
  isDeletePlayerModalOpen,
  onDeletePlayerModalClose,
  onConfirmDeletePlayer,
  currentTeamName,
  t,
}) => {
  return (
    <>
      {/* Player Selection Modal */}
      <LineupPlayerSelectionModal
        isOpen={isPlayerSelectionModalOpen}
        onClose={onPlayerSelectionModalClose}
        onPlayerSelected={onPlayerSelected}
        categoryId={categoryId}
        editingPlayerIndex={editingPlayerIndex}
        currentPlayer={currentPlayer}
        teamName={teamName}
        clubId={clubId}
        currentLineupPlayers={currentLineupPlayers}
        onMemberCreated={onMemberCreated}
      />

      {/* Player Edit Modal */}
      <LineupPlayerEditModal
        isOpen={isPlayerEditModalOpen}
        onClose={onPlayerEditClose}
        onSave={onPlayerEditSave}
        player={currentPlayer}
        playerName={playerName}
      />

      {/* Coach Selection Modal */}
      <LineupCoachSelectionModal
        isOpen={isCoachSelectionModalOpen}
        onClose={onCoachSelectionClose}
        onCoachSelected={onCoachSelected}
        coaches={coaches}
        editingCoachIndex={editingCoachIndex}
        currentCoach={currentCoach}
      />

      {/* Coach Edit Modal */}
      <LineupCoachEditModal
        isOpen={isCoachEditModalOpen}
        onClose={onCoachEditClose}
        onSave={onCoachEditSave}
        coach={currentCoach}
        coachIndex={coachIndex || 0}
        coachName={coachName}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        onConfirm={onDeleteLineup}
        title="Smazat sestavu"
        message={`Opravdu chcete smazat sestavu pro tým ${currentTeamName}? Tato akce je nevratná.`}
      />

      {/* Delete Player Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeletePlayerModalOpen}
        onClose={onDeletePlayerModalClose}
        onConfirm={onConfirmDeletePlayer}
        title="Odebrat hráče"
        message="Opravdu chcete odebrat tohoto hráče ze sestavy? Tato akce je nevratná."
      />
    </>
  );
};

export default LineupModals;
