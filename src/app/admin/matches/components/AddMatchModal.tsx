import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/react";
import { FilteredTeam } from "@/types";
import { translations } from "@/lib/translations";

interface AddMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMatch: () => void;
  formData: {
    date: string;
    time: string;
    home_team_id: string;
    away_team_id: string;
    venue?: string;
    category_id: string;
    season_id: string;
    matchweek?: string;
    match_number?: string;
  };
  setFormData: (data: any) => void;
  filteredTeams: FilteredTeam[];
  selectedCategory: string;
  selectedSeason: string;
  getMatchweekOptions: (categoryId: string) => Array<{ value: string; label: string }>;
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
  getMatchweekOptions
}: AddMatchModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Přidat nový zápas</ModalHeader>
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
                Debug: Category: {selectedCategory}, Season: {selectedSeason}, Teams: {filteredTeams.length}
              </div>
              <Select
                label="Domácí tým"
                placeholder="Vyberte domácí tým"
                selectedKeys={formData.home_team_id ? [formData.home_team_id] : []}
                onSelectionChange={(keys) => {
                  const selectedTeamId = Array.from(keys)[0] as string;
                  const selectedTeam = filteredTeams.find(team => team.id === selectedTeamId);
                  setFormData({
                    ...formData, 
                    home_team_id: selectedTeamId || "",
                    venue: formData.venue
                  });
                }}
                className="w-full"
                isRequired
              >
                {filteredTeams.map((team) => (
                  <SelectItem key={team.id}>
                    {team.display_name || team.name}
                  </SelectItem>
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
                Debug: Category: {selectedCategory}, Season: {selectedSeason}, Teams: {filteredTeams.length}
              </div>
              <Select
                label="Hostující tým"
                placeholder="Vyberte hostující tým"
                selectedKeys={formData.away_team_id ? [formData.away_team_id] : []}
                onSelectionChange={(keys) => {
                  const selectedTeamId = Array.from(keys)[0] as string;
                  setFormData({...formData, away_team_id: selectedTeamId || ""});
                }}
                className="w-full"
                isRequired
              >
                {filteredTeams.map((team) => (
                  <SelectItem key={team.id}>
                    {team.display_name || team.name}
                  </SelectItem>
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
                selectedKeys={formData.matchweek ? [formData.matchweek] : []}
                onSelectionChange={(keys) => {
                  const selectedMatchweek = Array.from(keys)[0] as string;
                  setFormData({...formData, matchweek: selectedMatchweek || ""});
                }}
                className="w-full"
              >
                {getMatchweekOptions(formData.category_id).map((option) => (
                  <SelectItem key={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <Input
              label="Číslo zápasu"
              placeholder="např. 1, 2, Finále, Semifinále"
              value={formData.match_number}
              onChange={(e) => setFormData({...formData, match_number: e.target.value})}
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
  );
}
