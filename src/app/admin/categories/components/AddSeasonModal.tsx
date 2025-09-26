import React from 'react';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter} from '@heroui/modal';
import {Button} from '@heroui/button';
import {Input} from '@heroui/input';
import {CompetitionTypes} from '@/enums';

interface AddSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSeason: () => void;
  seasonFormData: {
    season_id: string;
    matchweek_count: number;
    competition_type: CompetitionTypes;
    team_count: number;
    allow_team_duplicates: boolean;
    is_active: boolean;
  };
  setSeasonFormData: (data: any) => void;
  seasons: Array<{id: string; name: string}>;
  competitionTypes: Record<string, string>;
}

// TODO: refactor this component to use proper components and types, standards
export default function AddSeasonModal({
  isOpen,
  onClose,
  onAddSeason,
  seasonFormData,
  setSeasonFormData,
  seasons,
  competitionTypes,
}: AddSeasonModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>Přidat sezónu ke kategorii</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Season Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sezóna *
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={seasonFormData.season_id}
                onChange={(e) => setSeasonFormData({...seasonFormData, season_id: e.target.value})}
              >
                <option value="">Vyberte sezónu</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Competition Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Typ soutěže
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={seasonFormData.competition_type}
                onChange={(e) =>
                  setSeasonFormData({
                    ...seasonFormData,
                    competition_type: e.target.value as CompetitionTypes,
                  })
                }
              >
                {Object.entries(competitionTypes).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {/* Matchweek Count */}
            <Input
              label="Počet kol"
              type="number"
              value={
                seasonFormData.matchweek_count === 0
                  ? ''
                  : seasonFormData.matchweek_count.toString()
              }
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 0 : isNaN(Number(value)) ? 0 : Number(value);
                setSeasonFormData({...seasonFormData, matchweek_count: numValue});
              }}
              placeholder="Např. 10 pro 10 kol"
              min="0"
            />

            {/* Team Count */}
            <Input
              label="Počet týmů"
              type="number"
              value={seasonFormData.team_count === 0 ? '' : seasonFormData.team_count.toString()}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 0 : isNaN(Number(value)) ? 0 : Number(value);
                setSeasonFormData({...seasonFormData, team_count: numValue});
              }}
              placeholder="Očekávaný počet týmů"
              min="0"
            />

            {/* Allow Team Duplicates */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="add_allow_team_duplicates"
                checked={seasonFormData.allow_team_duplicates}
                onChange={(e) =>
                  setSeasonFormData({...seasonFormData, allow_team_duplicates: e.target.checked})
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="add_allow_team_duplicates"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Povolit A/B týmy stejného klubu
              </label>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="add_season_active"
                checked={seasonFormData.is_active}
                onChange={(e) =>
                  setSeasonFormData({...seasonFormData, is_active: e.target.checked})
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="add_season_active"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Aktivní
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Zrušit
          </Button>
          <Button color="primary" onPress={onAddSeason}>
            Přidat sezónu
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
