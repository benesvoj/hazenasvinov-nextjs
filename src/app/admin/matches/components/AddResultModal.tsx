'use client';

import React from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Match } from "@/types";

interface AddResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMatch: Match | null;
  resultData: {
    home_score: string;
    away_score: string;
  };
  onResultDataChange: (data: { home_score: string; away_score: string }) => void;
  onUpdateResult: () => void;
  isSeasonClosed: boolean;
}

export default function AddResultModal({
  isOpen,
  onClose,
  selectedMatch,
  resultData,
  onResultDataChange,
  onUpdateResult,
  isSeasonClosed
}: AddResultModalProps) {
  const handleScoreChange = (field: 'home_score' | 'away_score', value: string) => {
    onResultDataChange({
      ...resultData,
      [field]: value
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Přidat výsledek</ModalHeader>
        <ModalBody>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">
                  {selectedMatch.home_team?.name || 'Neznámý tým'} vs {selectedMatch.away_team?.name || 'Neznámý tým'}
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(selectedMatch.date).toLocaleDateString('cs-CZ')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  label={`Skóre ${selectedMatch.home_team?.name || 'Domácí tým'}`}
                  type="number"
                  value={resultData.home_score}
                  onChange={(e) => handleScoreChange('home_score', e.target.value)}
                  isDisabled={isSeasonClosed}
                />
                <span className="text-2xl font-bold">:</span>
                <Input
                  label={`Skóre ${selectedMatch.away_team?.name || 'Hostující tým'}`}
                  type="number"
                  value={resultData.away_score}
                  onChange={(e) => handleScoreChange('away_score', e.target.value)}
                  isDisabled={isSeasonClosed}
                />
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="flat" onPress={onClose}>
            Zrušit
          </Button>
          <Button 
            color="primary" 
            onPress={onUpdateResult}
            isDisabled={isSeasonClosed}
          >
            Uložit výsledek
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
