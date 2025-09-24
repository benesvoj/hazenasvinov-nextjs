'use client';

import {useMemo} from 'react';
import {UnifiedModal, UnifiedPlayerManager} from '@/components';
import {PlayerSearchResult, LineupPlayerFormData, LineupPlayerSelectionModalProps} from '@/types';

export default function LineupPlayerSelectionModal({
  isOpen,
  onClose,
  onPlayerSelected,
  categoryId,
  editingPlayerIndex,
  currentPlayer,
  teamName,
  clubId,
  currentLineupPlayers = [],
}: LineupPlayerSelectionModalProps) {
  const handlePlayerSelected = async (player: PlayerSearchResult) => {
    const lineupPlayer: LineupPlayerFormData = {
      position: player.position || 'field_player',
      is_captain: player.is_captain,
      member_id: player.id, // Most players have member_id (created in members table), but legacy external players may not during migration
      jersey_number: player.jersey_number,
    };

    await onPlayerSelected(lineupPlayer);
    onClose();
  };

  const isEditing = editingPlayerIndex !== null && editingPlayerIndex !== undefined;
  const modalTitle = isEditing ? 'Upravit hráče' : 'Vybrat hráče';

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

  console.log('clubId', clubId);

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
        clubId={clubId}
        showExternalPlayers={false}
        onPlayerSelected={handlePlayerSelected}
        categoryId={categoryId}
        teamName={teamName}
        excludePlayerIds={excludePlayerIds}
      />
    </UnifiedModal>
  );
}
