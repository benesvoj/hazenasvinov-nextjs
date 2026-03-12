'use client';

import {useMemo} from 'react';

import {translations} from '@/lib/translations';

import {ContentCard, EmptyState, Heading, HStack, VStack} from '@/components';
import {TournamentMatch} from '@/types';

const t = translations.tournaments;

function getTeamName(team: TournamentMatch['home_team']): string {
  const club = team?.club_category?.club;
  return `${club?.short_name || club?.name || ''} ${team?.team_suffix || ''}`.trim();
}

function formatScore(match: TournamentMatch): string {
  if (match.home_score === null || match.away_score === null) return '— : —';
  return `${match.home_score} : ${match.away_score}`;
}

function formatHalftime(match: TournamentMatch): string | null {
  if (match.home_score_halftime === null || match.away_score_halftime === null) return null;
  return `(${match.home_score_halftime}:${match.away_score_halftime})`;
}

interface TournamentScheduleProps {
  matches: TournamentMatch[];
}

export function TournamentSchedule({matches}: TournamentScheduleProps) {
  const matchesByRound = useMemo(() => {
    const grouped = new Map<number, TournamentMatch[]>();
    matches.forEach((match) => {
      const round = match.round ?? 0;
      if (!grouped.has(round)) grouped.set(round, []);
      grouped.get(round)!.push(match);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [matches]);

  if (matches.length === 0) {
    return <EmptyState type="matches" title={t.public.noMatches} description="" />;
  }

  return (
    <ContentCard title={t.public.schedule}>
      <VStack spacing={6} align="stretch">
        {matchesByRound.map(([round, roundMatches]) => (
          <div key={round}>
            <Heading size={3}>{`${t.labels.round} ${round}`}</Heading>
            <VStack spacing={2} align="stretch">
              {roundMatches.map((match) => {
                const halftime = formatHalftime(match);
                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between rounded-lg border border-default-200 px-4 py-2"
                  >
                    <HStack spacing={3} align="center">
                      <span className="text-sm min-w-[100px] text-right">
                        {getTeamName(match.home_team)}
                      </span>
                      <span className="text-sm font-bold min-w-[50px] text-center">
                        {formatScore(match)}
                      </span>
                      <span className="text-sm min-w-[100px]">{getTeamName(match.away_team)}</span>
                      {halftime && <span className="text-xs text-default-400">{halftime}</span>}
                    </HStack>
                  </div>
                );
              })}
            </VStack>
          </div>
        ))}
      </VStack>
    </ContentCard>
  );
}
