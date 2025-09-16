import React from 'react';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter} from '@heroui/modal';
import {Button} from '@heroui/button';
import {Input} from '@heroui/input';

interface CategorySeason {
  id: string;
  category_id: string;
  season_id: string;
  matchweek_count: number;
  competition_type: 'league' | 'league_playoff' | 'tournament';
  team_count: number;
  allow_team_duplicates: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  season?: {
    id: string;
    name: string;
  };
}

interface EditSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSeason: () => void;
  selectedSeason: CategorySeason | null;
  editSeasonFormData: {
    matchweek_count: number;
    competition_type: 'league' | 'league_playoff' | 'tournament';
    team_count: number;
    allow_team_duplicates: boolean;
    is_active: boolean;
  };
  setEditSeasonFormData: (data: any) => void;
  competitionTypes: Record<string, string>;
}

export default function EditSeasonModal({
  isOpen,
  onClose,
  onUpdateSeason,
  selectedSeason,
  editSeasonFormData,
  setEditSeasonFormData,
  competitionTypes,
}: EditSeasonModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>Upravit konfiguraci sezóny</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Season Name (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sezóna
              </label>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                {selectedSeason?.season?.name || 'N/A'}
              </div>
            </div>

            {/* Competition Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Typ soutěže
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={editSeasonFormData.competition_type}
                onChange={(e) =>
                  setEditSeasonFormData({
                    ...editSeasonFormData,
                    competition_type: e.target.value as 'league' | 'league_playoff' | 'tournament',
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
                editSeasonFormData.matchweek_count === 0
                  ? ''
                  : editSeasonFormData.matchweek_count.toString()
              }
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 0 : isNaN(Number(value)) ? 0 : Number(value);
                setEditSeasonFormData({...editSeasonFormData, matchweek_count: numValue});
              }}
              placeholder="Např. 10 pro 10 kol"
              min="0"
            />

            {/* Team Count */}
            <Input
              label="Počet týmů"
              type="number"
              value={
                editSeasonFormData.team_count === 0 ? '' : editSeasonFormData.team_count.toString()
              }
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 0 : isNaN(Number(value)) ? 0 : Number(value);
                setEditSeasonFormData({...editSeasonFormData, team_count: numValue});
              }}
              placeholder="Očekávaný počet týmů"
              min="0"
            />

            {/* Allow Team Duplicates */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_allow_team_duplicates"
                checked={editSeasonFormData.allow_team_duplicates}
                onChange={(e) =>
                  setEditSeasonFormData({
                    ...editSeasonFormData,
                    allow_team_duplicates: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="edit_allow_team_duplicates"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Povolit A/B týmy stejného klubu
              </label>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_season_active"
                checked={editSeasonFormData.is_active}
                onChange={(e) =>
                  setEditSeasonFormData({...editSeasonFormData, is_active: e.target.checked})
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="edit_season_active"
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
          <Button color="primary" onPress={onUpdateSeason}>
            Uložit změny
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
