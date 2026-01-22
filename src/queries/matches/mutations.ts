import {MatchStatus} from '@/enums';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {Match} from '@/types';

import {DB_TABLE, ENTITY} from './constants';
import {MatchInsertData, MatchUpdateData} from './types';

/**
 * CRUD mutations for matches
 * Uses memoized createMutationHelpers factory
 */

let helpers: ReturnType<typeof createMutationHelpers<Match, MatchInsertData>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Match, MatchInsertData>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const createMatch = (ctx: QueryContext, data: MatchInsertData) =>
  getHelpers().create(ctx, data);

export const updateMatch = (ctx: QueryContext, id: string, data: Partial<MatchUpdateData>) =>
  getHelpers().update(ctx, id, data);

export const deleteMatch = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);

/**
 * Bulk update matchweek for multiple matches
 */
export async function bulkUpdateMatchweek(
  ctx: QueryContext,
  matchIds: string[],
  matchweek: number | null
) {
  try {
    const {error} = await ctx.supabase.from(DB_TABLE).update({matchweek}).in('id', matchIds);

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: {success: true, count: matchIds.length}, error: null};
  } catch (err: any) {
    console.error('Exception in bulkUpdateMatchweek:', err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

/**
 * Delete all matches for a season
 */
export async function deleteMatchesBySeason(ctx: QueryContext, seasonId: string) {
  try {
    const {error} = await ctx.supabase.from(DB_TABLE).delete().eq('season_id', seasonId);

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: {success: true}, error: null};
  } catch (err: any) {
    console.error('Exception in deleteMatchesBySeason:', err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

/**
 * Update match result
 */
export async function updateMatchResult(
  ctx: QueryContext,
  matchId: string,
  data: {
    home_score: number;
    away_score: number;
    home_score_halftime: number;
    away_score_halftime: number;
  }
) {
  try {
    const {data: match, error} = await ctx.supabase
      .from(DB_TABLE)
      .update({
        ...data,
        status: MatchStatus.COMPLETED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: match as Match, error: null};
  } catch (err: any) {
    console.error('Exception in updateMatchResult:', err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}
