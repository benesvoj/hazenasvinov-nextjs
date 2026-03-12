'use client';

import {useMemo, useState} from 'react';

import {Input} from '@heroui/input';

import {translations} from '@/lib/translations';

import {Dialog, HStack, VStack} from '@/components';
import {TournamentMatch} from '@/types';

const t = translations.tournaments;

function getTeamName(team: TournamentMatch['home_team']): string {
  const club = team.club_category?.club;
  return `${club?.short_name || club?.name || ''} ${team.team_suffix || ''}`.trim();
}

interface ScoreFormData {
  homeScore: string;
  awayScore: string;
  homeHalftime: string;
  awayHalftime: string;
}

interface MatchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: TournamentMatch | null;
  onSave: (
    matchId: string,
    data: {
      home_score: number;
      away_score: number;
      home_score_halftime: number;
      away_score_halftime: number;
    }
  ) => Promise<boolean>;
  isLoading: boolean;
}

export const MatchResultModal = ({
  isOpen,
  onClose,
  match,
  onSave,
  isLoading,
}: MatchResultModalProps) => {
  const initialValues = useMemo<ScoreFormData>(
    () => ({
      homeScore: match?.home_score?.toString() ?? '',
      awayScore: match?.away_score?.toString() ?? '',
      homeHalftime: match?.home_score_halftime?.toString() ?? '',
      awayHalftime: match?.away_score_halftime?.toString() ?? '',
    }),
    [match]
  );

  const [form, setForm] = useState<ScoreFormData>(initialValues);

  // Reset form when match changes (modal opens with new match)
  const [prevMatch, setPrevMatch] = useState<TournamentMatch | null>(null);
  if (match !== prevMatch) {
    setPrevMatch(match);
    if (match) {
      setForm({
        homeScore: match.home_score?.toString() ?? '',
        awayScore: match.away_score?.toString() ?? '',
        homeHalftime: match.home_score_halftime?.toString() ?? '',
        awayHalftime: match.away_score_halftime?.toString() ?? '',
      });
    }
  }

  const updateField = (field: keyof ScoreFormData) => (value: string) => {
    setForm((prev) => ({...prev, [field]: value}));
  };

  const handleSubmit = async () => {
    if (!match) return;

    await onSave(match.id, {
      home_score: parseInt(form.homeScore) || 0,
      away_score: parseInt(form.awayScore) || 0,
      home_score_halftime: parseInt(form.homeHalftime) || 0,
      away_score_halftime: parseInt(form.awayHalftime) || 0,
    });

    onClose();
  };

  if (!match) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      title={t.modal.resultTitle}
      submitButtonLabel={translations.common.actions.save}
    >
      <VStack spacing={4} align="stretch">
        <HStack spacing={2} justify="center">
          <span className="font-semibold">{getTeamName(match.home_team)}</span>
          <span>vs</span>
          <span className="font-semibold">{getTeamName(match.away_team)}</span>
        </HStack>

        <div>
          <p className="text-sm font-medium mb-2">{t.labels.matchResult}</p>
          <HStack spacing={2} justify="center" align="center">
            <Input
              type="number"
              label={t.labels.homeScore}
              value={form.homeScore}
              onValueChange={updateField('homeScore')}
              size="sm"
              className="w-24"
              min={0}
            />
            <span className="text-lg font-bold">:</span>
            <Input
              type="number"
              label={t.labels.awayScore}
              value={form.awayScore}
              onValueChange={updateField('awayScore')}
              size="sm"
              className="w-24"
              min={0}
            />
          </HStack>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">{t.labels.halftimeScore}</p>
          <HStack spacing={2} justify="center" align="center">
            <Input
              type="number"
              label={t.labels.homeScore}
              value={form.homeHalftime}
              onValueChange={updateField('homeHalftime')}
              size="sm"
              className="w-24"
              min={0}
            />
            <span className="text-lg font-bold">:</span>
            <Input
              type="number"
              label={t.labels.awayScore}
              value={form.awayHalftime}
              onValueChange={updateField('awayHalftime')}
              size="sm"
              className="w-24"
              min={0}
            />
          </HStack>
        </div>
      </VStack>
    </Dialog>
  );
};
