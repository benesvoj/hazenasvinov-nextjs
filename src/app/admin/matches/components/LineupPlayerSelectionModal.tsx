'use client';

import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button} from '@heroui/react';
import {UnifiedModal, UnifiedPlayerManager} from '@/components';
import {PlayerSearchResult} from '@/types/unifiedPlayer';
import {LineupPlayerFormData} from '@/types';

interface LineupPlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerSelected: (player: LineupPlayerFormData) => void;
  isOwnClub: boolean;
  categoryId?: string;
  editingPlayerIndex?: number | null;
  currentPlayer?: LineupPlayerFormData | null;
  teamName?: string;
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
}: LineupPlayerSelectionModalProps) {
  const handlePlayerSelected = (player: PlayerSearchResult) => {
    const lineupPlayer: LineupPlayerFormData = {
      is_external: !isOwnClub,
      position: player.position || 'field_player',
      role: player.is_captain ? 'captain' : 'player',
      ...(isOwnClub
        ? {
            member_id: player.id,
            jersey_number: player.jersey_number,
          }
        : {
            external_name: player.name || '',
            external_surname: player.surname || '',
            external_registration_number: player.registration_number || '',
            jersey_number: player.jersey_number,
          }),
    };

    onPlayerSelected(lineupPlayer);
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

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="2xl"
      scrollBehavior="inside"
      isFooterWithActions
    >
      <UnifiedPlayerManager
        showExternalPlayers={!isOwnClub}
        onPlayerSelected={handlePlayerSelected}
        categoryId={categoryId}
        teamName={teamName}
      />
    </UnifiedModal>
  );
}
