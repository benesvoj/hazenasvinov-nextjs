'use client';

import {useMemo, useState} from 'react';

import {Input} from '@heroui/input';

import {translations} from '@/lib/translations';

import {Dialog} from '@/components';
import {TournamentMatch} from '@/types';

interface TimeFormData {
  time: string;
}

interface MatchTimePickerModalProps {
  match: TournamentMatch | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (matchId: string, data: {time: string}) => Promise<boolean>;
  isLoading?: boolean;
}

export const MatchTimePickerModal = ({
  match,
  isOpen,
  onClose,
  onSave,
  isLoading,
}: MatchTimePickerModalProps) => {
  const initialValues = useMemo<TimeFormData>(
    () => ({
      time: normalizeTimeToMinutes(match?.time ?? ''),
    }),
    [match]
  );

  const [selectedTime, setSelectedTime] = useState<TimeFormData>(initialValues);

  const [prevMatch, setPrevMatch] = useState<TournamentMatch | null>(null);
  if (match !== prevMatch) {
    setPrevMatch(match);
    if (match) {
      setSelectedTime({
        time: normalizeTimeToMinutes(match.time ?? ''),
      });
    }
  }

  const updateField = (field: keyof TimeFormData) => (value: string) => {
    setSelectedTime((prev) => ({...prev, [field]: value}));
  };

  const handleSubmit = async () => {
    if (!match) return;

    if (selectedTime) {
      const success = await onSave(match.id, {time: normalizeTimeToMinutes(selectedTime.time)});

      if (success) {
        onClose();
      }
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={translations.tournaments.modal.matchTimeTitle}
      onSubmit={handleSubmit}
      size={'sm'}
      isLoading={isLoading}
    >
      <Input
        type="time"
        label={translations.tournaments.labels.matchTime}
        value={selectedTime.time}
        onValueChange={updateField('time')}
        description={translations.tournaments.descriptions.matchTime}
      />
    </Dialog>
  );
};

const normalizeTimeToMinutes = (time: string): string => {
  if (!time) return '';
  const parts = time.split(':');
  if (parts.length < 2) {
    return time;
  }
  const [hours, minutes] = parts;
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};
