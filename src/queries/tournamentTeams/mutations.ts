import {QueryContext} from '@/queries/shared/types';

import {DB_TABLE} from './constants';

export async function addTeamToTournament(
  ctx: QueryContext,
  tournamentId: string,
  teamId: string,
  seedOrder: number
) {
  try {
    const {data, error} = await ctx.supabase
      .from(DB_TABLE)
      .insert({tournament_id: tournamentId, team_id: teamId, seed_order: seedOrder})
      .select()
      .single();

    if (error) return {data: null, error: error.message};
    return {data, error: null};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error'};
  }
}

export async function removeTeamFromTournament(
  ctx: QueryContext,
  tournamentId: string,
  teamId: string
) {
  try {
    const {error} = await ctx.supabase
      .from(DB_TABLE)
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId);

    if (error) return {data: null, error: error.message};
    return {data: {success: true}, error: null};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error'};
  }
}

export async function updateSeedOrders(
  ctx: QueryContext,
  tournamentId: string,
  teams: Array<{teamId: string; seedOrder: number}>
) {
  try {
    // Bulk update seed orders
    for (const {teamId, seedOrder} of teams) {
      const {error} = await ctx.supabase
        .from(DB_TABLE)
        .update({seed_order: seedOrder})
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamId);

      if (error) return {data: null, error: error.message};
    }
    return {data: {success: true}, error: null};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error'};
  }
}
