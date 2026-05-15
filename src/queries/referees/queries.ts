import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/referees/constants';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {MatchReferee, Referee} from '@/types';

export async function getAllReferees(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<Referee[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      filters: options?.filters,
      sorting: options?.sorting,
      pagination: options?.pagination,
    });

    const {data, error, count} = await query;

    const paginationBugResult = handleSupabasePaginationBug<Referee>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }
    return {
      data: data as unknown as Referee[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}:`, err);
    return {data: null, error: err.message || 'Unknown error', count: 0};
  }
}

export async function getRefereeById(ctx: QueryContext, id: string): Promise<QueryResult<Referee>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, DB_TABLE, id);
    const {data, error} = await query;

    if (error) {
      console.error(`Error fetching ${ENTITY.singular}:`, error);
      return {data: null, error: error.message};
    }

    return {data: data as unknown as Referee, error: null};
  } catch (err: any) {
    console.error(`Exception in get${ENTITY.singular}ById:`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

export async function getMatchReferees(
  ctx: QueryContext,
  matchId: string
): Promise<QueryResult<MatchReferee[]>> {
  try {
    const {data, error} = await ctx.supabase
      .from('match_referees')
      .select('match_id, referee_id, order, referee:referees(*)')
      .eq('match_id', matchId)
      .order('order');

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: data as unknown as MatchReferee[], error: null};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error'};
  }
}
