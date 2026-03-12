import {QueryContext, QueryResult} from '@/queries/shared/types';
import {TournamentTeamQuery} from '@/types';

import {DB_TABLE} from './constants';

export async function getAllTournamentTeams(
  ctx: QueryContext,
  tournamentId: string
): Promise<QueryResult<TournamentTeamQuery[]>> {
  try {
    const {data, error} = await ctx.supabase
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

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as TournamentTeamQuery[],
      error,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
