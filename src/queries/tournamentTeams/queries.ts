import {supabaseBrowserClient} from '@/utils/supabase/client';

import {DB_TABLE} from './constants';

export async function fetchTournamentTeams(tournamentId: string) {
  const supabase = supabaseBrowserClient();

  const {data, error} = await supabase
    .from(DB_TABLE)
    .select(
      `
      id,
      tournament_id,
      team_id,
      seed_order,
      team:club_category_teams(
        id,
        team_suffix,
        club_category:club_categories(
          club:clubs(id, name, short_name, logo_url)
        )
      )
    `
    )
    .eq('tournament_id', tournamentId)
    .order('seed_order', {ascending: true});

  if (error) throw error;
  return data;
}
