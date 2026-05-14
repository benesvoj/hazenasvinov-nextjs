'use client';

import {useRef} from 'react';

import {translations} from '@/lib/translations';

import {UnifiedModal} from '@/components';
import {Match, Member, LineupManagerRef} from '@/types';

import LineupManager from './LineupManager';

interface LineupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMatch: Match | null;
  members: Member[];
  onMemberCreated?: () => void; // Callback when a new member is created
}

export default function LineupManagerModal({
  isOpen,
  onClose,
  selectedMatch,
  members,
  onMemberCreated,
}: LineupManagerModalProps) {
  const lineupManagerRef = useRef<LineupManagerRef>(null);
  const t = translations.lineupManager;

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
    onMemberCreated: onMemberCreated,
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
      title={t.title}
    >
      <LineupManager key={selectedMatch.id} {...lineupManagerProps} />
    </UnifiedModal>
  );
}
