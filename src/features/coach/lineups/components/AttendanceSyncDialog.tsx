'use client';

import React, {useState} from 'react';

import {Radio, RadioGroup} from '@heroui/react';

import {AttendanceStatuses} from '@/enums/attendanceStatuses';
import {getAttendanceStatusOptions} from '@/enums/getAttendanceStatusOptions';

import {translations} from '@/lib/translations';

import {Dialog, VStack} from '@/components';
import {AttendanceSyncScope} from '@/features/coach/lineups/helpers/describeAttendanceSync';

const t = translations.lineupMembers.attendanceSync.dialog;

export interface AttendanceSyncTotals {
  /** Records the action would create when every session of the season is in scope. */
  missingTotal: number;
  /** Records the action would create when only `planned` sessions are in scope. */
  missingPlanned: number;
}

interface AttendanceSyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (scope: AttendanceSyncScope, status: AttendanceStatuses) => Promise<void>;
  isLoading: boolean;
  totals: AttendanceSyncTotals;
  /**
   * Sentence naming who the sync is for — one member, or the whole lineup.
   * Composed by the caller, which is the only place that knows the name.
   */
  intro: string;
  /** Whole-lineup runs get their own title. */
  isBulk?: boolean;
}

/**
 * Asks how far back to fill in a member's missing attendance, and with which
 * status.
 *
 * Both questions have to be asked. Scope, because "add them everywhere" and
 * "only from now on" are both legitimate: a player who joined in September was
 * genuinely absent in August, but a lineup that was simply set up late should
 * be backfilled in full. Status, because writing `present` into sessions that
 * already happened would invent attendance nobody recorded — and defaulting to
 * `absent` would invent the opposite. The coach knows which it was.
 */
export const AttendanceSyncDialog = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  totals,
  intro,
  isBulk = false,
}: AttendanceSyncDialogProps) => {
  const [scope, setScope] = useState<AttendanceSyncScope>(AttendanceSyncScope.ALL);
  const [status, setStatus] = useState<AttendanceStatuses>(AttendanceStatuses.PRESENT);

  // Reset on the way out rather than in an effect on `isOpen`: the bulk dialog
  // stays mounted between runs, so without this the second run would open on
  // whatever the first one chose.
  const resetChoices = () => {
    setScope(AttendanceSyncScope.ALL);
    setStatus(AttendanceStatuses.PRESENT);
  };

  const handleClose = () => {
    resetChoices();
    onClose();
  };

  const affected = scope === AttendanceSyncScope.ALL ? totals.missingTotal : totals.missingPlanned;

  const handleSubmit = async () => {
    if (affected === 0) return;
    await onSubmit(scope, status);
    resetChoices();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      isDisabled={affected === 0}
      title={isBulk ? t.titleAll : t.title}
      submitButtonLabel={t.submit}
      size="lg"
    >
      <VStack spacing={4} align="start">
        <p className="text-sm">{intro}</p>

        <RadioGroup
          label={t.scopeLabel}
          value={scope}
          onValueChange={(value) => setScope(value as AttendanceSyncScope)}
        >
          <Radio value={AttendanceSyncScope.ALL} description={t.scopeAllHint(totals.missingTotal)}>
            {t.scopeAll}
          </Radio>
          <Radio
            value={AttendanceSyncScope.PLANNED}
            description={t.scopePlannedHint(totals.missingPlanned)}
          >
            {t.scopePlanned}
          </Radio>
        </RadioGroup>

        <RadioGroup
          label={t.statusLabel}
          orientation="horizontal"
          value={status}
          onValueChange={(value) => setStatus(value as AttendanceStatuses)}
        >
          {getAttendanceStatusOptions().map((option) => (
            <Radio key={option.value} value={option.value}>
              {option.label}
            </Radio>
          ))}
        </RadioGroup>

        <p className="text-xs text-gray-500">{affected === 0 ? t.nothingToDo : t.statusHint}</p>
      </VStack>
    </Dialog>
  );
};
