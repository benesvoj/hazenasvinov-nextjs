import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Season, SeasonInsert} from '@/types';

export async function createSeason(
  ctx: QueryContext,
  data: SeasonInsert
): Promise<QueryResult<Season>> {
  try {
    const query = buildInsertQuery(ctx.supabase, 'seasons', data);
    const {data: season, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: season as unknown as Season,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in createSeason:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function updateSeason(
  ctx: QueryContext,
  id: string,
  data: Partial<SeasonInsert>
): Promise<QueryResult<Season>> {
  try {
    const query = buildUpdateQuery(ctx.supabase, 'seasons', id, data);
    const {data: season, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }
    return {
      data: season as unknown as Season,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in updateSeason:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function deleteSeason(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<{success: boolean}>> {
  try {
    const query = buildDeleteQuery(ctx.supabase, 'seasons', id);
    const {error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: {success: true},
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in deleteSeason:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
