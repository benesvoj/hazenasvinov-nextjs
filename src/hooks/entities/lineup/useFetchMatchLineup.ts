'use client';

import {useQuery, useQueryClient} from '@tanstack/react-query';

import {useSupabaseClient} from '@/hooks';
import {LineupCoach, LineupPlayer} from '@/types';

/**
 * Ze `members` se tahá jen tolik, kolik potřebuje jméno v sestavě. Sdílený
 * `Member` je proto na tenhle join moc široký.
 */
export interface MatchLineupMember {
  id: string;
  name: string;
  surname: string;
  registration_number: string | null;
}

export interface MatchLineupPlayer extends Omit<LineupPlayer, 'member'> {
  member?: MatchLineupMember | null;
}

export interface MatchLineupCoach extends Omit<LineupCoach, 'member'> {
  member?: MatchLineupMember | null;
}

export interface MatchLineup {
  players: MatchLineupPlayer[];
  coaches: MatchLineupCoach[];
}

const EMPTY_LINEUP: MatchLineup = {players: [], coaches: []};

export function matchLineupQueryKey(matchId: string, teamId: string) {
  return ['match-lineup', matchId, teamId] as const;
}

/**
 * Sestava jednoho týmu v jednom zápase, včetně gólů a karet.
 *
 * Čte skutečné tabulky `lineups` / `lineup_players` / `lineup_coaches` — ne
 * `match_metadata`, kde detail zápasu u trenéra hledal sestavu dřív a kde nikdy
 * nic nebylo, protože zapisovací cesta (LineupManager) ukládá sem.
 *
 * Read-only. Zápis zůstává v useLineupData, kterou používá LineupManager.
 */
export function useFetchMatchLineup(matchId?: string, teamId?: string) {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: matchLineupQueryKey(matchId ?? '', teamId ?? ''),
    queryFn: async (): Promise<MatchLineup> => {
      const {data: lineup, error: lineupError} = await supabase
        .from('lineups')
        .select('id')
        .eq('match_id', matchId!)
        .eq('team_id', teamId!)
        .maybeSingle();

      if (lineupError) throw lineupError;
      if (!lineup) return EMPTY_LINEUP;

      const [playersResult, coachesResult] = await Promise.all([
        supabase
          .from('lineup_players')
          .select('*, member:members(id, name, surname, registration_number)')
          .eq('lineup_id', lineup.id),
        supabase
          .from('lineup_coaches')
          .select('*, member:members(id, name, surname, registration_number)')
          .eq('lineup_id', lineup.id),
      ]);

      if (playersResult.error) throw playersResult.error;
      if (coachesResult.error) throw coachesResult.error;

      return {
        players: (playersResult.data ?? []) as unknown as MatchLineupPlayer[],
        coaches: (coachesResult.data ?? []) as unknown as MatchLineupCoach[],
      };
    },
    // Zápas nemusí mít oba týmy vyplněné. Prázdné id by Postgres odmítl jako
    // "invalid input syntax for type uuid".
    enabled: !!matchId && !!teamId,
    staleTime: 60 * 1000,
  });

  const invalidateLineup = () => {
    queryClient.invalidateQueries({queryKey: matchLineupQueryKey(matchId ?? '', teamId ?? '')});
  };

  return {
    lineup: query.data ?? EMPTY_LINEUP,
    isLoading: query.isLoading,
    error: query.error,
    invalidateLineup,
  };
}
