'use client';

import React from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Match } from "@/types/types";
import { FilteredTeam } from "@/hooks/useFilteredTeams";

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMatch: Match | null;
  editData: {
    date: string;
    time: string;
    home_team_id: string;
    away_team_id: string;
    venue?: string;
    home_score: string;
    away_score: string;
    status: 'upcoming' | 'completed';
    matchweek?: string;
    match_number?: string;
    category_id: string;
  };
  onEditDataChange: (data: any) => void;
  onUpdateMatch: () => void;
  teams: FilteredTeam[];
  getMatchweekOptions: (categoryId?: string) => Array<{ value: string; label: string }>;
  isSeasonClosed: boolean;
}

export default function EditMatchModal({
  isOpen,
  onClose,
  selectedMatch,
  editData,
  onEditDataChange,
  onUpdateMatch,
  teams,
  getMatchweekOptions,
  isSeasonClosed
}: EditMatchModalProps) {
  
  // Debug: Log teams data when modal opens
  React.useEffect(() => {
    if (isOpen) {
      console.log('🔍 EditMatchModal opened with teams:', {
        teamsCount: teams.length,
        teams: teams.map(t => ({ id: t.id, name: t.name, display_name: t.display_name })),
        selectedMatch: selectedMatch?.id,
        editData: {
          home_team_id: editData.home_team_id,
          away_team_id: editData.away_team_id
        }
      });
    }
  }, [isOpen, teams, selectedMatch, editData]);
  const handleInputChange = (field: string, value: string) => {
    onEditDataChange({
      ...editData,
      [field]: value
    });
  };

  const handleSelectChange = (field: string, keys: any) => {
    const selectedValue = Array.from(keys)[0] as string;
    
    // Auto-populate venue when home team is selected
    if (field === 'home_team_id' && selectedValue) {
      const selectedTeam = teams.find(team => team.id === selectedValue);
      if (selectedTeam?.venue) {
        onEditDataChange({
          ...editData,
          [field]: selectedValue || "",
          venue: selectedTeam.venue
        });
        return;
      }
    }
    
    onEditDataChange({
      ...editData,
      [field]: selectedValue || ""
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        <ModalHeader>Upravit zápas</ModalHeader>
        <ModalBody>
          {selectedMatch && (
            <>
              {/* Debug info */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <strong>Debug Info:</strong> Teams loaded: {teams.length} | 
                Home team: {editData.home_team_id} | 
                Away team: {editData.away_team_id}
              </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Základní údaje</h4>
                <Input
                  label="Datum"
                  type="date"
                  value={editData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  isDisabled={isSeasonClosed}
                  isRequired
                />
                <Input
                  label="Čas"
                  type="time"
                  value={editData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  isDisabled={isSeasonClosed}
                  isRequired
                />
                <Input
                  label="Místo konání"
                  value={editData.venue || ""}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  isDisabled={isSeasonClosed}
                  placeholder="Místo konání se automaticky vyplní podle domácího týmu"
                />
                <div>
                  <Select
                    label="Kolo"
                    placeholder="Vyberte kolo"
                    selectedKeys={editData.matchweek ? [editData.matchweek] : []}
                    onSelectionChange={(keys) => handleSelectChange('matchweek', keys)}
                    className="w-full"
                    isDisabled={isSeasonClosed}
                  >
                    {getMatchweekOptions(editData.category_id).map((option) => (
                      <SelectItem key={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <Input
                  label="Číslo zápasu"
                  placeholder="např. 1, 2, Finále, Semifinále"
                  value={editData.match_number}
                  onChange={(e) => handleInputChange('match_number', e.target.value)}
                  isDisabled={isSeasonClosed}
                />
                <div>
                  <Select
                    label="Status"
                    placeholder="Vyberte status"
                    selectedKeys={editData.status ? [editData.status] : []}
                    onSelectionChange={(keys) => handleSelectChange('status', keys)}
                    className="w-full"
                    isDisabled={isSeasonClosed}
                  >
                    <SelectItem key="upcoming">Nadcházející</SelectItem>
                    <SelectItem key="completed">Ukončený</SelectItem>
                  </Select>
                </div>
              </div>

              {/* Right Column - Teams & Scores */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Týmy & Skóre</h4>
                <div>
                  <Select
                    label="Domácí tým"
                    placeholder="Vyberte domácí tým"
                    selectedKeys={editData.home_team_id ? [editData.home_team_id] : []}
                    onSelectionChange={(keys) => handleSelectChange('home_team_id', keys)}
                    className="w-full"
                    isDisabled={isSeasonClosed}
                    isRequired
                  >
                    {teams.map((team) => (
                      <SelectItem key={team.id}>
                        {team.display_name || team.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <Select
                    label="Hostující tým"
                    placeholder="Vyberte hostující tým"
                    selectedKeys={editData.away_team_id ? [editData.away_team_id] : []}
                    onSelectionChange={(keys) => handleSelectChange('away_team_id', keys)}
                    className="w-full"
                    isDisabled={isSeasonClosed}
                    isRequired
                  >
                    {teams.map((team) => (
                      <SelectItem key={team.id}>
                        {team.display_name || team.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                
                {/* Scores - only show if match is completed */}
                {editData.status === 'completed' && (
                  <div className="space-y-4 pt-4 border-t">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">Skóre</h5>
                    <div className="flex items-center space-x-4">
                      <Input
                        label="Domácí skóre"
                        type="number"
                        value={editData.home_score}
                        onChange={(e) => handleInputChange('home_score', e.target.value)}
                        isDisabled={isSeasonClosed}
                      />
                      <span className="text-2xl font-bold">:</span>
                      <Input
                        label="Hostující skóre"
                        type="number"
                        value={editData.away_score}
                        onChange={(e) => handleInputChange('away_score', e.target.value)}
                        isDisabled={isSeasonClosed}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose} aria-label="Zrušit úpravu zápasu">
                  Zrušit
                </Button>
                <Button 
                  color="primary" 
                  onPress={onUpdateMatch}
                  isDisabled={isSeasonClosed}
                  aria-label="Uložit změny zápasu"
                >
                  Uložit změny
                </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
