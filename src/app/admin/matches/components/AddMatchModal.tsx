import React from 'react';

import {
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';

import {translations} from '@/lib/translations';

import {AddMatchFormData} from '@/types';

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
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
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
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Přidat nový zápas</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Datum"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
              <Input
                label="Čas"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
              <div>
                <div className="text-xs text-gray-500 mb-2">
                  Debug: Category: {selectedCategory}, Season: {selectedSeason}, Teams:{' '}
                  {filteredTeams.length}
                </div>
                <Select
                  label="Domácí tým"
                  placeholder="Vyberte domácí tým"
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
                {filteredTeams.length === 0 && selectedCategory && selectedSeason && (
                  <p className="text-sm text-red-600 mt-1">
                    Žádné týmy nejsou přiřazeny k této kategorii a sezóně
                  </p>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">
                  Debug: Category: {selectedCategory}, Season: {selectedSeason}, Teams:{' '}
                  {filteredTeams.length}
                </div>
                <Select
                  label="Hostující tým"
                  placeholder="Vyberte hostující tým"
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
                {filteredTeams.length === 0 && selectedCategory && selectedSeason && (
                  <p className="text-sm text-red-600 mt-1">
                    Žádné týmy nejsou přiřazeny k této kategorii a sezóně
                  </p>
                )}
              </div>
              <Input
                label="Místo konání"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
                placeholder="Místo konání se automaticky vyplní podle domácího týmu"
              />
              <div>
                <Select
                  label="Kolo"
                  placeholder="Vyberte kolo"
                  selectedKeys={formData.matchweek ? [formData.matchweek.toString()] : []}
                  onSelectionChange={(keys) => {
                    const selectedMatchweek = Array.from(keys)[0] as string;
                    setFormData({...formData, matchweek: selectedMatchweek || '0'});
                  }}
                  className="w-full"
                >
                  {getMatchweekOptions(formData.category_id).map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
              </div>
              <Input
                label="Číslo zápasu"
                placeholder="např. 1, 2, Finále, Semifinále"
                value={formData.match_number?.toString() || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    match_number: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onClose}>
              {translations.button.cancel}
            </Button>
            <Button color="primary" onPress={onAddMatch}>
              {translations.button.add}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
