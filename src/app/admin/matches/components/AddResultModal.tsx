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
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="sm"
      classNames={{
        base: "max-w-[95vw] sm:max-w-xl mx-2",
        wrapper: "items-center justify-center p-2 sm:p-4",
        body: "px-4 py-4",
        header: "px-4 py-4",
        footer: "px-4 py-4"
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Přidat výsledek</h2>
        </ModalHeader>
        <ModalBody>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">
                  {selectedMatch.home_team?.name || 'Neznámý tým'} vs {selectedMatch.away_team?.name || 'Neznámý tým'}
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(selectedMatch.date).toLocaleDateString('cs-CZ')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <div className="flex-1 w-full">
                  <Input
                    label={`Skóre ${selectedMatch.home_team?.name || 'Domácí tým'}`}
                    type="number"
                    value={resultData.home_score}
                    onChange={(e) => handleScoreChange('home_score', e.target.value)}
                    isDisabled={isSeasonClosed}
                    className="w-full"
                    size="lg"
                  />
                </div>
                <span className="text-2xl font-bold text-center">:</span>
                <div className="flex-1 w-full">
                  <Input
                    label={`Skóre ${selectedMatch.away_team?.name || 'Hostující tým'}`}
                    type="number"
                    value={resultData.away_score}
                    onChange={(e) => handleScoreChange('away_score', e.target.value)}
                    isDisabled={isSeasonClosed}
                    className="w-full"
                    size="lg"
                  />
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            color="danger" 
            variant="flat" 
            onPress={onClose}
            className="w-full sm:w-auto"
            size="lg"
          >
            Zrušit
          </Button>
          <Button 
            color="primary" 
            onPress={onUpdateResult}
            isDisabled={isSeasonClosed}
            className="w-full sm:w-auto"
            size="lg"
          >
            Uložit výsledek
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
