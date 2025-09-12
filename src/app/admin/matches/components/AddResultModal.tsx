'use client';

import React, {ChangeEvent} from 'react';
import {Match} from '@/types';
import {NumberInput} from '@heroui/react';
import {Heading, UnifiedModal} from '@/components';
import {translations} from '@/lib/translations';
import {formatDateString} from '@/helpers';
interface AddResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMatch: Match | null;
  resultData: {
    home_score: number;
    away_score: number;
    home_score_halftime: number;
    away_score_halftime: number;
  };
  onResultDataChange: (data: {
    home_score: number;
    away_score: number;
    home_score_halftime: number;
    away_score_halftime: number;
  }) => void;
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
  isSeasonClosed,
}: AddResultModalProps) {
  const handleScoreChange = (
    field: 'home_score' | 'away_score' | 'home_score_halftime' | 'away_score_halftime',
    value: number | ChangeEvent<HTMLInputElement>
  ) => {
    onResultDataChange({
      ...resultData,
      [field]: value,
    });
  };

  const t = translations.match;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t.addResult}
      isFooterWithActions
      onPress={onUpdateResult}
      isDisabled={isSeasonClosed}
    >
      {selectedMatch && (
        <div className="space-y-4">
          <div className="text-center">
            <Heading size={3}>
              {selectedMatch.home_team?.name || t.unknownTeam} vs{' '}
              {selectedMatch.away_team?.name || t.unknownTeam}
            </Heading>
            <p className="text-sm text-gray-600">{formatDateString(selectedMatch.date)}</p>
          </div>
          <div className="flex justify-center items-center space-y-2">
            <Heading size={4}>{t.result}</Heading>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="flex-1 w-full">
              <NumberInput
                label={`Skóre ${selectedMatch.home_team?.name || t.homeTeam}`}
                value={resultData.home_score}
                onChange={(value) => handleScoreChange('home_score', value)}
                isDisabled={isSeasonClosed}
              />
            </div>
            <span className="text-2xl font-bold text-center">:</span>
            <div className="flex-1 w-full">
              <NumberInput
                label={`Skóre ${selectedMatch.away_team?.name || t.awayTeam}`}
                value={resultData.away_score}
                onChange={(value) => handleScoreChange('away_score', value)}
                isDisabled={isSeasonClosed}
              />
            </div>
          </div>
          <div className="flex justify-center items-center space-y-2">
            <Heading size={5}>{t.halftime}</Heading>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="flex-1 w-full">
              <NumberInput
                label={`${t.halftime} ${selectedMatch.home_team?.name || t.homeTeam}`}
                value={resultData.home_score_halftime}
                onChange={(value) => handleScoreChange('home_score_halftime', value)}
                isDisabled={isSeasonClosed}
              />
            </div>
            <span className="text-2xl font-bold text-center">:</span>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <div className="flex-1 w-full">
                <NumberInput
                  label={`${t.halftime} ${selectedMatch.away_team?.name || t.awayTeam}`}
                  value={resultData.away_score_halftime}
                  onChange={(value) => handleScoreChange('away_score_halftime', value)}
                  isDisabled={isSeasonClosed}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </UnifiedModal>
  );
}
