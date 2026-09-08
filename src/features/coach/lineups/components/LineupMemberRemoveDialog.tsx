'use client';

import React, {useState} from 'react';

import {Checkbox} from '@heroui/react';

import {ExclamationTriangleIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {Dialog, HStack, Show, VStack} from '@/components';

const t = translations.lineupMembers.deleteLineupMemberDialog;

interface LineupMemberRemoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `alsoRemoveAttendance` carries the checkbox state to the caller. */
  onSubmit: (alsoRemoveAttendance: boolean) => Promise<void>;
  isLoading: boolean;
  /** Name of the member being removed, for the message. */
  memberName: string;
  /** Attendance rows this member holds in sessions still marked `planned`. */
  recordedInPlanned: number;
  /**
   * How many of those sessions have already taken place by date. Not the same
   * as zero: nobody flips a training session to `done`, so `planned` is full of
   * sessions that already happened and carry attendance somebody typed in.
   */
  recordedInPlannedPast: number;
}

/**
 * Removes a member from the lineup, and with it their attendance in sessions
 * that are still open.
 *
 * The attendance box is ticked by default, because that is what taking someone
 * off the roster means in practice — leaving them on every future sheet is the
 * bug this whole feature exists to fix. It is still a box rather than an
 * implied side effect, so a coach fixing a mistyped roster entry can untick it
 * and keep the history. Whichever way it goes, the confirm button is red and
 * the count of sessions that have already taken place is stated above it.
 */
export const LineupMemberRemoveDialog = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  memberName,
  recordedInPlanned,
  recordedInPlannedPast,
}: LineupMemberRemoveDialogProps) => {
  const [alsoRemoveAttendance, setAlsoRemoveAttendance] = useState(true);

  // Reset on the way out rather than in an effect on `isOpen`, so the next
  // member does not inherit the previous one's choice.
  const handleClose = () => {
    setAlsoRemoveAttendance(true);
    onClose();
  };

  const handleSubmit = async () => {
    await onSubmit(alsoRemoveAttendance);
    setAlsoRemoveAttendance(true);
  };

  const hasAttendance = recordedInPlanned > 0;
  const warnsAboutPast = alsoRemoveAttendance && recordedInPlannedPast > 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      title={t.title}
      submitButtonLabel={t.confirm}
      dangerAction
      size="lg"
    >
      <VStack spacing={4} align="start">
        <p className="text-sm">
          {t.message} <span className="font-medium">{memberName}</span>
        </p>

        <Show when={hasAttendance}>
          <Checkbox
            isSelected={alsoRemoveAttendance}
            onValueChange={setAlsoRemoveAttendance}
            color="danger"
          >
            {t.attendanceCheckbox(recordedInPlanned)}
          </Checkbox>
        </Show>

        <Show when={!hasAttendance}>
          <p className="text-xs text-gray-500">{t.attendanceNone}</p>
        </Show>

        <Show when={warnsAboutPast}>
          <HStack
            spacing={2}
            align="start"
            className="rounded-lg border border-red-200 bg-red-50 p-3"
          >
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{t.attendancePastWarning(recordedInPlannedPast)}</p>
          </HStack>
        </Show>
      </VStack>
    </Dialog>
  );
};
