'use client';

import {useState} from 'react';

import {Button} from '@heroui/button';

import {translations} from '@/lib/translations';

import {ContentCard, EmptyState, HStack, showToast, UnifiedStandingTable} from '@/components';
import {useFetchTournamentStandings} from '@/hooks';
import {calculateTournamentStandings, generateInitialTournamentStandings} from '@/utils';

interface StandingsTabProps {
  tournamentId: string;
}

const t = translations.tournaments;

export function StandingsTab({tournamentId}: StandingsTabProps) {
  const {standings, loading, fetchStandings} = useFetchTournamentStandings(tournamentId);
  const [actionLoading, setActionLoading] = useState(false);

  const hasStandings = standings.length > 0;

  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      const result = await generateInitialTournamentStandings(tournamentId);
      if (result.success) {
        await fetchStandings();
        showToast.success(t.responseMessages.standingsGenerated);
      } else {
        showToast.danger(result.error || t.responseMessages.fetchFailed);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setActionLoading(true);
    try {
      const result = await calculateTournamentStandings(tournamentId);
      if (result.success) {
        await fetchStandings();
        showToast.success(t.responseMessages.standingsRecalculated);
      } else {
        showToast.danger(result.error || t.responseMessages.fetchFailed);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (!hasStandings && !loading) {
    return (
      <ContentCard>
        <EmptyState
          type="matches"
          title={t.labels.standings}
          description={t.public.noStandings}
          action={
            <Button color="primary" onPress={handleGenerate} isLoading={actionLoading}>
              {t.actions.generateStandings}
            </Button>
          }
        />
      </ContentCard>
    );
  }

  const actions = (
    <HStack spacing={2}>
      <Button
        size="sm"
        color="primary"
        variant="flat"
        onPress={handleRecalculate}
        isLoading={actionLoading}
      >
        {t.actions.recalculateStandings}
      </Button>
    </HStack>
  );

  return (
    <ContentCard title={t.labels.standings} actions={actions} isLoading={loading}>
      <UnifiedStandingTable
        standings={standings}
        loading={loading}
        emptyContent={
          <EmptyState
            type="matches"
            title={t.public.noStandings}
            description={t.public.noStandings}
          />
        }
      />
    </ContentCard>
  );
}
