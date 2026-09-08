'use client';

import React, {useState} from 'react';

import {translations} from '@/lib/translations';

import {Dialog} from '@/components';
import {PlayerPosition} from '@/enums';
import {getMemberFullName} from '@/helpers';
import {CategoryLineupMemberWithMember} from '@/types';

import {LineupMemberSetupCard, LineupMemberSetupData} from './LineupMemberSetupCard';

const t = translations.lineupMembers.editLineupMemberDialog;

/** What a save writes back. Only the fields the setup card owns. */
export interface LineupMemberSetupPatch {
  position: PlayerPosition;
  jersey_number: number | null;
  is_captain: boolean;
  is_vice_captain: boolean;
}

interface LineupMemberEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patch: LineupMemberSetupPatch) => Promise<void>;
  isLoading: boolean;
  member: CategoryLineupMemberWithMember;
  /** Numbers taken by the rest of the lineup — this member's own is not one. */
  existingJerseyNumbers: number[];
}

/** `position` is a plain string in the database; anything unknown reads as a field player. */
const toPosition = (position: string): LineupMemberSetupData['position'] =>
  position === PlayerPosition.GOALKEEPER ? PlayerPosition.GOALKEEPER : PlayerPosition.FIELD_PLAYER;

const toSetupData = (member: CategoryLineupMemberWithMember): LineupMemberSetupData => ({
  position: toPosition(member.position),
  jerseyNumber: member.jersey_number?.toString() ?? '',
  isCaptain: member.is_captain ?? false,
  isViceCaptain: member.is_vice_captain ?? false,
});

/**
 * Edits what the assign dialog asks for when a member is put on the lineup:
 * position, shirt number, captaincy.
 *
 * Those were write-once until now — a coach who skipped them, or typed the
 * wrong number, had to remove the member and add them back, which takes their
 * attendance with them. Same card as the assign dialog, so the two cannot drift
 * apart.
 *
 * Rendered only while a member is selected, so the form state is seeded from
 * that member on mount and cannot carry over to the next one.
 */
export const LineupMemberEditDialog = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  member,
  existingJerseyNumbers,
}: LineupMemberEditDialogProps) => {
  const [setupData, setSetupData] = useState<LineupMemberSetupData>(() => toSetupData(member));

  const handleSubmit = async () => {
    await onSubmit({
      position: setupData.position,
      jersey_number: setupData.jerseyNumber ? parseInt(setupData.jerseyNumber, 10) : null,
      is_captain: setupData.isCaptain,
      is_vice_captain: setupData.isViceCaptain,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      title={t.title}
      subtitle={getMemberFullName(member.members)}
      submitButtonLabel={translations.common.actions.save}
      size="2xl"
    >
      <LineupMemberSetupCard
        existingJerseyNumbers={existingJerseyNumbers}
        selectedMemberData={member.members}
        value={setupData}
        onChange={setSetupData}
        hideSummary
      />
    </Dialog>
  );
};
