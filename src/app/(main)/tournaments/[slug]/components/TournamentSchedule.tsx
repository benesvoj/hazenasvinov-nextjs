'use client';

import {useMemo} from 'react';

import {translations} from '@/lib/translations';

import {ContentCard, EmptyState, Heading, HStack, VStack} from '@/components';
import {formatHalftime, formatScore, formatTime, getTeamName, normalizeMatchTime} from '@/helpers';
import {TournamentMatch} from '@/types';
import {isNotNilOrEmpty} from '@/utils';

const t = translations.tournaments;

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
              {roundMatches
                .sort((a, b) => {
                  const timeA = normalizeMatchTime(a.time);
                  const timeB = normalizeMatchTime(b.time);
                  return timeA.localeCompare(timeB);
                })
                .map((match) => {
                  const halftime = formatHalftime(match);
                  const normalizedTime = normalizeMatchTime(match.time);
                  return (
                    <div
                      key={match.id}
                      className="flex items-center justify-between rounded-lg border border-default-200 px-4 py-2"
                    >
                      <HStack spacing={3} align="center">
                        {isNotNilOrEmpty(match.time) && normalizedTime !== '00:00' && (
                          <span className="text-sm min-w-[100px] text-right">
                            {formatTime(match.time)}
                          </span>
                        )}
                        <span className="text-sm min-w-[100px] text-right">
                          {getTeamName(match.home_team)}
                        </span>
                        <span className="text-sm font-bold min-w-[50px] text-center">
                          {formatScore(match)}
                        </span>
                        <span className="text-sm min-w-[100px]">
                          {getTeamName(match.away_team)}
                        </span>
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
