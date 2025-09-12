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
    // Handle NumberInput which can return either a number or ChangeEvent
    const actualValue =
      typeof value === 'object' && value !== null && 'target' in value ? value.target.value : value;

    onResultDataChange({
      ...resultData,
      [field]: actualValue,
    });
  };

  const t = translations.match;

  const ResultInput = ({
    label,
    value,
    onChange,
    isDisabled,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    isDisabled: boolean;
  }) => {
    return (
      <div className="flex-1 w-full">
        <NumberInput
          label={label}
          value={value}
          onChange={(value) => onChange(value as number)}
          isDisabled={isDisabled}
          classNames={{
            base: 'w-[180px]',
          }}
        />
      </div>
    );
  };

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
          <div className="flex flex-row items-center gap-2 sm:gap-4">
            <ResultInput
              label={`${selectedMatch.home_team?.name || t.homeTeam}`}
              value={resultData.home_score}
              onChange={(value) => handleScoreChange('home_score', value)}
              isDisabled={isSeasonClosed}
            />
            <span className="hidden sm:block text-2xl font-bold text-center">:</span>
            <ResultInput
              label={`${selectedMatch.away_team?.name || t.awayTeam}`}
              value={resultData.away_score}
              onChange={(value) => handleScoreChange('away_score', value)}
              isDisabled={isSeasonClosed}
            />
          </div>
          <div className="flex justify-center items-center space-y-2">
            <Heading size={5}>{t.halftime}</Heading>
          </div>
          <div className="flex flex-row items-center gap-2 sm:gap-4">
            <ResultInput
              label={`${selectedMatch.home_team?.name || t.homeTeam}`}
              value={resultData.home_score_halftime}
              onChange={(value) => handleScoreChange('home_score_halftime', value)}
              isDisabled={isSeasonClosed}
            />
            <span className="text-2xl hidden sm:block font-bold text-center">:</span>
            <ResultInput
              label={`${selectedMatch.away_team?.name || t.awayTeam}`}
              value={resultData.away_score_halftime}
              onChange={(value) => handleScoreChange('away_score_halftime', value)}
              isDisabled={isSeasonClosed}
            />
          </div>
        </div>
      )}
    </UnifiedModal>
  );
}
