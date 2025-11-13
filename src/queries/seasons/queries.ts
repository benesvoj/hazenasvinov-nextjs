import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {GetSeasonsOptions} from '@/queries/seasons/types';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Season} from '@/types';

export async function getAllSeasons(
  ctx: QueryContext,
  options?: GetSeasonsOptions
): Promise<QueryResult<Season[]>> {
  try {
    const defaultSorting = [{column: 'start_date', ascending: false}];

    const query = buildSelectQuery(ctx.supabase, 'seasons', {
      sorting: options?.sorting ?? defaultSorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    // Handle malformed Supabase error (bug when pagination is beyond available records)
    const paginationBugResult = handleSupabasePaginationBug<Season>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as unknown as Season[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error('Exception in getAllSeasons:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

export async function getSeasonById(ctx: QueryContext, id: string): Promise<QueryResult<Season>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, 'seasons', id);

    const {data, error} = await query;

    if (error) {
      console.error('Error fetching season:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as Season,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in getSeasonById:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
