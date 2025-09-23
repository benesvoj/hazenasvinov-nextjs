'use client';

import {useMemo} from 'react';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button} from '@heroui/react';
import {UnifiedModal, UnifiedPlayerManager} from '@/components';
import {PlayerSearchResult} from '@/types/unifiedPlayer';
import {LineupPlayerFormData} from '@/types';

interface LineupPlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerSelected: (player: LineupPlayerFormData) => Promise<void>;
  isOwnClub: boolean;
  categoryId?: string;
  editingPlayerIndex?: number | null;
  currentPlayer?: LineupPlayerFormData | null;
  teamName?: string;
  currentLineupPlayers?: LineupPlayerFormData[]; // Current players in the lineup
}

export default function LineupPlayerSelectionModal({
  isOpen,
  onClose,
  onPlayerSelected,
  isOwnClub,
  categoryId,
  editingPlayerIndex,
  currentPlayer,
  teamName,
  currentLineupPlayers = [],
}: LineupPlayerSelectionModalProps) {
  const handlePlayerSelected = async (player: PlayerSearchResult) => {
    const lineupPlayer: LineupPlayerFormData = {
      is_external: !isOwnClub,
      position: player.position || 'field_player',
      role: player.is_captain ? 'captain' : 'player',
      member_id: player.id, // Most players have member_id (created in members table), but legacy external players may not during migration
      jersey_number: player.jersey_number,
    };

    await onPlayerSelected(lineupPlayer);
    onClose();
  };

  const isEditing = editingPlayerIndex !== null && editingPlayerIndex !== undefined;
  const modalTitle = isEditing
    ? isOwnClub
      ? 'Upravit hráče z klubu'
      : 'Upravit externího hráče'
    : isOwnClub
      ? 'Vybrat hráče z klubu'
      : 'Vybrat externího hráče';

  // Get player IDs to exclude (current lineup players, excluding the one being edited)
  const excludePlayerIds = useMemo(() => {
    return currentLineupPlayers
      .map((player) => player.member_id)
      .filter((id): id is string => Boolean(id)) // Filter out undefined/null values and type guard
      .filter((id, index, array) => array.indexOf(id) === index) // Remove duplicates
      .filter((id) => {
        // If editing, don't exclude the current player being edited
        if (isEditing && currentPlayer?.member_id === id) {
          return false;
        }
        return true;
      });
  }, [currentLineupPlayers, isEditing, currentPlayer?.member_id]);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="2xl"
      scrollBehavior="inside"
      isFooterWithActions
      isOnlyCloseButton
    >
      <UnifiedPlayerManager
        showExternalPlayers={!isOwnClub}
        onPlayerSelected={handlePlayerSelected}
        categoryId={categoryId}
        teamName={teamName}
        excludePlayerIds={excludePlayerIds}
      />
    </UnifiedModal>
  );
}
