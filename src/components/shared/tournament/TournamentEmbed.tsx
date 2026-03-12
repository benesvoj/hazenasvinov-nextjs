'use client';

import {useEffect, useState} from 'react';

import {TrophyIcon} from '@heroicons/react/24/outline';

import {API_ROUTES} from '@/lib/api-routes';

import {Heading, HStack, LoadingSpinner, UnifiedStandingTable} from '@/components';
import {EnhancedStanding, TournamentMatch} from '@/types';

interface TournamentEmbedProps {
  tournamentId: string;
}

function getTeamName(team: TournamentMatch['home_team']): string {
  const club = team?.club_category?.club;
  return `${club?.short_name || club?.name || ''} ${team?.team_suffix || ''}`.trim();
}

export function TournamentEmbed({tournamentId}: TournamentEmbedProps) {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [standings, setStandings] = useState<EnhancedStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_ROUTES.tournaments.matches(tournamentId));
        const {data} = await res.json();
        setMatches(data || []);

        // Standings are fetched from the parent tournament, but
        // for embed we only show completed match results
      } catch (err) {
        console.error('Error fetching tournament embed data:', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [tournamentId]);

  if (loading) return <LoadingSpinner />;
  if (matches.length === 0 && standings.length === 0) return null;

  const completedMatches = matches.filter((m) => m.status === 'completed').slice(-5);

  return (
    <div className="space-y-6 my-8 p-4 bg-gray-50 rounded-lg border">
      <HStack spacing={2}>
        <TrophyIcon className="w-5 h-5 text-yellow-600" />
        <Heading size={3}>Turnaj</Heading>
      </HStack>

      {standings.length > 0 && <UnifiedStandingTable standings={standings} responsive />}

      {completedMatches.length > 0 && (
        <div className="space-y-1">
          {completedMatches.map((match) => (
            <div key={match.id} className="flex items-center gap-2 text-sm py-1">
              <span className="min-w-[80px] text-right">{getTeamName(match.home_team)}</span>
              <span className="font-bold">
                {match.home_score} : {match.away_score}
              </span>
              <span className="min-w-[80px]">{getTeamName(match.away_team)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
