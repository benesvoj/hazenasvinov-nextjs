'use client';

import {translations} from '@/lib/translations';

import {EmptyState, UnifiedStandingTable} from '@/components';
import {EnhancedStanding} from '@/types';

interface TournamentStandingsProps {
  standings: EnhancedStanding[];
}

export function TournamentStandings({standings}: TournamentStandingsProps) {
  const t = translations.tournaments.public;

  return (
    <UnifiedStandingTable
      standings={standings}
      loading={false}
      emptyContent={<EmptyState type="matches" title={t.noStandings} description="" />}
    />
  );
}
