'use client';

import {useRef} from 'react';
import LineupManager, {LineupManagerRef} from './LineupManager';
import {Match, Member} from '@/types';
import {UnifiedModal} from '@/components';

interface LineupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMatch: Match | null;
  members: Member[];
}

export default function LineupManagerModal({
  isOpen,
  onClose,
  selectedMatch,
  members,
}: LineupManagerModalProps) {
  const lineupManagerRef = useRef<LineupManagerRef>(null);

  if (!selectedMatch) return null;

  const lineupManagerProps = {
    matchId: selectedMatch.id,
    homeTeamId: selectedMatch.home_team_id,
    awayTeamId: selectedMatch.away_team_id,
    homeTeamName: selectedMatch.home_team?.name || 'Neznámý tým',
    awayTeamName: selectedMatch.away_team?.name || 'Neznámý tým',
    members: members,
    categoryId: selectedMatch.category_id,
    onClose: onClose,
    ref: lineupManagerRef,
  };

  const handleSave = async () => {
    if (lineupManagerRef.current?.saveLineup) {
      await lineupManagerRef.current.saveLineup();
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      className="max-h-[90vh] overflow-y-auto"
      isFooterWithActions
      onPress={handleSave}
      title={`Správa sestav - ${selectedMatch.home_team?.name} vs ${selectedMatch.away_team?.name}`}
    >
      <LineupManager key={selectedMatch.id} {...lineupManagerProps} />
    </UnifiedModal>
  );
}
