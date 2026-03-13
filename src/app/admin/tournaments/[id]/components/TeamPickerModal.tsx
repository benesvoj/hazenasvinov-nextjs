'use client';

import React from 'react';

import {Alert} from '@heroui/alert';

import {translations} from '@/lib/translations';

import {Choice, Dialog} from '@/components';
import {FilteredTeam} from '@/hooks';

interface TeamPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: FilteredTeam[];
  onSave: (teamId: string) => void;
}

export const TeamPickerModal = ({isOpen, onClose, teams, onSave}: TeamPickerModalProps) => {
  const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);

  const teamOptions = teams.map((team) => ({
    key: team.id,
    label: team.name,
  }));

  const handleSubmit = () => {
    if (selectedTeam) {
      onSave(selectedTeam);
    }
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={translations.tournaments.modal.addTeamTitle}
      onSubmit={handleSubmit}
      submitButtonLabel={translations.tournaments.actions.addTeam}
      size={'md'}
    >
      <Alert
        hideIcon
        color={'warning'}
        description={translations.tournaments.descriptions.pickableTeams}
      />
      <Choice
        items={teamOptions}
        value={selectedTeam}
        onChange={setSelectedTeam}
        label={translations.tournaments.labels.team}
        placeholder={translations.tournaments.placeholders.team}
        description={translations.tournaments.descriptions.team}
      />
    </Dialog>
  );
};
