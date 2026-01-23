import React from 'react';

import {Button, Input, Select, SelectItem} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {UnifiedModal} from '@/components';
import {AddMatchFormData} from '@/types';
import {isEmpty} from '@/utils';

interface FilteredTeam {
  id: string;
  name: string;
  display_name?: string;
  venue?: string;
}

interface AddMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMatch: () => void;
  formData: AddMatchFormData;
  setFormData: (data: AddMatchFormData) => void;
  filteredTeams: FilteredTeam[];
  selectedCategory: string;
  selectedSeason: string;
  getMatchweekOptions: (categoryId: string) => Array<{value: string; label: string}>;
}

export default function AddMatchModal({
  isOpen,
  onClose,
  onAddMatch,
  formData,
  setFormData,
  filteredTeams,
  selectedCategory,
  selectedSeason,
  getMatchweekOptions,
}: AddMatchModalProps) {
  const footer = (
    <>
      <Button color="danger" variant="flat" onPress={onClose}>
        {translations.common.actions.cancel}
      </Button>
      <Button color="primary" onPress={onAddMatch}>
        {translations.common.actions.add}
      </Button>
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={translations.matches.modal.titles.addMatch}
      size="2xl"
      classNames={{
        base: 'mx-2',
        wrapper: 'items-center justify-center p-2 sm:p-4',
        body: 'px-4 py-4',
        header: 'px-4 py-4',
        footer: 'px-4 py-4',
      }}
      placement="center"
      scrollBehavior="inside"
      footer={footer}
    >
      <div className="space-y-4">
        <Input
          label={translations.common.labels.date}
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
        />
        <Input
          label={translations.common.labels.time}
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({...formData, time: e.target.value})}
        />
        <div>
          <Select
            label={translations.matches.homeTeam}
            placeholder={translations.matches.homeTeamPlaceholder}
            selectedKeys={formData.home_team_id ? [formData.home_team_id] : []}
            onSelectionChange={(keys) => {
              const selectedTeamId = Array.from(keys)[0] as string;
              const selectedTeam = filteredTeams.find((team) => team.id === selectedTeamId);
              setFormData({
                ...formData,
                home_team_id: selectedTeamId || '',
                venue: formData.venue,
              });
            }}
            className="w-full"
            isRequired
          >
            {filteredTeams.map((team) => (
              <SelectItem key={team.id}>{team.display_name || team.name}</SelectItem>
            ))}
          </Select>
          {isEmpty(filteredTeams) && selectedCategory && selectedSeason && <NoTeamsAvailable />}
        </div>
        <div>
          <Select
            label={translations.matches.awayTeam}
            placeholder={translations.matches.awayTeamPlaceholder}
            selectedKeys={formData.away_team_id ? [formData.away_team_id] : []}
            onSelectionChange={(keys) => {
              const selectedTeamId = Array.from(keys)[0] as string;
              setFormData({...formData, away_team_id: selectedTeamId || ''});
            }}
            className="w-full"
            isRequired
          >
            {filteredTeams.map((team) => (
              <SelectItem key={team.id}>{team.display_name || team.name}</SelectItem>
            ))}
          </Select>
          {isEmpty(filteredTeams) && selectedCategory && selectedSeason && <NoTeamsAvailable />}
        </div>
        <Input
          label={translations.matches.venue}
          value={formData.venue}
          onChange={(e) => setFormData({...formData, venue: e.target.value})}
          placeholder={translations.matches.venuePlaceholder}
        />
        <div>
          <Select
            label={translations.matches.matchweek}
            placeholder={translations.matches.matchweekPlaceholder}
            selectedKeys={formData.matchweek ? [String(formData.matchweek)] : []}
            onSelectionChange={(keys) => {
              const selectedMatchweek = Array.from(keys)[0] as string;
              setFormData({
                ...formData,
                matchweek: selectedMatchweek ? parseInt(selectedMatchweek, 10) : undefined,
              });
            }}
            className="w-full"
          >
            {getMatchweekOptions(formData.category_id).map((option) => (
              <SelectItem key={option.value}>{option.label}</SelectItem>
            ))}
          </Select>
        </div>
        <Input
          label={translations.matches.matchNumber}
          placeholder={translations.matches.matchNumberPlaceholder}
          value={formData.match_number?.toString() || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              match_number: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>
    </UnifiedModal>
  );
}

const NoTeamsAvailable = () => {
  return <p className="text-sm text-red-600 mt-1">{translations.matches.noTeamForSelection}</p>;
};
