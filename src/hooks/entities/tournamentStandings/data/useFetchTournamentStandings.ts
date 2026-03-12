'use client';

import {useCallback, useEffect, useState} from 'react';

import {useSupabaseClient} from '@/hooks/shared/useSupabaseClient';

import {translations} from '@/lib/translations';

import {showToast} from '@/components';
import {EnhancedStanding} from '@/types';

export function useFetchTournamentStandings(tournamentId: string) {
  const [standings, setStandings] = useState<EnhancedStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabaseClient();

  const fetchStandings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {data, error: fetchError} = await supabase
        .from('tournament_standings')
        .select(
          `
					*,
					team:club_category_teams!team_id(
						id,
						team_suffix,
						club_category:club_categories(
							club:clubs(id, name, short_name, logo_url)
						)
					)
				`
        )
        .eq('tournament_id', tournamentId)
        .order('position', {ascending: true});

      if (fetchError) throw fetchError;

      const enhanced: EnhancedStanding[] = (data || []).map((row: any) => {
        const team = row.team;
        const club = team?.club_category?.club;

        return {
          ...row,
          // Required by EnhancedStanding but not in tournament_standings
          category_id: '',
          season_id: '',
          team: team
            ? {
                id: team.id,
                team_suffix: team.team_suffix || 'A',
                club_name: club?.name || 'Neznámý klub',
                club_id: club?.id || null,
                logo_url: club?.logo_url || undefined,
              }
            : null,
          club: club
            ? {
                id: club.id,
                name: club.name,
                short_name: club.short_name,
                logo_url: club.logo_url,
              }
            : null,
        };
      });

      setStandings(enhanced);
    } catch (err: any) {
      const msg = translations.tournaments.responseMessages.fetchFailed;
      setError(msg);
      showToast.danger(msg);
      console.error('Error fetching tournament standings:', err);
      setStandings([]);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, supabase]);

  useEffect(() => {
    void fetchStandings();
  }, [fetchStandings]);

  return {standings, loading, error, fetchStandings};
}
